// Public-side contract only. This does not authenticate approval or authorize publication.
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

export const EPISTEMIC_STATUSES = Object.freeze([
  'established_evidence', 'supported_inference', 'harder_proposed_principle',
  'hypothesis', 'engineering_proposition', 'speculation', 'open_research_question'
]);
export const CATEGORIES = Object.freeze([
  'evaluations', 'models', 'regulation', 'standards', 'developments',
  'incidents', 'evaluation_gaps', 'rcp'
]);

function requireCondition(ok, message) {
  if (!ok) throw new Error(message);
}
function object(value, keys, label) {
  requireCondition(value !== null && typeof value === 'object' &&
    !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype,
  `${label}: expected a plain object`);
  requireCondition(Object.keys(value).length === keys.length &&
    keys.every(key => Object.hasOwn(value, key)), `${label}: unexpected or missing fields`);
}
function text(value, max, label) {
  requireCondition(typeof value === 'string' && value.trim().length > 0 &&
    value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value),
  `${label}: invalid text`);
}
function id(value, label) {
  requireCondition(typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,95}$/.test(value),
    `${label}: invalid public identifier`);
}
function timestamp(value, label) {
  requireCondition(typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value),
  `${label}: expected UTC timestamp with milliseconds`);
  const millis = Date.parse(value);
  requireCondition(Number.isFinite(millis) && new Date(millis).toISOString() === value,
    `${label}: invalid timestamp`);
  return millis;
}
function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map(key =>
    `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}
// For validated JSON payloads only; not a general-purpose signature/canonicalization standard.
export function payloadSha256(payload) {
  return createHash('sha256').update(canonical(payload), 'utf8').digest('hex');
}

export function validatePublicRelease(release, { allowedSourceHosts, now } = {}) {
  // Caller configuration must be trusted. Nothing is read from env, disk or network here.
  requireCondition(Array.isArray(allowedSourceHosts) && allowedSourceHosts.length > 0 &&
    allowedSourceHosts.every(host => typeof host === 'string' && host === host.toLowerCase() &&
      /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(host) &&
      !host.endsWith('.local') && !host.endsWith('.localhost') && !host.endsWith('.internal') && !isIP(host)),
  'policy: explicit public source host allowlist required');
  const currentTime = timestamp(now, 'policy.now');
  const hosts = new Set(allowedSourceHosts);
  object(release, ['schemaVersion', 'releaseId', 'generatedAt', 'records'], 'release');
  requireCondition(release.schemaVersion === 'observatory-public/0.1', 'release: unsupported schema');
  id(release.releaseId, 'releaseId');
  const generatedAt = timestamp(release.generatedAt, 'generatedAt');
  requireCondition(generatedAt <= currentTime, 'release: generated in the future');
  requireCondition(Array.isArray(release.records) && release.records.length > 0 &&
    release.records.length <= 500, 'release: expected 1 to 500 records');
  const ids = new Set();
  for (const record of release.records) {
    object(record, ['payload', 'review'], 'record');
    const p = record.payload;
    object(p, ['id', 'revision', 'category', 'title', 'summary', 'epistemicStatus',
      'evidenceKind', 'lastVerifiedAt', 'sources', 'limitations'], 'payload');
    id(p.id, 'payload.id');
    requireCondition(!ids.has(p.id), 'release: duplicate record identity');
    ids.add(p.id);
    requireCondition(Number.isSafeInteger(p.revision) && p.revision > 0, 'payload: invalid revision');
    requireCondition(CATEGORIES.includes(p.category), 'payload: unsupported category');
    text(p.title, 240, 'title');
    text(p.summary, 6000, 'summary');
    requireCondition(EPISTEMIC_STATUSES.includes(p.epistemicStatus), 'payload: invalid epistemic status');
    requireCondition(p.evidenceKind === 'source_supported', 'payload: synthetic or unsupported evidence');
    const verifiedAt = timestamp(p.lastVerifiedAt, 'lastVerifiedAt');
    requireCondition(Array.isArray(p.limitations) && p.limitations.length > 0 &&
      p.limitations.length <= 30, 'payload: explicit limitations required');
    p.limitations.forEach(value => text(value, 2000, 'limitation'));
    requireCondition(Array.isArray(p.sources) && p.sources.length > 0 &&
      p.sources.length <= 30, 'payload: source provenance required');
    for (const source of p.sources) {
      object(source, ['label', 'url', 'verifiedAt'], 'source');
      text(source.label, 300, 'source.label');
      text(source.url, 2048, 'source.url');
      const url = new URL(source.url);
      requireCondition(url.protocol === 'https:' && !url.username && !url.password &&
        !url.port && !url.search && !url.hash && hosts.has(url.hostname) &&
        !isIP(url.hostname) && !url.hostname.startsWith('['), 'source: URL violates publication policy');
      requireCondition(timestamp(source.verifiedAt, 'source.verifiedAt') <= verifiedAt,
        'source: verification is later than record verification');
    }
    const r = record.review;
    object(r, ['status', 'approvalId', 'approvedAt', 'payloadSha256'], 'review');
    requireCondition(r.status === 'approved', 'review: explicit approval required');
    id(r.approvalId, 'approvalId');
    const approvedAt = timestamp(r.approvedAt, 'approvedAt');
    requireCondition(verifiedAt <= approvedAt && approvedAt <= generatedAt,
      'review: invalid verification/approval/release ordering');
    requireCondition(typeof r.payloadSha256 === 'string' && /^[a-f0-9]{64}$/.test(r.payloadSha256) &&
      r.payloadSha256 === payloadSha256(p), 'review: payload changed or approval hash invalid');
  }
  return { valid: true, releaseId: release.releaseId, recordCount: release.records.length };
}
