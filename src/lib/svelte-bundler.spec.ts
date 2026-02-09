import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encode, getClientEntry, getScript, build, encodeBase64 } from './svelte-bundler';
import { renderLayout } from './render-layout.js';
import { rollupBundle } from './rollup-bundle.js';
import { svelteSSR } from './svelte-ssr.js';

vi.mock('./render-layout.js', () => ({
  renderLayout: vi.fn(async (...args) => `layout:${JSON.stringify(args)}`)
}));

vi.mock('./rollup-bundle.js', () => ({
  rollupBundle: vi.fn(async (type, opts) => `${type}-bundle:${JSON.stringify(opts)}`)
}));

vi.mock('./svelte-ssr.js', () => ({
  svelteSSR: vi.fn(async (code, props) => ({ head: 'HEAD', body: 'BODY' }))
}));

describe('svelte-bundler helpers', () => {
  it('encodes strings safely', () => {
    expect(encode("a'b c")).toBe("a\\'b%20c");
  });

  it('generates correct client entry for SSR mode and file specified', () => {
    expect(getClientEntry('SSR', 'App.svelte')).toContain('hydrate');
    expect(getClientEntry('SSR', 'App.svelte')).toContain('App.svelte');
  });

  it('generates correct client entry for CSR mode and no file specified', () => {
    expect(getClientEntry('CSR')).toContain('mount');
    expect(getClientEntry('CSR')).toContain('_app.svelte');
  });

  it('generates correct script tag for SSR', () => {
    const code = 'console.log(1)';
    const props = { foo: 1 };
    const script = getScript('SSR', code, props);
    expect(script).toContain('hydrate');
    expect(script).toContain('foo');
    expect(script).toContain(encodeBase64(code));
  });

  it('generates correct script tag for CSR', () => {
    const code = 'console.log(2)';
    const props = { bar: 2 };
    const script = getScript('CSR', code, props);
    expect(script).toContain('mount');
    expect(script).toContain('bar');
    expect(script).toContain(encodeBase64(code));
  });
});

describe('build', () => {
    it('renders with no file provided (uses _app.svelte)', async () => {
      const html = await build({
        templateDir: '/dir',
        layoutTemplate: 'layout.svelte',
        title: 'NoFile',
        source: '<svelte>',
        props: { foo: 'bar' },
        mode: 'SSR',
        hydrate: true
      });
      expect(rollupBundle).toHaveBeenCalledWith('server', expect.objectContaining({ file: '_app.svelte' }));
      expect(rollupBundle).toHaveBeenCalledWith('client', expect.objectContaining({ file: '_app.svelte' }));
      expect(svelteSSR).toHaveBeenCalled();
      expect(renderLayout).toHaveBeenCalled();
      expect(html).toContain('layout:');
    });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders SSR with hydration', async () => {
    const html = await build({
      templateDir: '/dir',
      layoutTemplate: 'layout.svelte',
      title: 'Test',
      file: 'App.svelte',
      source: '<svelte>',
      props: { foo: 'bar' },
      mode: 'SSR',
      hydrate: true
    });
    expect(rollupBundle).toHaveBeenCalledWith('server', expect.anything());
    expect(rollupBundle).toHaveBeenCalledWith('client', expect.anything());
    expect(svelteSSR).toHaveBeenCalled();
    expect(renderLayout).toHaveBeenCalled();
    expect(html).toContain('layout:');
  });

  it('renders SSR without hydration', async () => {
    const html = await build({
      templateDir: '/dir',
      layoutTemplate: 'layout.svelte',
      title: 'Test',
      file: 'App.svelte',
      source: '<svelte>',
      props: { foo: 'bar' },
      mode: 'SSR',
      hydrate: false
    });
    expect(rollupBundle).toHaveBeenCalledWith('server', expect.anything());
    expect(rollupBundle).not.toHaveBeenCalledWith('client', expect.anything());
    expect(svelteSSR).toHaveBeenCalled();
    expect(renderLayout).toHaveBeenCalled();
    expect(html).toContain('layout:');
  });

  it('renders CSR', async () => {
    const html = await build({
      templateDir: '/dir',
      layoutTemplate: 'layout.svelte',
      title: 'Test',
      file: 'App.svelte',
      source: '<svelte>',
      props: { foo: 'bar' },
      mode: 'CSR',
      hydrate: true
    });
    expect(rollupBundle).toHaveBeenCalledWith('client', expect.anything());
    expect(rollupBundle).not.toHaveBeenCalledWith('server', expect.anything());
    expect(svelteSSR).not.toHaveBeenCalled();
    expect(renderLayout).toHaveBeenCalled();
    expect(html).toContain('layout:');
  });
});
