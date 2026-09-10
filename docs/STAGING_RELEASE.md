# Staging release review and operation

Historical baseline: the production-preparation PR supersedes the indexing/cutover instructions below. See [PRODUCTION_CUTOVER.md](PRODUCTION_CUTOVER.md). The default Wrangler target remains staging; the explicit production environment remains unrouted until separately authorized cutover.

This release targets only `mapframework-org-staging` on Cloudflare `workers.dev`. GitHub remains the source of truth. Deploy the reviewed `main` checkout; do not edit the Worker through the Cloudflare dashboard.

## Review findings resolved before merge

- Replace homepage-redirecting 404 markup with an accessible error page and configure Workers to serve it with HTTP 404.
- Explicitly restrict deployment to `workers.dev`, with no custom-domain routes, D1, or R2 bindings. Add staging `noindex` response headers and markup and disallow crawling.
- Move executable inline scripts into same-origin modules and restrict script CSP to `self`. Apply security headers consistently to static pages, health responses, and errors.
- Replace the misleading confidence percentage with a documented Brier loss. Count both warranted escalation and appropriate non-escalation; expose unnecessary escalation separately. Preserve all component metrics and public-demo/non-evidence labels.
- Restore the public trial sequence: known structure, surface variation, irrelevant novelty, meaningful change, contradiction, boundary.
- Fix the clipped mobile constellation with readable touch controls and an accessible relationship summary. Add keyboard focus indicators, radio-group legends, trial/result focus management, search counts and an empty state. Stop the timer from continuously announcing itself to screen readers.
- Bind the development server to loopback, reject traversal outside the output directory, and serve JavaScript modules with the correct MIME type.
- Pin Wrangler 4.130.0 and override its transitive sharp dependency to patched 0.35.4. See [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c). No image-processing service or Node.js dependencies are deployed into the Worker.

## MAP and publication review

Reviewed the reconciled README, complete site source, public demo cases/scoring, repository documentation, public assets, and deployment output. The public roles remain distinct: Relational Intelligence is the conceptual foundation, MAP the applied methodology, RCP the research layer, and ALIVE an evolving engineering workstream. The public MAP cycle retains Understanding and its recursive return to reality. Integrated architecture is labeled as hypothesis/synthesis rather than established science.

No private ALIVE implementation source, protected evaluation instances, participant datasets, unpublished experimental results, manuscript files, or credential patterns were identified in the reviewed package. Public Learn the Delta material remains high-level. The six demo cases and keys are deliberately transparent; session data lives only in browser memory. Repository docs, source files, and credentials are not included in the static output. The approved PNG/WebP assets remain unchanged. README and LICENSE are preserved.

Review scope: fidelity is assessed against the reconciled README and supplied package's architecture/provenance records. Not all upstream private manuscripts cited in `CONTENT_PROVENANCE.md` were available for line-by-line comparison. This is a release-content review, not legal IP clearance or independent validation of MAP's scientific claims.

## Reproduce validation and deploy

From a clean checkout of the reviewed main commit:

```sh
npm ci
npm run test
npm run build
npm audit --audit-level=high
npx wrangler deploy --dry-run
npx wrangler deploy
node scripts/smoke.mjs https://mapframework-org-staging.YOUR-SUBDOMAIN.workers.dev
```

Use the authenticated Cloudflare account and confirm the printed bindings contain only `ASSETS`. Never attach a custom domain or change DNS as part of this staging command. The deployment CLI is locked by `package-lock.json`; updates go through PRs. CI validates install/test/build on Node.js 22 without deployment credentials.

Browser checks supplement the HTTP script: all 12 routes at desktop and mobile widths, navigation and keyboard focus, six complete Delta trials plus reset/invalid submission, Concept Library matching/empty/reset states, every constellation node, image loading, console errors, and accessibility basics. Local timings and test answers are QA data, not research evidence.

## Before a separately authorized production cutover

Staging is deliberately non-indexable. A reviewed release PR must prepare the production Worker name/routes, remove staging indexing guards from Worker/static headers/markup/robots, update health environment reporting, and rerun tests with explicit production expectations. Preserve staging separately. Attach `mapframework.org`, change DNS/nameservers, or add D1/R2 only with separate authorization. Verify HTTPS, redirects, production metadata, indexing policy, and rollback after that cutover.
