import fs from 'fs/promises';
import path from 'path';

const layoutFallback = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>{% title %}</title>
    {% head %}
  </head>
  <body>
    <div id="app">{% body %}</div>
    {% scripts %}
  </body>
</html>`;

export const renderLayout = async (title: string, head: string, body: string, scripts: string, templateDir: string | undefined = undefined, layoutTemplate: string | undefined = undefined) => {
  const layoutTemplateFile = path.join(templateDir ?? './', layoutTemplate ?? 'layout.html');

  let layout;
  try {
    layout = await fs.readFile(layoutTemplateFile, 'utf-8');
  } catch {
    layout = layoutFallback;
  }

  return layout
    .replace('{% title %}', title)
    .replace('{% head %}', head)
    .replace('{% body %}', body)
    .replace('{% scripts %}', scripts);
};
