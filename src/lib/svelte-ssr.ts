import { dynamicImport } from './dynamic-import.js';
import { render } from 'svelte/server';
import fs from 'fs/promises';
import path from 'path';

export const svelteSSR = async (code: string, props: any): Promise<{
  head: string;
  body: string;
}> => {
  const tmpPath = path.join(process.cwd(), 'tmp');
  await fs.mkdir(tmpPath, { recursive: true });

  const filePath = path.join(tmpPath,
    `svelte-ssr-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`
  );

  await fs.writeFile(filePath, code);

  const SSRModule = await dynamicImport(filePath);
  const SSRComponent = SSRModule.default;

  await fs.unlink(filePath);
  return render(SSRComponent, { props });
};
