# Experiment architecture

Target architecture:

```text
Versioned test definition
        ↓
Experiment runner
        ↓
Model/system interface
        ↓
Raw response + metadata
        ↓
Versioned scoring engine
        ↓
Cloudflare D1
        ↓
Analysis/dashboard
```

Required provenance fields before persistent research runs:

- experiment version
- test-instance version
- scoring version
- model/system identifier
- relevant model/system configuration
- timestamp
- condition
- raw output where appropriate
- component scores
- resource measurements where available
- evaluator/human-review status where applicable

## Public vs private instances

The public repository can contain public demo cases and methodology. Protected evaluation instances should not be committed to a public repository. They may later live in a private repository, encrypted store, or restricted Cloudflare data plane after the contamination, access-control, retention, and audit model is specified.

## Composite scoring

A composite may be explored later, but it must never conceal a critical component failure. Component metrics remain primary.
