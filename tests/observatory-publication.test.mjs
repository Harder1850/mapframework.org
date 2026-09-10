import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { payloadSha256, validatePublicRelease, EPISTEMIC_STATUSES } from '../src/observatory-publication.mjs';
import { renderPages } from '../src/site.mjs';

// Entirely synthetic software fixtures. No actual evidence, approval, or publication.
const policy = { allowedSourceHosts: ['example.org'], now: '2026-01-05T00:00:00.000Z' };
function fixture() {
  const payload = {
    id: 'synthetic-profile', revision: 1, category: 'evaluations',
    title: 'Synthetic contract test fixture', summary: 'Software testing only; not research evidence.',
    epistemicStatus: 'hypothesis', evidenceKind: 'source_supported',
    lastVerifiedAt: '2026-01-02T00:00:00.000Z',
    sources: [{label: 'Synthetic source placeholder', url: 'https://example.org/example',
      verifiedAt: '2026-01-01T00:00:00.000Z'}],
    limitations: ['Synthetic fixture; must never be published as evidence.']
  };
  return { schemaVersion: 'observatory-public/0.1', releaseId: 'synthetic-release',
    generatedAt: '2026-01-04T00:00:00.000Z', records: [{payload,
      review: {status: 'approved', approvalId: 'synthetic-approval',
        approvedAt: '2026-01-03T00:00:00.000Z', payloadSha256: payloadSha256(payload)}}] };
}
const check = release => validatePublicRelease(release, policy);
function rejectMutation(mutate) {
  const release = fixture(); mutate(release); assert.throws(() => check(release));
}
test('accepts the declared public shape without mutating it', () => {
  const release = fixture(), before = JSON.stringify(release);
  assert.equal(check(release).recordCount, 1);
  assert.equal(JSON.stringify(release), before);
});
test('requires explicit approval and a matching exact-payload hash', () => {
  rejectMutation(r => { delete r.records[0].review; });
  rejectMutation(r => { r.records[0].review.status = 'candidate'; });
  rejectMutation(r => { r.records[0].payload.summary = 'Changed after review'; });
  rejectMutation(r => { r.records[0].review.payloadSha256 = 'f'.repeat(64); });
});
test('rejects undeclared fields at every boundary instead of silently stripping them', () => {
  for (const select of [r => r, r => r.records[0], r => r.records[0].payload,
    r => r.records[0].review, r => r.records[0].payload.sources[0]]) {
    rejectMutation(r => { select(r).unapprovedField = 'synthetic sentinel'; });
  }
});
test('does not accept arbitrary object prototypes or missing mandatory provenance', () => {
  rejectMutation(r => { Object.setPrototypeOf(r.records[0].payload, {extra: true}); });
  rejectMutation(r => { r.records[0].payload.sources = []; });
  rejectMutation(r => { r.records[0].payload.limitations = []; });
});
test('rejects duplicate records and unsupported release versions', () => {
  rejectMutation(r => r.records.push(structuredClone(r.records[0])));
  rejectMutation(r => { r.schemaVersion = 'observatory-public/99'; });
  rejectMutation(r => { r.records = []; });
  rejectMutation(r => { r.records[0].payload.revision = 0; });
});
test('enforces real calendar timestamps and chronological review order', () => {
  rejectMutation(r => { r.generatedAt = '2026-02-30T00:00:00.000Z'; });
  rejectMutation(r => { r.generatedAt = '2027-01-01T00:00:00.000Z'; });
  rejectMutation(r => { r.records[0].review.approvedAt = '2026-01-01T00:00:00.000Z'; });
  rejectMutation(r => { r.records[0].review.approvedAt = '2026-01-05T00:00:00.000Z'; });
  rejectMutation(r => { r.records[0].payload.sources[0].verifiedAt = '2026-01-03T00:00:00.000Z'; });
});
test('accepts all seven epistemic categories without promoting any', () => {
  for (const status of EPISTEMIC_STATUSES) {
    const r = fixture(); r.records[0].payload.epistemicStatus = status;
    r.records[0].review.payloadSha256 = payloadSha256(r.records[0].payload);
    check(r); assert.equal(r.records[0].payload.epistemicStatus, status);
  }
  rejectMutation(r => { r.records[0].payload.epistemicStatus = 'proven_map'; });
  rejectMutation(r => { r.records[0].payload.evidenceKind = 'synthetic_demo'; });
});
test('source policy rejects unapproved hosts, credentials, queries and local addresses', () => {
  for (const url of ['http://example.org/x', 'https://unapproved.example/x',
    'https://user:secret@example.org/x', 'https://example.org/x?token=synthetic',
    'https://example.org/x#fragment', 'https://127.0.0.1/x', 'https://[::1]/x',
    'https://localhost/x', 'https://example.org:8443/x', 'javascript:alert(1)']) {
    rejectMutation(r => { r.records[0].payload.sources[0].url = url; });
  }
  assert.throws(() => validatePublicRelease(fixture()));
  assert.throws(() => validatePublicRelease(fixture(), {...policy, allowedSourceHosts: ['127.0.0.1']}));
});
test('hash ignores object key order but preserves arrays and substantive changes', () => {
  const a = { title:'A', refs:['one','two'] }, b = {refs:['one','two'], title:'A'};
  assert.equal(payloadSha256(a), payloadSha256(b));
  assert.notEqual(payloadSha256(a), payloadSha256({...a, refs:['two','one']}));
  assert.notEqual(payloadSha256(a), payloadSha256({...a, title:'B'}));
});
test('contract introduces no runtime route, data transfer or private bindings', async () => {
  assert.equal(renderPages().length, 12);
  assert.equal(renderPages().some(p => p.path.startsWith('/observatory')), false);
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.d1_databases, undefined);
  assert.equal(config.r2_buckets, undefined);
});
