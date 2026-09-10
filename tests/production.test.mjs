import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../src/worker.js';
import {renderPages} from '../src/site.mjs';
import {PRODUCTION_ORIGIN, productionRobots} from '../src/deployment.mjs';

const env = (SITE_ENV = 'production', status = 200) => ({SITE_ENV, ASSETS:{fetch:async () => new Response('<h1>MAP</h1>', {status, headers:{'Content-Type':'text/html','X-Robots-Tag':'noindex'}})}});

test('production pages allow indexing only at the exact canonical HTTPS origin', async () => {
  for (const page of renderPages()) {
    const response = await worker.fetch(new Request(PRODUCTION_ORIGIN + page.path), env());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-robots-tag'), null);
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.doesNotMatch(page.html, /noindex|nofollow|noarchive/);
    assert.ok(page.html.includes(`<link rel="canonical" href="${PRODUCTION_ORIGIN}${page.path}">`));
  }
});

test('preview origins and missing production environment fail closed for indexing', async () => {
  for (const url of ['https://preview.example.workers.dev/', 'http://localhost:4173/', 'https://mapframework.org.evil.example/', 'https://mapframework.org:8443/']) {
    const response = await worker.fetch(new Request(url, {headers:{'X-Forwarded-Host':'mapframework.org'}}), env());
    assert.match(response.headers.get('x-robots-tag'), /noindex/);
  }
  for (const SITE_ENV of ['staging', undefined]) {
    const response = await worker.fetch(new Request(PRODUCTION_ORIGIN), {...env(), SITE_ENV});
    assert.match(response.headers.get('x-robots-tag'), /noindex/);
  }
});

test('production redirects HTTP and www to fixed HTTPS apex, preserving path and query', async () => {
  for (const origin of ['http://mapframework.org', 'http://www.mapframework.org', 'https://www.mapframework.org']) {
    const response = await worker.fetch(new Request(origin+'/library/?q=Purpose'), env());
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), PRODUCTION_ORIGIN+'/library/?q=Purpose');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  }
  const response = await worker.fetch(new Request('https://www.mapframework.org//evil.example/path'), env());
  assert.equal(new URL(response.headers.get('location')).origin, PRODUCTION_ORIGIN);
});

test('robots permits canonical production and excludes previews regardless of environment', async () => {
  const production = await worker.fetch(new Request(PRODUCTION_ORIGIN+'/robots.txt'), env());
  assert.equal(await production.text(), productionRobots);
  for (const SITE_ENV of ['production', 'staging']) {
    const preview = await worker.fetch(new Request('https://preview.workers.dev/robots.txt'), env(SITE_ENV));
    assert.match(await preview.text(), /Disallow: \//);
  }
  assert.equal(await readFile(new URL('../public/robots.txt', import.meta.url),'utf8'), productionRobots);
});

test('production APIs and real errors remain non-indexable; HEAD preserves headers without a body', async () => {
  for (const [path,status] of [['/api/health',200],['/api/missing',404],['/missing',404]]) {
    const response = await worker.fetch(new Request(PRODUCTION_ORIGIN+path), env('production',status));
    assert.equal(response.status,status);
    assert.match(response.headers.get('x-robots-tag'), /noindex/);
  }
  const response = await worker.fetch(new Request(PRODUCTION_ORIGIN,{method:'HEAD'}), env());
  assert.equal(await response.text(),'');
  assert.equal(response.headers.get('x-robots-tag'),null);
  const health = await worker.fetch(new Request(PRODUCTION_ORIGIN+'/api/health'),env());
  assert.deepEqual(await health.json(),{status:'ok',service:'mapframework.org',environment:'production',canonicalHost:true});
});
