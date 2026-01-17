
import { rollup } from 'rollup';
import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import { sveltePreprocess } from 'svelte-preprocess';

const suppressSvelteCircularDependencyWarnings = (warning: any, warn: (warning: any) => void) => {
  if (
    warning.code === 'CIRCULAR_DEPENDENCY' &&
    warning.message.includes('svelte')
  ) {
    return;
  }
  warn(warning);
};

const resolveFileWithString = (name: string, source: string) => ({
  name: `resolve-file-with-string-${name}`,
  resolveId(id: string) {
    if (id === name) return id;
  },
  load(id: string) {
    if (id === name) return source;
  }
})

export const rollupBundle = async (target: 'server' | 'client', {source = '', file = '', clientEntry}: {source?: string, file?: string, clientEntry?: string}) => {
  const bundle = await rollup({
    input: clientEntry ? '_client-entry.js' : (file ?? '_app.svelte'),
    onwarn: suppressSvelteCircularDependencyWarnings,
    plugins: [
      resolveFileWithString('_app.svelte', source),
      resolveFileWithString('_client-entry.js', clientEntry ?? ''),
      svelte({
        emitCss: false,
        preprocess: sveltePreprocess({
          typescript: true,
          scss: {
            includePaths: ['src', 'node_modules']
          },
        }),
        compilerOptions: {
          generate: target,
          runes: true,
        }
      }),
      resolve({
        browser: target === 'client',
        exportConditions: ["svelte"],
        extensions: ['.svelte']
      })
    ]
  });
  const { output } = await bundle.generate({ format: 'esm' });
  return output[0].code;
};
