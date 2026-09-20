# Architecture Publisher

Architecture Publisher compiles explicit, source-bound system meaning into
truthful, audience-specific, independently rendered Architecture Editions.

It is not an architecture inference engine, a drawing editor, an SDD authority,
or an ETHOS subsystem. Source systems own truth. Editions own communication.
Renderers produce bytes. Qualification records exactly what was checked.
Publication performs bounded, recoverable effects.

## Product chain

```text
Source Bundle
  -> Claim Model
  -> Edition
  -> independent static and interactive scenes
  -> artifacts
  -> qualification
  -> recoverable publication
  -> readers and feedback
```

- [Product contract](docs/product-contract.md) — canonical product meaning and
  authority boundaries.
- [Edition contract](docs/edition-contract.md) — audience, coverage, scenes, and
  qualification.
- [Operational reference](docs/reference/operations.md) — detailed commands,
  implementation limits, and historical alpha.7 delivery facts.
- [Mechanism evaluation](docs/research/mechanism-evaluation.md) — source-level
  adopt, reject, and defer decisions.

## Identity

| Surface | Current identity |
| --- | --- |
| Product | Architecture Publisher |
| Package | `architecture-publisher` |
| CLI | `archpub` |
| Canonical repository | `architecture-publisher` after the accepted migration |
| ETHOS publication | `ETHOS Architecture` / `ETHOS · 问道` |

The current checkout retains its historical path until the governed rename
closure. Signed alpha.7 tags and released bytes remain immutable predecessor
evidence.

## Quick start

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm test
npm pack --ignore-scripts --pack-destination build
```

After installing the package:

```sh
archpub source verify /chosen/input/manifest.json --sha256 <digest>
archpub semantic compare /chosen/compare.json --sha256 <digest>
archpub publish semantic /chosen/publication.json --sha256 <digest>
```

All paths and digests are caller-selected. Ordinary installed use is offline and
does not require Git, ETHOS, adjacent checkouts, personal credentials, or an
agent session. Commands return scoped JSON results; success never implies source
truth, aesthetic approval, or external authorization beyond the named predicate.

## Editions

- `editions/architecture-publisher/` — first-party product self-portrait and
  flagship quality reference.
- `editions/ethos/` — ETHOS flagship static publication and interactive atlas.
- `editions/aigw/` — independent adopter and semantic-evolution proof.
- `examples/structural/` — small protocol examples without flagship claims.

The first-party self-Edition and AIGW Edition are introduced by the active 0.2
Change. Until that Change is accepted, their current implementation status is
reported by OpenSpec rather than inferred from this roadmap.

## Media independence

Static and interactive publications share semantic identities and coverage
obligations, not coordinates or implementation structure.

- Static output is authored for one-frame comprehension and deterministic SVG/
  high-resolution PNG delivery.
- Interactive output is authored for a complete overview, exploration, source
  inspection, and complete mechanism pages.

Neither medium is a screenshot or serialization of the other.

## Governance

This repository is governed by ETHOS. OpenSpec owns active Change intent and task
progress. Work occurs only in an owned Work Lane after exact path admission.
Skills, CI, renderers, browsers, and source adapters are replaceable projections;
none grants semantic or mutation authority.

Current work:

```sh
openspec list --json
archpub --help
```

## Historical alpha.7 identity

Release `v0.1.0-alpha.7` remains bound to commit
`375c58ad49fb693de36c753b8a6d77b772b73a7c`, package
`architecture-publishing/0.1.0-alpha.7`, and the former repository path
`dig/research/human-agent-stewardship/ethos-architecture`. It links the immutable
alpha.5 ETHOS reader and retains alpha.3 as the complete recovery release.
Exact local and remote identities are recorded in
[`docs/migration/alpha7-baseline.json`](docs/migration/alpha7-baseline.json).

Independent off-host disaster recovery is not yet proved; it requires an
operator-selected destination, custody policy, and bounded credential.
