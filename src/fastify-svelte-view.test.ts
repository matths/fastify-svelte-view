import { describe, it, expect} from 'vitest';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import fastifySvelteView from './fastify-svelte-view';

describe('Fastify Svelte View Integration for CSR', () => {
  const source = `<script lang="ts">
  let { name = '' } = $props();
</script>
<h1>Hello {name}!</h1>
<style>
  h1 {
    color: purple;
  }
</style>`
  let fastify: ReturnType<typeof Fastify>;

  it('should render the Svelte view on GET using CSR', async () => {
        fastify = Fastify();
    fastify.register(fastifySvelteView, {});
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
      const html = await fastify.renderSvelte({
        title: 'Svelte Page',
        props: { name: 'World' },
        mode: 'CSR',
        source
      });
      reply.type('text/html').send(html);
    });
    await fastify.ready();

    const response = await fastify.inject({ method: 'GET', url: '/' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('const app = mount(App');
    expect(response.body).toContain('props: {"name":"World"}');

    await fastify.close();
  });

  it('should render the Svelte view on GET using SSR with hydration', async () => {
        fastify = Fastify();
    fastify.register(fastifySvelteView, {});
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
      const html = await fastify.renderSvelte({
        title: 'Svelte Page',
        props: { name: 'World' },
        mode: 'SSR',
        hydrate: true,
        source
      });
      reply.type('text/html').send(html);
    });
    await fastify.ready();

    const response = await fastify.inject({ method: 'GET', url: '/' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('const app = hydrate(App');
    expect(response.body).toContain('props: {"name":"World"}');
    expect(response.body).toContain('Hello World!');

    await fastify.close();
  });

  it('should render the Svelte view on GET using SSR without hydration', async () => {
        fastify = Fastify();
    fastify.register(fastifySvelteView, {});
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
      const html = await fastify.renderSvelte({
        title: 'Svelte Page',
        props: { name: 'World' },
        mode: 'SSR',
        hydrate: false,
        source
      });
      reply.type('text/html').send(html);
    });
    await fastify.ready();

    const response = await fastify.inject({ method: 'GET', url: '/' });
    expect(response.statusCode).toBe(200);
    expect(response.body).not.toContain('const app = hydrate(App');
    expect(response.body).not.toContain('props: {"name":"World"}');
    expect(response.body).toContain('Hello World!');

    await fastify.close();
  });
});
