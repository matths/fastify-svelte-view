import fp from 'fastify-plugin';
import fastifyPiscina from '@piscina/fastify';
import type { FastifyInstance } from 'fastify';
import type { RegisterOptions } from './types/register-options.type';
import type { RenderOptions } from './types/render-options.type';

export const fastifySvelteView = async (
  fastify: FastifyInstance,
  {templateDir, layoutTemplate, generate}: RegisterOptions
) => {
  fastify.register(fastifyPiscina, {
    filename: new URL('./lib/svelte-bundler.js', import.meta.url).pathname
  });

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
