# Production architecture

## Source of truth

`Harder1850/mapframework.org` is the only production codebase. Prototype sites are reference sources, not deployment targets.

## Stack

- Dependency-free Node.js static site generator (`src/site.mjs` and `scripts/build.mjs`) for durable, accessible, content-first pages.
- Cloudflare Worker as the edge entry point.
- Cloudflare Static Assets binding serves `dist/`.
- `/api/health` is the first Worker route and verifies the runtime without adding application-state complexity.
- D1 and R2 are intentionally not bound yet. They should be added only when the experiment data model, privacy model, and retention policy are specified.

## Why Workers Static Assets

The site is mostly static today but the research roadmap requires server-side experiment endpoints, provenance capture, protected evaluation instances, and eventually D1/R2. A Worker keeps those capabilities in one Cloudflare deployment without forcing a separate hosting architecture.

## Domain cutover

Do not add custom-domain routes or change GoDaddy nameservers in this repository until the preview deployment has passed build, accessibility, security, and content review.
