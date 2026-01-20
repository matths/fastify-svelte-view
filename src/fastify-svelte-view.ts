import fp from 'fastify-plugin';
import fastifyPiscina from '@piscina/fastify';
import type { FastifyInstance } from 'fastify';
import type { RegisterOptions } from './types/register-options.type';
import type { RenderOptions } from './types/render-options.type';

export const fastifySvelteView = async (
  fastify: FastifyInstance,
  {templateDir, layoutTemplate, generate}: RegisterOptions
) => {
  let filename = new URL('./lib/svelte-bundler.js', import.meta.url).pathname;

  /* v8 ignore start */
  if (process.env.VITEST) {
      filename = new URL('./../build/lib/svelte-bundler.js', import.meta.url).pathname;
  }
  /* v8 ignore stop */

  fastify.register(fastifyPiscina, { filename });

  fastify.decorate('renderSvelte',
    (renderOptions: RenderOptions): Promise<string> => fastify.runTask({
      templateDir,
      layoutTemplate,
      ...renderOptions,
    })
  );
};

export default fp(fastifySvelteView, {
  name: 'fastify-svelte-view',
  fastify: '5.x'
});
