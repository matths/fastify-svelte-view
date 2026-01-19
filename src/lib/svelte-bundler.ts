import path from 'path';
import { renderLayout } from './render-layout.js';
import { rollupBundle } from './rollup-bundle.js';
import { svelteSSR } from './svelte-ssr.js';
import type { RenderOptions } from '../types/render-options.type.js';
import type { TemplateOptions } from '../types/template-options.type.js';

export const encode = (str: string) => encodeURIComponent(str).replace(/'/g, "\\'");

export const getClientEntry = (mode?: 'SSR' | 'CSR', file?: string) => {
  const lifecycleMethod = mode === 'SSR' ? 'hydrate' : 'mount';
  const appFile = file ? file : '_app.svelte';
  return `import { ${lifecycleMethod} } from 'svelte';
import App from '${appFile}';

export { ${lifecycleMethod}, App };
`};

export const getScript = (mode: 'SSR' | 'CSR', clientCode: string, props: any) => {
  const lifecycleMethod = mode === 'SSR' ? 'hydrate' : 'mount';
  return `<script type="module">
import { App, ${lifecycleMethod} } from 'data:text/javascript;charset=utf-8,${encode(clientCode)}';

const app = ${lifecycleMethod}(App, {
  target: document.getElementById('app'),
  props: ${JSON.stringify(props)}
});
</script>`;
};

export const build =  async (
  {
    templateDir = '',
    layoutTemplate,
    title,
    file = '',
    source,
    props,
    mode = 'SSR',
    hydrate = true
  }: RenderOptions & TemplateOptions
): Promise<string> => {
  const appFile = file ? path.join(templateDir, file) : '_app.svelte';
  
  let head = '';
  let body = '';
  if (mode !== 'CSR') {
    const serverCode = await rollupBundle('server', { source, file: appFile });
    ({ head, body } = await svelteSSR(serverCode, props));
  }

  let scriptTag = '';
  if (mode === 'CSR' || (mode === 'SSR' && hydrate)) {
    const clientCode = await rollupBundle('client', { source, file: appFile, clientEntry: getClientEntry(mode, appFile) });
    scriptTag = getScript(mode, clientCode, props);
  }

  return await renderLayout(title, head , body, scriptTag, templateDir, layoutTemplate);
};

export default build;
