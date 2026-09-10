# Production preparation and cutover

This change prepares production behavior without attaching a domain, changing DNS, or merging itself. The starting point is validated main commit `7c9c242e5bc80bbaf2ace33b8df6abfb0bb7d0a5`. GitHub remains the source of truth. Preserve README, LICENSE, public imagery, and the publication firewall.

## Configuration prepared by this PR

| Target | Command after install/test/build | Worker | Public routing now |
|---|---|---|---|
| Staging (default) | `npx wrangler deploy` | `mapframework-org-staging` | Existing workers.dev only |
| Production | `npx wrangler deploy --env production` | `mapframework-org` | None: workers_dev false, preview_urls false, routes empty |

Production deployment is intentionally a separate, explicit command. This PR does not create or deploy the production Worker. A deployment from this configuration cannot attach mapframework.org. ASSETS and the SITE_ENV text setting are the only bindings; no D1 or R2 configuration exists.

All canonical, Open Graph, Twitter image, JSON-LD, and sitemap URLs use the fixed `https://mapframework.org` origin. Successful public content is indexable only when SITE_ENV is production and the request origin is exactly that HTTPS origin. The static production HTML and headers no longer contain blanket staging noindex directives. Production robots allows crawling and points to the canonical sitemap. Real error pages and API responses remain non-indexable.

Staging, localhost, and any unexpected hostname retain X-Robots-Tag exclusion and robots Disallow: /. Worker-first assets routing is mandatory for these safeguards; do not publish the dist folder through an unrelated static hosting service. Noindex is crawler guidance, not authentication or a private-content boundary.

For production requests, HTTP apex and www redirect with 308 to HTTPS apex, retaining path and query. Redirect targets are constructed from the fixed origin, never forwarded-host headers. The health endpoint reports configuration and whether this request uses the canonical host; it does not claim to inspect DNS attachment. Existing CSP, framing restrictions, content-type protections, referrer policy, permissions policy, and cache safeguards are preserved.

## Automatic deployment setup

The account's existing Cloudflare GitHub installation can select Harder1850/mapframework.org. The staging Worker's Builds panel currently has no repository connection. Automatic deployment was prepared but not saved: automatic approval review rejected both the broad default token and a custom Workers-only token because persistent credential/access creation requires specific owner authorization. No token was created, and no Git connection was enabled by these attempts.

After that authorization, use Cloudflare Workers Builds (not dashboard source editing):

| Setting | Staging | Production, after this PR is merged and its unrouted Worker exists |
|---|---|---|
| Repository | Harder1850/mapframework.org | Same |
| Production branch | main | main |
| Root/path | / | / |
| Build command | `npm ci && npm run test && npm run build` | Same |
| Deploy command | `npx wrangler deploy` | `npx wrangler deploy --env production` |
| Node build variable | NODE_VERSION=22 | Same |
| Preview builds | Disabled | Disabled |
| Credential | Approved token limited to Workers Scripts: Edit in this account | Same minimum scope for script uploads; separately authorize any additional permission required for domain routing |

The GitHub connection lets Cloudflare Workers Builds fetch the named repository; the separate Cloudflare token permits Worker script deployment. Workers Scripts: Edit is account-wide within the selected account; it is not limited to one Worker. It grants no DNS, Workers Routes, D1, R2, or unrelated storage permissions. Do not use the default auto-created token, which includes those broader services. If Cloudflare requires additional permissions, inspect the actual error and obtain authorization before expanding access. Do not place the credential in repository files, documentation, or frontend variables.

The native build command runs install, tests, and build before deployment. GitHub Actions independently checks the same source and dry-runs both deployment configurations. Non-main branch auto-deployments stay disabled. After connecting, verify a build tied to the exact main SHA, build logs, and resulting Worker version before calling automation operational. Do not claim the connection is configured until this is verified.

