
import { rollup } from 'rollup';
import svelte from 'rollup-plugin-svelte';
import { sveltePreprocess } from 'svelte-preprocess';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

const suppressSvelteCircularDependencyWarnings = (warning: any, warn: (warning: any) => void) => {
  if (
    warning.code === 'CIRCULAR_DEPENDENCY' &&
    warning.message.includes('svelte')
  ) {
    return;
  }
  warn(warning);
};

export const resolveFileWithString = (name: string, source: string) => ({
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
    input: clientEntry ? '_client-entry.js' : (file ? file : '_app.svelte'),
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
      typescript({
        tsconfig: false,
        compilerOptions: {
          target: "ES2020",
          module: "ESNext",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          moduleResolution: "Node",
        },
        include: ["**/*.ts"]
      }),
      resolve({
        browser: target === 'client',
        exportConditions: ["svelte"],
        extensions: ['.svelte']
      }),
      terser()
    ]
  });
  const { output } = await bundle.generate({ format: 'esm' });
  return output[0].code;
};
