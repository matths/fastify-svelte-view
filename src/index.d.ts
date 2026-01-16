import Fastify, { FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    renderSvelte({props, title, file, source, mode, hydrate}: {props: any, title: string, file?: string, source?: string, mode?: 'SSR' | 'CSR', hydrate?: boolean}): Promise<string>;
  }
}