Cloudflare documents [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) and [Wrangler environments in Builds](https://developers.cloudflare.com/workers/ci-cd/builds/advanced-setups/).

## Observed domain state

Read-only inspection on September 9, 2026 found no domain zones in this Cloudflare account. Consequently, no Cloudflare nameserver pair has been assigned here. Public DNS still returns:

| Record | Current answer |
|---|---|
| NS | ns03.domaincontrol.com; ns04.domaincontrol.com |
| Apex A | 13.248.243.5; 76.223.105.230 |
| www CNAME | mapframework.org |

The sampled apex MX and TXT lookups returned no answer records. This is not a complete zone inventory: export all existing DNS records and inspect subdomain records, mail authentication, CAA, verification records, and DNSSEC before delegation changes. No GoDaddy account settings were changed or private DNS inventory claimed.

## Exact final-cutover sequence — separate authorization required

1. Review and merge this PR, then build/deploy its approved main SHA to the unrouted production Worker. Validate its assets and deployment version. Finish the separately authorized build connection if desired. These actions do not require attaching the domain.
2. With explicit domain/DNS authorization, add mapframework.org to this Cloudflare account as a primary/full zone. Import and reconcile the complete existing DNS inventory. Preserve all non-website records and any mail service. Record the actual two Cloudflare-assigned nameservers; do not substitute an example pair.
3. Record the current GoDaddy nameservers and DNS export for rollback. If a pre-existing DNSSEC DS record is present at GoDaddy, remove it in the authorized migration window before changing delegation; after Cloudflare activation, enable Cloudflare DNSSEC and publish its new DS values at GoDaddy. Do not guess DNSSEC state from the limited record lookup.
4. In GoDaddy's domain DNS/nameserver settings, replace **ns03.domaincontrol.com and ns04.domaincontrol.com** with the exact assigned Cloudflare pair, and no other nameservers. Keep GoDaddy as registrar; no transfer, purchase, hosting change, or domain unlock is required. Verify Cloudflare reports the zone Active before proceeding with the final Worker attachment.
5. Through a separately approved GitHub cutover PR, replace only env.production.routes with the following intended custom domains, then deploy the approved main commit with the production command. The www alias is included solely to redirect to apex; authorize it with the apex attachment.

```json
"routes": [
  { "pattern": "mapframework.org", "custom_domain": true },
  { "pattern": "www.mapframework.org", "custom_domain": true }
]
```

6. Reconcile conflicting website records in the Cloudflare zone during that authorized attachment: the imported apex A records and www CNAME must not keep pointing at the former site. Custom Domains manages the Worker DNS records and certificates. In particular, an existing CNAME conflicts with custom-domain creation; remove/replace only the approved www website record, preserving unrelated records. Do not point GoDaddy A records or a CNAME at the workers.dev staging URL. GoDaddy DNS records become non-authoritative after delegation, and need not be deleted.
7. Verify certificate issuance and HTTPS for apex and www, www-to-apex and HTTP-to-HTTPS redirects, path/query preservation, all 12 routes, images, metadata, headers, real 404, robots, sitemap, and absence of noindex on successful canonical production HTML. Verify APIs/errors still exclude indexing and staging still excludes indexing. Check mail and other preserved services. Do not enable includeSubDomains/preload HSTS without reviewing all subdomains.
8. Observe the deployed version and errors. Keep the prior production Worker version and DNS export available. Agree on rollback authorization in the cutover window: Worker rollback is preferable for code defects; delegation/website-record rollback requires the authorized DNS plan and is subject to propagation delay.

The nameserver strings and eventual certificate state cannot be filled in until the separately authorized zone is created. Cloudflare's [full setup instructions](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/) describe delegation, and [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) describes managed DNS/certificates and CNAME conflicts.

## Validation and accessibility review

The PR adds production origin/indexing/redirect regression coverage alongside existing scoring and Worker tests. It strengthens essential control borders, adds explicit collection headings where h1 previously skipped to h3, gives the full constellation detail a polite atomic status region, and adds scroll margins to keep focused controls below the sticky header. Public conceptual content and private/public ALIVE boundaries are unchanged.

Additional review covered all 12 routes at desktop and mobile widths using axe WCAG 2 A/AA, 2.1 AA, and best-practice rules. No detected violations remained. Each page has one main and one h1, with no positive tabindex values. Gradient contrast was reviewed separately using conservative color compositing (brightest overlapping gradient bounds; sticky header over white as worst case). All assessed visible text passed its 4.5:1 normal / 3:1 large threshold; lowest conservative text ratio was 5.11:1. Decorative imagery is not treated as body text. The strengthened control border has a conservative 3.26:1 contrast against the brightest modeled header background. Focus presentation was also inspected.

Keyboard review verified desktop navigation order; mobile menu order and Escape focus return; skip-to-main; all 11 constellation buttons activated with Space and corresponding status text; visible focus rings and no header occlusion for those controls; Delta's radio-group, response-group, confidence slider, escalation checkbox, Submit, and Reset tab order. Accessibility-tree inspection verified labels, group legends, live status output, and the timer's aria-live=off. This is browser/semantic review, not a claim of narrated NVDA/JAWS/VoiceOver testing or full WCAG certification.

Local validation passed: npm ci; all 11 regression tests plus artifact/publication checks; npm run build; both Wrangler dry runs; all 12 local HTTP routes, 23 linked resources and 10 image hashes; npm audit reported zero vulnerabilities. README, LICENSE and public assets were compared with origin/main and are unchanged. CI results are recorded in the PR.
