export type RenderOptions = {
  title: string,
  file?: string,
  source?: string,
  props: any,
  mode?: 'SSR' | 'CSR',
  hydrate?: boolean
};
