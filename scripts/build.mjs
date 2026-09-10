import {PRODUCTION_ORIGIN, productionRobots} from '../src/deployment.mjs';
import { mkdir, rm, cp, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPages, scriptPath, navigationScript } from '../src/site.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
await rm(dist, { recursive:true, force:true });
await mkdir(dist, { recursive:true });
await cp(join(root,'public'), dist, { recursive:true });
await writeFile(join(dist,'robots.txt'), productionRobots);
await cp(join(root,'src/styles/global.css'), join(dist,'assets/global.css'));
await cp(join(root,'src/delta-scoring.mjs'), join(dist,'assets/delta-scoring.mjs'));
await writeFile(join(dist,'assets/navigation.mjs'), navigationScript);
for (const page of renderPages()) {
  const out = page.path === '/' ? join(dist,'index.html') : join(dist,page.path.slice(1),'index.html');
  await mkdir(dirname(out), { recursive:true });
  await writeFile(out, page.html, 'utf8');
  if (page.script) await writeFile(join(dist,scriptPath(page.path).slice(1)), page.script);
}
await writeFile(join(dist,'404.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="This page could not be found on MAP Framework."><title>Page not found — MAP Framework</title><link rel="stylesheet" href="/assets/global.css"><link rel="icon" href="/favicon.svg"></head><body><a class="skip-link" href="#main">Skip to content</a><main id="main" tabindex="-1" class="shell page-hero"><p class="section-kicker">404</p><h1>Page not found.</h1><p>The address may have changed. Choose a destination to continue.</p><nav aria-label="Recovery navigation"><a class="button" href="/">Return home</a> <a class="button" href="/library/">Browse the Concept Library</a></nav></main></body></html>');
const urls = renderPages().map(p=>`  <url><loc>${PRODUCTION_ORIGIN}${p.path}</loc></url>`).join('\n');
await writeFile(join(dist,'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`Built ${renderPages().length} routes to ${dist}`);
