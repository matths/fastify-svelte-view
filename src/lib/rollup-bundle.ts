
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

export const rollupBundle = async (target: 'server' | 'client', {source = '', file = '', clientEntry}: {source?: string, file?: string, clientEntry?: string}) => {
  const bundle = await rollup({
    input: clientEntry ? '_client-entry.js' : (file ?? '_app.svelte'),
    onwarn: suppressSvelteCircularDependencyWarnings,
    plugins: [
      {
        name: 'resolve-files',
        resolveId(id) {
          if (id === '_client-entry.js') return id;
          if (id === '_app.svelte') return id;
        },
        load(id) {
          if (id === '_client-entry.js' && clientEntry) return clientEntry;
          if (id === '_app.svelte' && source) return source;
        }
      },
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
