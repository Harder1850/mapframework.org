import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreResults } from '../src/delta-scoring.mjs';
import worker from '../src/worker.js';

const result = overrides => ({actual:'known', chosen:'known', classCorrect:true, adaptCorrect:true, confidence:100, seconds:2, shouldEscalate:false, escalated:false, ...overrides});
test('Brier loss treats uncertain correct and incorrect answers symmetrically', () => {
  assert.equal(scoreResults([result({})]).brier, 0);
  assert.equal(scoreResults([result({classCorrect:false})]).brier, 1);
  assert.equal(scoreResults([result({confidence:50})]).brier, .25);
  assert.equal(scoreResults([result({confidence:50, classCorrect:false})]).brier, .25);
});
test('escalation penalizes false alarms and undefined denominators remain explicit', () => {
  const scores = scoreResults([result({escalated:true}), result({actual:'boundary',chosen:'boundary',shouldEscalate:true,escalated:true})]);
  assert.equal(new Map(scores.metrics).get('Appropriate escalation'), .5);
  assert.equal(new Map(scores.metrics).get('Unnecessary escalation rate'), 1);
  assert.equal(new Map(scoreResults([result({})]).metrics).get('Meaningful-delta detection'), null);
  assert.throws(() => scoreResults([]));
});
test('staging health is uncached, non-indexable, and explicitly not production', async () => {
  const response = await worker.fetch(new Request('https://mapframework-org-staging.example.workers.dev/api/health'), {});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).productionDomainConnected, false);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('x-robots-tag'), /noindex/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});
test('unknown APIs and unsupported methods fail without serving homepage HTML', async () => {
  const missing = await worker.fetch(new Request('https://example.workers.dev/api/missing'), {});
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), {error:'Not found'});
  const post = await worker.fetch(new Request('https://example.workers.dev/', {method:'POST'}), {});
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});
test('static response preserves status and enforces CSP and staging indexing rules', async () => {
  const env = {ASSETS:{fetch:async () => new Response('<h1>Not found</h1>',{status:404,headers:{'content-type':'text/html'}})}};
  const response = await worker.fetch(new Request('https://example.workers.dev/missing'), env);
  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-security-policy'), /script-src 'self'/);
  assert.doesNotMatch(response.headers.get('content-security-policy'), /script-src[^;]*unsafe-inline/);
  assert.match(response.headers.get('x-robots-tag'), /noindex/);
});
test('staging robots disallows crawling', async () => {
  const response = await worker.fetch(new Request('https://example.workers.dev/robots.txt'), {});
  assert.match(await response.text(), /Disallow: \//);
});
