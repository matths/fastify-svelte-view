# fastify-svelte-view

A Fastify plugin for rendering Svelte components with support for SSR (Server-Side Rendering), CSR (Client-Side Rendering), and SSR with hydration. This plugin makes it easy to integrate Svelte into your Fastify application, providing flexible rendering options for different use cases.

## Note: Work in Progress
This is a quite new open-source project and still a work in progress. Ideas, feedback, and especially pull requests are very welcome!

## Installation

```bash
npm install fastify-svelte-view
```

## Registering the Plugin

You can register the plugin similar to all the other fastify plugins. Right now you should share the `templateDir` where your .svelte Files are as well as your `layoutTemplate`.

```js
const path = require('path');
const fastify = require('fastify')();
const svelteView = require('fastify-svelte-view');

await fastify.register(svelteView, {
  templateDir: path.join(__dirname, '../views'),
  layoutTemplate: 'layout.html'
});
```

## Layout template

You can specify a layout template (e.g., `layout.html`) to wrap your rendered Svelte components. The layout must include placeholders for the rendered HTML and scripts.

If you do not provide a `layoutTemplate` the plugin gracefully falls back to a default template.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>{% title %}</title>
    {% head %}
  </head>
  <body>
    <div id="app">{% body %}</div>
    {% scripts %}
  </body>
</html>
```

## API

`fastify.renderSvelte(options)`  renders a Svelte component with the given options.

### Options
- `file`: Path to a Svelte component file (relative to `templateDir`).
- `source`: Inline Svelte component source code (string).
- `props`: Props to pass to the component.
- `mode`: `'SSR'` (default) | `'CSR'`.
- `hydrate`: Boolean, enables hydration (default) for SSR output.
- `title`: Optional, sets the page title.

You can use either `file` or `source` to specify the Svelte component.

## Usage Examples

### Rendering a Svelte Component (SSR + Hydration)

The Svelte component is rendered at the server on request. You can use dynamic content within your props. The complete HTML is rendered by the browser and hydrated through client side Javascript to enable user interaction.

```js
fastify.get('/render', async (request, reply) => {
  const html = await fastify.renderSvelte({
    title: 'Svelte Page SSR',
    props: { foo: 'bar' },
    file: 'Example.svelte',
    mode: 'SSR',
    hydrate: true
  });
  reply.type('text/html').send(html);
});
```

### Rendering a Svelte Component (CSR)

This time the Svelte code is provides as a string. Rendering mode is CSR, which means an almost empty HTML container is brought to life on the client side by JavaScript.

```js
fastify.get('/render', async (request, reply) => {
  const html = await fastify.renderSvelte({
    title: 'Svelte Page CSR', // page title
    props: { a: 1, b: 2 }, // props
    mode: 'CSR',
    source: `
      <script>
        import { onMount } from 'svelte';
        let { a = 0, b = 0 } = $props();
        let c = $derived(a + b);

        let count = $state(0);
        const getCount = async () => {
          const result = await fetch('/count');
          count = parseInt(await result.text());
        };

        onMount(getCount);
      </script>
      <h1>Demo</h1>
      <span>a + b = {c}</span>
      <p>This page has been viewed {count} times.</p>
    `
  });
  reply.type('text/html').send(html);
});
```

## Modes

Here's an overview of the architectural differences between the modes to sharpen your mental model.

- **SSR (Server-Side Rendering):**
  - The server renders the Svelte component to HTML and sends it to the client.
  - No interactivity unless hydrated; great for SEO and fast initial paint.

- **SSR + Hydration:**
  - The server renders HTML, then the client loads JavaScript to "hydrate" the page, making it interactive.
  - Best of both worlds: fast initial load, SEO, and interactivity.

- **CSR (Client-Side Rendering):**
  - The server sends a minimal HTML shell and JavaScript bundle to the client.
  - Svelte runs entirely in the browser, rendering the UI after page load.
  - Less SEO, usually for highly interactive apps or SPA (single page applications).

- **SSG (Server-Side Generation):** - not included
  - SSG would happen at _**build time**_ (when the fastify server is started). Feel free to share your ideas about stuff like this with us.
  - **fastify-svelte-view** currently does not provide any caching. We might add this later on. There are ideas for caching, cache-warmup and cache invalidation, but no implementation, yet.

## License
MIT
