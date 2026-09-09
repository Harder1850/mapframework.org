# MAP Framework — mapframework.org

**Canonical production repository for [mapframework.org](https://mapframework.org).**

This repository contains the production website for the MAP Framework, including its public content, research presentations, applications, experiments, interactive tools, visual assets, and supporting infrastructure.

---

## Purpose

`mapframework.org` is the public presentation and experimental interface for the MAP Framework.

The website translates selected work from the broader MAP research program into material intended for public use without making the website itself the authoritative source for the underlying framework.

The governing distinction is:

**MAP research and architecture → selected public material → mapframework.org**

The website communicates MAP. It does not define MAP.

---

## MAP Framework

**MAP = Metamorphosis · Aletheia · Praxis**

The MAP Framework investigates how purposeful systems move from reality to understanding, from understanding to action, and from action to transformation — then learn from the reality that transformation creates.

A concise expression of the framework is:

> **Uncover what is true. Understand what it means. Act on what matters. Transform what is possible.**

MAP is being developed across several related areas, including:

- Purpose and recursive adaptive systems
- Aletheia and truth-seeking
- Relational Intelligence
- Learn the Delta
- Cognitive Economy
- Organizational performance and adaptive governance
- RCP and experimental research
- ALIVE computational architecture

---

## Website Architecture

The intended public information architecture includes:

    mapframework.org/
    │
    ├── /
    │
    ├── framework/
    ├── map/
    ├── relational-intelligence/
    ├── applications/
    ├── experiments/
    │   └── delta/
    ├── research/
    │   └── rcp/
    ├── alive/
    ├── library/
    └── roadmap/

This structure may evolve as the research and public implementation develop.

---

## Experiments

The website may host interactive research demonstrations and experiments associated with MAP and RCP.

Experimental work should preserve:

- hypothesis
- variables
- controls
- scoring methodology
- falsification conditions
- competing explanations
- experiment version
- model/system configuration where applicable
- provenance
- results

Synthetic, demonstration, or simulated data must be clearly identified as such.

Experimental results should not be represented as established evidence beyond what the methodology and data support.

---

## Epistemic Discipline

Public MAP material should distinguish among:

- **Established Evidence**
- **Supported Inference**
- **Harder Proposed Principle**
- **Hypothesis**
- **Engineering Proposition**
- **Speculation**
- **Open Research Question**

MAP-specific hypotheses are not established scientific findings merely because they form part of the framework.

Claims should remain traceable to evidence, reasoning, experimental results, or their explicitly stated epistemic status.

---

## Relationship to Other Repositories

### `map-framework`

The `map-framework` repository is the canonical research and architecture repository for MAP.

It contains the deeper conceptual development, research, provenance, experimental specifications, and related intellectual work.

Material should move from `map-framework` to this repository deliberately rather than automatically.

### ALIVE

ALIVE is the computational engineering workstream associated with MAP.

Its implementation repositories remain separate from the production website.

The website may explain or demonstrate selected ALIVE concepts without becoming the canonical source for ALIVE engineering.

---

## Production Architecture

The canonical production path is:

**GitHub → Cloudflare → mapframework.org**

### GitHub

This repository is the sole source of truth for production website code, approved public content, assets, experiment interfaces, dashboard code, and configuration.

### Cloudflare

Cloudflare provides production deployment and infrastructure, including as appropriate:

- deployment
- DNS
- HTTPS
- security
- Workers/API functions
- D1
- R2

### Domain

`mapframework.org` is the canonical public domain.

GoDaddy is the domain registrar only. Do not change nameservers or DNS until the Cloudflare deployment has been validated and explicit domain cutover is approved.

---

## Development Principle

Prototype environments may be used for design exploration, experimentation, or migration reference.

They are not independent production websites.

Material from prototypes should be reviewed and deliberately migrated into this repository before becoming part of the canonical website.

---

## Publication and Intellectual Property

The public website represents a deliberately selected subset of the broader MAP research program.

Not all MAP research, experimental methodology, ALIVE architecture, unpublished material, or publication-targeted work is intended for public release.

Before publishing material, consider:

- publication strategy
- existing submissions
- intellectual property
- experimental integrity
- test contamination
- provenance
- evidentiary status
- overlap with reserved research or publications

Public availability should be a deliberate decision, not an automatic consequence of repository availability or deployment capability.

See `docs/PUBLICATION_FIREWALL.md` for the operational publication boundary. In particular, do not commit unpublished HBR-targeted Learn the Delta material, private ALIVE implementation details, unpublished experimental results, or protected/private evaluation instances.

---

## Local Development

```bash
npm ci
npm run dev
```

## Validate

```bash
npm run test
```

## Production Build

```bash
npm run build
```

## Cloudflare Preview Deployment

```bash
npx wrangler deploy
```

This deploys according to the authenticated Cloudflare account, initially to a preview/`workers.dev` endpoint. It does **not** require or imply DNS changes for `mapframework.org`.

D1 and R2 should remain unconfigured until they are required by an approved production capability.
