# Architecture Publisher

Architecture Publisher compiles explicit, source-bound system meaning into
truthful, audience-specific Architecture Editions.

It is not an architecture inference engine, drawing editor, SDD authority, or
ETHOS subsystem. Source systems own truth. Editions own communication. Scenes
own composition. Renderers produce bytes. Qualification records exact judgments.
Publication performs bounded, recoverable effects.

## Product chain

```text
Source Bundle + Claim Model + Edition
                 |
                 v
          Edition Candidate
          /               \
  static scene        interactive scenes
       |                     |
  SVG / PNG          standalone HTML
          \               /
           Qualification Set
                  |
           Publication Plan
                  |
       publication and recovery receipts
```

Each arrow is a contract boundary. A later layer may project an earlier value;
it cannot reinterpret it or grant authority to it.

- [Product contract](docs/product-contract.md) defines the canonical product
  meaning and authority boundaries.
- [Edition contract](docs/edition-contract.md) defines audience, coverage,
  independent scenes, and qualification obligations.
- [Operational reference](docs/reference/operations.md) documents the current
  public command surface and historical release boundaries.
- [Mechanism evaluation](docs/research/mechanism-evaluation.md) records
  source-level adopt, reject, and defer decisions.

## Identity

| Surface | Identity |
| --- | --- |
| Product | Architecture Publisher |
| Core package | `architecture-publisher` |
| Public CLI | `archpub` |
| ETHOS migration package | `@architecture-publisher/ethos`, removed after source-owned adoption |
| Canonical repository | `architecture-publisher` after accepted migration |
| ETHOS publication | `ETHOS Architecture` / `ETHOS · 问道` |

The checkout retains its historical path until the governed rename. Signed
alpha.7 tags and release bytes remain immutable predecessor evidence.

## Install and inspect

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm test
npm pack --ignore-scripts --workspace architecture-publisher
node packages/publisher/src/cli/main.mjs --help
```

The current generic journeys are:

```sh
archpub source pack <request.json> --sha256 <digest>
archpub source verify <manifest.json> --sha256 <digest>
archpub edition build <request.json> --sha256 <digest>
archpub evolution plan <request.json> --sha256 <digest>
archpub render interactive <type> <input.json> --sha256 <digest> --output <artifact.html>
archpub render raster <request.json>
archpub render measure <request.json>
archpub qualify verify <qualification-set.json> --sha256 <digest>
archpub publish plan <request.json>
archpub publish apply <plan.json> <authorization.json>
archpub publish recover <plan.json> <authorization.json>
```

Every path and digest is caller-selected. Installed operation is designed to be
offline and independent of Git, ETHOS, adjacent checkouts, personal credentials,
and ambient repository discovery.

## Workspace boundaries

The current checkout is migration staging, not the terminal ownership model:

```text
packages/publisher/          generic product package
packages/extensions/architecture-publisher/
                             self-Edition before its final in-repository move
packages/extensions/ethos/   temporary central ETHOS migration package
examples/self-host/          bounded structural self-use
examples/aigw/               temporary AIGW adoption evidence
```

The terminal product repository keeps the generic package, renderer supply,
the source-owned live Edition for Architecture Publisher itself, and compact
conformance fixtures. The live ETHOS and AIGW Editions belong to their source
repositories. Conformance consumes portable standard values or an independently
installed package; ordinary runtime has no adjacent checkout dependency.

The root remains a private development and conformance workspace, not the
published package. The core never imports a concrete Edition. A source-owned
Edition depends inward only through exported core contracts and retains its
source product's native authorization and release lifecycle.

The first-party flagship self-Edition, source-repository migration, and complete
AIGW Edition remain work of the active 0.2 Change. The task ledger, not this
README, owns their completion state.

## Media independence

Static and interactive publications share selected semantic identities and
coverage obligations, not coordinates, DOM, screenshots, or approval.

- Static output is composed for one-frame causal comprehension and deterministic
  SVG/high-resolution PNG delivery.
- Interactive output is composed for a complete first screen, exploration,
  focus, trace, source inspection, and complete mechanism pages.

Neither medium is generated from the other.

## State boundaries

An `Edition Candidate` is built, not accepted. A `Qualification Set` records
external predicate judgments, but does not authorize publication. A
`Publication Plan` describes an effect, and apply/recovery require explicit
caller-owned authorization.

```text
built ≠ qualified ≠ authorized ≠ published ≠ hosted-observed
```

## Governance

This repository is governed by ETHOS. OpenSpec owns active Change intent and
`openspec/changes/architecture-publisher-0-2/tasks.md` is the sole progress
ledger. Work occurs only in an owned Work Lane after exact-path admission.
Skills, CI, renderers, browsers, and adapters are replaceable capabilities; none
is a semantic or mutation authority.

## Historical alpha.7 identity

Release `v0.1.0-alpha.7` remains bound to commit
`375c58ad49fb693de36c753b8a6d77b772b73a7c`, package
`architecture-publishing/0.1.0-alpha.7`, and former repository path
`dig/research/human-agent-stewardship/ethos-architecture`. Exact identities are
recorded in [`docs/migration/alpha7-baseline.json`](docs/migration/alpha7-baseline.json).

Independent off-host disaster recovery remains explicitly unproved and outside
this Change until an operator selects its destination, custody policy, and
credential boundary.
