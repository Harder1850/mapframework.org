import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderPages} from '../src/site.mjs';

const base = new URL(process.argv[2] || 'http://localhost:4173');
if (!['localhost','127.0.0.1'].includes(base.hostname) && !base.hostname.endsWith('.workers.dev')) throw new Error('Smoke tests are restricted to local or workers.dev staging');
const pages=renderPages(), refs=new Set(), routes=[];
for (const page of pages) {
  const response=await fetch(new URL(page.path,base));
  assert.equal(response.status,200,page.path);
  assert.match(response.headers.get('content-type'),/text\/html/);
  assert.match(response.headers.get('x-robots-tag'),/noindex/);
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(response.headers.get('x-frame-options'),'DENY');
  assert.match(response.headers.get('content-security-policy'),/script-src 'self'/);
  const html=await response.text();
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,page.path+' h1');
  assert.ok(html.includes('https://mapframework.org'+page.path),page.path+' canonical');
  assert.ok(html.includes('name="description"')&&html.includes('property="og:title"')&&html.includes('name="twitter:card"'));
  assert.ok(html.includes('application/ld+json')&&html.includes('Skip to content'));
  for(const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)"/g)) refs.add(match[1]);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,page.path+' duplicate IDs');
  routes.push({path:page.path,status:response.status});
}
for (const path of refs) {
  const response=await fetch(new URL(path,base));
  assert.equal(response.status,200,path);
  if(path.endsWith('.mjs')) assert.match(response.headers.get('content-type'),/javascript/);
}
for(const n of [31,32,33,34,35]) for(const [dir,ext] of [['source','png'],['visuals','webp']]) {
  const path=`/assets/${dir}/${n}.${ext}`;
  const local=await readFile(new URL('../public'+path,import.meta.url));
  const response=await fetch(new URL(path,base));
  assert.equal(response.status,200,path);
  const remote=Buffer.from(await response.arrayBuffer());
  assert.equal(createHash('sha256').update(remote).digest('hex'),createHash('sha256').update(local).digest('hex'),path+' hash');
}
const missing=await fetch(new URL('/release-smoke-missing-page',base));
assert.equal(missing.status,404);
const errorPage=await missing.text();
assert.match(errorPage,/Page not found/);
assert.doesNotMatch(errorPage,/http-equiv="refresh"/i);
for(const path of ['/README.md','/docs/PUBLICATION_FIREWALL.md','/src/site.mjs','/.env','/.git/config','/private-evaluation/','/api/missing']) {
  assert.equal((await fetch(new URL(path,base))).status,404,path);
}
const health=await fetch(new URL('/api/health',base));
assert.equal(health.status,200);
assert.equal((await health.json()).canonicalHost,false);
assert.equal(health.headers.get('cache-control'),'no-store');
assert.match(await (await fetch(new URL('/robots.txt',base))).text(),/Disallow: \//);
assert.equal((await fetch(new URL('/',base),{method:'POST'})).status,405);
assert.equal((await fetch(new URL('/',base),{method:'HEAD'})).status,200);
const sitemap=await (await fetch(new URL('/sitemap.xml',base))).text();
assert.equal((sitemap.match(/<loc>/g)||[]).length,12);
console.log(JSON.stringify({base:base.origin,routes,linkedResources:refs.size,imageHashes:10,checks:'PASS: route responses, linked resources, security/indexing headers, metadata, IDs, image integrity, sitemap, real 404, private paths, health and methods'},null,2));
