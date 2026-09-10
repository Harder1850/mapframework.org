# Observatory public data contract

This is a foundation for future reviewed public Observatory profiles. It does not add a page, ingest data, provision services, authenticate reviewers or publish anything. Existing website and staging behavior remain intact.

`src/observatory-publication.mjs` validates a proposed release in memory. It requires a supported schema, unique public record IDs, declared fields, an epistemic category, sources, limitations and approval metadata tied to the exact payload hash. It rejects unknown fields at each object boundary, unapproved statuses, changed payloads, invalid date ordering, duplicate identities and synthetic evidence labels. It returns a validation receipt; it does not write files or contact any service.

Call `validatePublicRelease(release, {allowedSourceHosts, now})` with a trusted, explicit list of cleared public source hostnames and the actual UTC clock. Source URLs must use HTTPS without credentials, ports, query strings or fragments. This deliberately narrow first version supports descriptive profiles only; versioned benchmark scores, legal facts and comparison cohorts need additional typed contracts before those views are implemented. Do not force such data into free text for automated ranking.

The release shape is `{schemaVersion, releaseId, generatedAt, records}`. Schema version is `observatory-public/0.1`. Each record contains `payload` and `review`. Payload fields are `id`, `revision`, `category`, `title`, `summary`, `epistemicStatus`, `evidenceKind`, `lastVerifiedAt`, `sources`, and `limitations`. Source fields are `label`, `url`, and `verifiedAt`. Review fields are `status`, `approvalId`, `approvedAt`, and `payloadSha256`. UTC timestamps use ISO format with milliseconds. Limits are enforced by the validator. Unknown fields are rejected, never silently removed.

`payloadSha256` sorts object keys recursively and preserves array order. Use it only on JSON payloads matching this contract. The format is versioned, is not a digital signature, and is not an assertion of a general canonicalization standard.

## Human publication boundary

An approval ID and hash are consistency metadata, not proof of authority. A caller could fabricate both. A trusted private publication workflow must authenticate the approver and bind approval to the exact outgoing content before it reaches this repository. A reviewed GitHub pull request remains necessary. A host allowlist does not prove that a URL is public, accurate, or cleared. The validator cannot detect sensitive ideas hidden in otherwise valid prose; content/IP review remains essential.

The public website must receive only separately prepared approved payloads. No private database, source archive, source storage locator, unpublished manuscript, protected evaluation instance, internal prediction, decision ledger, credential or private specification belongs in a website export. Publication review precedes the repository boundary, since Git history can preserve removed content. Any substantive payload change requires renewed review. Withdrawal requires a reviewed content removal and appropriate cache handling; already public copies may persist.

This module is intentionally not imported by the website build or Worker yet. That integration comes with actual approved records and artifact-level tests. Without it, this code is not a runtime or build-wide publication firewall. Text remains untrusted even after validation; future renderers must escape it and enforce their own URL/output-context rules.

## Validation

Run `node --test tests/observatory-publication.test.mjs` or the repository's normal test command. The fixtures are synthetic software inputs, including invented approval metadata and example.org references. They are not evidence or approved content and are never written to public assets. Tests cover failure behavior and unchanged runtime boundaries.

Future integration must test the actual private export handoff, trusted approval resolution, release-wide artifact inspection, rendering, withdrawal and the existing production/staging release behavior. No network, deployment, database, secret or authentication configuration is introduced by this foundation.
