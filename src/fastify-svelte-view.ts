import fp from 'fastify-plugin';
import fastifyPiscina from '@piscina/fastify';
import { FastifyInstance } from 'fastify';

export const fastifySvelteView = async (fastify: FastifyInstance, options: any) => {
  const {templateDir, layoutTemplate} = options;

  fastify.register(fastifyPiscina, {
    filename: new URL('./lib/svelte-bundler.js', import.meta.url).pathname
  });

  fastify.decorate('renderSvelte', async ({props, title, file, source, mode = 'SSR', hydrate = true}: {props: any, title: string, file?: string, source?: string, mode?: 'SSR' | 'CSR', hydrate?: boolean}) => {
    return await fastify.runTask({
      templateDir,
      layoutTemplate,
      title,
      props,
      file,
      source,
      mode,
      hydrate
    });
  });
};

export default fp(fastifySvelteView, {
  name: 'fastify-svelte-view',
  fastify: '5.x'
});
