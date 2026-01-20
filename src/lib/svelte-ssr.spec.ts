import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { dynamicImport } from './dynamic-import';
import { render } from 'svelte/server';
import { svelteSSR } from './svelte-ssr.js';

vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn(),
    unlink: vi.fn(),
    mkdir: vi.fn(),
  },
}));

vi.mock('./dynamic-import', () => ({
  dynamicImport: vi.fn().mockResolvedValue({
      default: function MockComponent() {},
    }),
}));

vi.mock('svelte/server', () => ({
  render: vi.fn().mockReturnValue({
    head: '<title>Test</title>',
    body: '<div>Rendered</div>',
  }),
}));

describe('svelteSSR', () => {
  const mockCode = 'export default function Component() {}';
  const mockProps = { foo: 'bar' };

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(123456);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456);

  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('writes the provided code to a temporary file', async () => {
    await svelteSSR(mockCode, mockProps);

    const expectedPath = path.join(
      process.cwd(),'tmp/svelte-ssr-123456-4fzyo82mvyq.mjs'
    );

    expect(fs.writeFile).toHaveBeenCalledOnce();
    expect(fs.writeFile).toHaveBeenCalledWith(expectedPath, mockCode);
  });

  it('dynamically imports the generated module', async () => {
    await svelteSSR(mockCode, mockProps);

    const expectedPath = path.join(
      process.cwd(),'tmp/svelte-ssr-123456-4fzyo82mvyq.mjs'
    );

    expect(dynamicImport).toHaveBeenCalledOnce();
    expect(dynamicImport).toHaveBeenCalledWith(expectedPath);
  });

  it('renders the imported Svelte component with the provided props', async () => {
    const result = await svelteSSR(mockCode, mockProps);

    const { default: mockComponent } = await vi.mocked(dynamicImport).mock.results[0].value;

    expect(render).toHaveBeenCalledOnce();
    expect(render).toHaveBeenCalledWith(mockComponent, {
      props: mockProps,
    });

    expect(result).toEqual({
      head: '<title>Test</title>',
      body: '<div>Rendered</div>',
    });
  });

  it('cleans up the temporary file after rendering', async () => {
    await svelteSSR(mockCode, mockProps);

    const expectedPath = path.join(
      process.cwd(),'tmp/svelte-ssr-123456-4fzyo82mvyq.mjs'
    );

    expect(fs.unlink).toHaveBeenCalledOnce();
    expect(fs.unlink).toHaveBeenCalledWith(expectedPath);
  });
});
