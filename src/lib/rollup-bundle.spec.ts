import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rollupBundle, resolveFileWithString } from './rollup-bundle';
import { rollup } from 'rollup';

vi.mock('rollup', () => ({
  rollup: vi.fn(),
}));

vi.mock('rollup-plugin-svelte', () => ({
  default: vi.fn(() => ({ name: 'svelte-plugin' })),
}));

vi.mock('@rollup/plugin-node-resolve', () => ({
  default: vi.fn(() => ({ name: 'resolve-plugin' })),
}));

vi.mock('svelte-preprocess', () => ({
  sveltePreprocess: vi.fn(() => ({ name: 'preprocess' })),
}));

describe('resolveFileWithString', () => {
  it('resolves and loads the provided virtual module', () => {
    const plugin = resolveFileWithString('virtual.js', 'export const x = 1;');

    expect(plugin.name).toBe('resolve-file-with-string-virtual.js');
    expect(plugin.resolveId?.('virtual.js')).toBe('virtual.js');
    expect(plugin.resolveId?.('other.js')).toBeUndefined();

    expect(plugin.load?.('virtual.js')).toBe('export const x = 1;');
    expect(plugin.load?.('other.js')).toBeUndefined();
  });
});

describe('rollupBundle', () => {
  const generateMock = vi.fn();
  const rollupMock = rollup as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    generateMock.mockResolvedValue({
      output: [{ code: '/* bundled code */' }],
    });

    rollupMock.mockClear();
    rollupMock.mockResolvedValue({
      generate: generateMock,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('bundles server-side code using the Svelte compiler in server mode', async () => {
    const result = await rollupBundle('server', {
      source: '<script>export let name;</script>',
      file: '_app.svelte',
    });

    expect(rollupMock).toHaveBeenCalledOnce();

    const rollupArgs = rollupMock.mock.calls[0][0];
    expect(rollupArgs.input).toBe('_app.svelte');
    expect(typeof rollupArgs.onwarn).toBe('function');
    expect(rollupArgs.plugins).toHaveLength(5);

    expect(generateMock).toHaveBeenCalledWith({ format: 'esm' });
    expect(result).toBe('/* bundled code */');
  });

  it('bundles client-side code using a client entry when provided', async () => {
    const result = await rollupBundle('client', {
      clientEntry: 'import App from "./App.svelte";',
    });

    const rollupArgs = rollupMock.mock.calls[0][0];
    expect(rollupArgs.input).toBe('_client-entry.js');

    expect(result).toBe('/* bundled code */');
  });

  it('suppresses circular dependency warnings originating from svelte', async () => {
    await rollupBundle('server', {});

    const { onwarn } = rollupMock.mock.calls[0][0];
    const warnSpy = vi.fn();

    onwarn(
      { code: 'CIRCULAR_DEPENDENCY', message: 'something about svelte internals' },
      warnSpy
    );

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('forwards non-svelte or non-circular warnings to rollup warn handler', async () => {
    await rollupBundle('server', {});

    const { onwarn } = rollupMock.mock.calls[0][0];
    const warnSpy = vi.fn();
    const warning = { code: 'OTHER', message: 'some warning' };
    onwarn(warning, warnSpy);

    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith(warning);
  });

  it('uses _app.svelte as input when clientEntry and file are undefined', async () => {
    const result = await rollupBundle('server', {});

    const rollupArgs = rollupMock.mock.calls[0][0];
    expect(rollupArgs.input).toBe('_app.svelte');
    expect(result).toBe('/* bundled code */');
  });
});
