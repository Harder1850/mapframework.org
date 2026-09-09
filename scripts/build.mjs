import { mkdir, rm, cp, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPages } from '../src/site.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
await rm(dist, { recursive:true, force:true });
await mkdir(dist, { recursive:true });
await cp(join(root,'public'), dist, { recursive:true });
await cp(join(root,'src/styles/global.css'), join(dist,'assets/global.css'));
for (const page of renderPages()) {
  const out = page.path === '/' ? join(dist,'index.html') : join(dist,page.path.slice(1),'index.html');
  await mkdir(dirname(out), { recursive:true });
  await writeFile(out, page.html, 'utf8');
}
await mkdir(join(dist,'404'), { recursive:true });
await writeFile(join(dist,'404.html'), '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/"><title>Not found</title>');
const urls = renderPages().map(p=>`  <url><loc>https://mapframework.org${p.path}</loc></url>`).join('\n');
await writeFile(join(dist,'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`Built ${renderPages().length} routes to ${dist}`);
