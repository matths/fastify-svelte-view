import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderLayout } from './render-layout';
import path from 'path';
import fs from 'fs/promises';

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
}));

describe('renderLayout', () => {
  const title = 'Test Title';
  const head = '<meta name="test" />';
  const body = '<div>Body Content</div>';
  const scripts = '<script src="app.js"></script>';

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reads the layout template from disk when it exists', async () => {
    (fs.readFile as any).mockResolvedValue(`
      <html>
        <head><title>{% title %}</title>{% head %}</head>
        <body>{% body %}{% scripts %}</body>
      </html>
    `);

    const result = await renderLayout(
      title,
      head,
      body,
      scripts,
      'templates',
      'custom.html'
    );

    expect(fs.readFile).toHaveBeenCalledOnce();
    expect(fs.readFile).toHaveBeenCalledWith(
      path.join('templates', 'custom.html'),
      'utf-8'
    );

    expect(result).toContain(title);
    expect(result).toContain(head);
    expect(result).toContain(body);
    expect(result).toContain(scripts);
  });

  it('falls back to the default layout when the template file cannot be read', async () => {
    (fs.readFile as any).mockRejectedValue(new Error('File not found'));

    const result = await renderLayout(title, head, body, scripts);

    expect(fs.readFile).toHaveBeenCalledOnce();
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain(`<title>${title}</title>`);
    expect(result).toContain(head);
    expect(result).toContain(body);
    expect(result).toContain(scripts);
  });

  it('uses default templateDir and layout filename when none are provided', async () => {
    (fs.readFile as any).mockResolvedValue('{% title %}{% head %}{% body %}{% scripts %}');

    await renderLayout(title, head, body, scripts);

    expect(fs.readFile).toHaveBeenCalledWith(
      path.join('./', 'layout.html'),
      'utf-8'
    );
  });

  it('replaces all template placeholders with provided values', async () => {
    (fs.readFile as any).mockResolvedValue(
      '{% title %}::{% head %}::{% body %}::{% scripts %}'
    );

    const result = await renderLayout(title, head, body, scripts);

    expect(result).toBe(
      `${title}::${head}::${body}::${scripts}`
    );
  });
});
