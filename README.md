# Architecture Publisher

Architecture Publisher compiles explicit, source-bound system meaning into
truthful, audience-specific Architecture Editions.

It is not an architecture inference engine, drawing editor, SDD authority, or
ETHOS subsystem. Source systems own truth. Editions own communication. Scenes
own composition. Renderers produce bytes. Qualification records exact judgments.
Publication performs bounded, recoverable effects.

## Product chain

```text
selected source evidence + checked interpretation + authored Edition
     (direct inputs or optional Edition Provider transport)
                                  |
                         archpub edition build
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
Native inputs do not require a tracked duplicate Claim Model or a Source Bundle
as separately authored files. The Provider is a transport choice, not another
compiler or approval path.

- [Product contract](docs/product-contract.md) defines the canonical product
  meaning and authority boundaries.
- [Edition contract](docs/edition-contract.md) records the historical v1
  audience, coverage, scene, and qualification contract; successor authoring is
  selected through the versioned Build Request and Edition Project.
- [Edition Provider reference](docs/reference/edition-provider.md) defines the
  optional owner-attributed materialization boundary.
- [Changelog](CHANGELOG.md) records notable released changes and compatibility
  notes under Semantic Versioning.
- [Operational reference](docs/reference/operations.md) documents the current
  public command surface and historical release boundaries.
- [Off-host recovery decision contract](docs/reference/disaster-recovery-decision-contract.md)
  defines the operator choices still required before independent recovery can be
  claimed.
- [Mechanism evaluation](docs/research/mechanism-evaluation.md) records
  source-level adopt, reject, and defer decisions.

## Identity

| Surface              | Identity                                                                      |
| -------------------- | ----------------------------------------------------------------------------- |
| Product              | Architecture Publisher                                                        |
| Core package         | `architecture-publisher`                                                      |
| Public CLI           | `archpub`                                                                     |
| ETHOS integration    | Source-owned `@architecture-publisher/ethos`; immutable handoff retained here |
| Canonical repository | `architecture-publisher`                                                      |
| ETHOS publication    | `ETHOS Architecture` / `ETHOS · 问道`                                         |

The local checkout and GitLab project are the same history-preserving repository
object under the canonical `architecture-publisher` identity. Signed alpha.7
tags and release bytes remain immutable predecessor evidence.

The first selected-input v2 release is `v0.3.0-alpha.4`. Its exact package and
media identities, primary-forge readback, and limits are recorded in the
[operational reference](docs/reference/operations.md#released-selected-input-baseline).
That Publisher release is not ETHOS or AIGW acceptance.

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
archpub edition build <request.json> --sha256 <digest> --output <candidate-directory>
archpub evolution plan <request.json> --sha256 <digest>
archpub render interactive <type> <input.json> --sha256 <digest> --output <artifact.html>
archpub render raster <request.json>
archpub render measure <request.json>
archpub qualify verify <request.json> --sha256 <digest>
archpub publish plan <request.json>
archpub publish apply <plan.json> <authorization.json>
archpub publish recover <plan.json> <authorization.json>
```

For native comparisons that select executable Providers, the same evolution
command additionally requires independent `--execute-before-providers` and
`--execute-after-providers` choices with exact `id@manifest-sha256` pairs.

The `--output` form is required for a successor Build Request; historical v1
plans retain their own output field. Every path and digest is caller-selected.
One Build Request may combine direct inputs and optional selected Edition
Providers before the same compiler. Selecting an executable Provider is a
code-execution trust decision, not sandboxed interpretation.
Installed operation is designed to be offline and independent of Git, ETHOS,
adjacent checkouts, personal credentials, and ambient repository discovery.

## Workspace boundaries

The current checkout separates product ownership from adopter evidence:

```text
packages/publisher/          generic product package
editions/self/
                             source-owned flagship self-Edition
conformance/journeys/self-host/          bounded structural self-use
conformance/fixtures/ethos-source-owned-handoff.json
                             immutable ETHOS adoption evidence
conformance/fixtures/aigw-source-owned-handoff.json
                             immutable AIGW adoption evidence
```

The terminal product repository keeps the generic package, renderer supply,
its self-Edition, and compact conformance fixtures. ETHOS and AIGW retain
authority over their own source assertions and acceptance. Edition placement
follows the designated editor: the editor may work independently, or a source
product may elect co-location. Neither choice transfers source authority or
requires a source-product CI gate for independent, read-only analysis.
Conformance consumes portable standard values or an independently installed
package; ordinary runtime has no adjacent checkout dependency.

The root remains a private development and conformance workspace, not the
published package. The core never imports a concrete Edition. A source-owned
Edition depends inward only through exported core contracts and retains its
source product's native authorization and release lifecycle.

The active OpenSpec Change's task ledger, not this README, owns implementation
and release status.

## Media independence

Static and interactive publications share selected semantic identities and
coverage obligations, not coordinates, DOM, screenshots, or approval.

- Static output is composed for one-frame causal comprehension and deterministic
  SVG/high-resolution PNG delivery.
- Interactive output is composed for a complete first screen, exploration,
  focus, trace, and contextual inspection of selected meaning and source
  identity—not a source-code browser—across complete mechanism pages.

Neither medium is generated from the other.

## State boundaries

An `Edition Candidate` is built, not accepted. A `Qualification Set` records
external predicate judgments, but does not authorize publication. A
`Publication Plan` describes an effect, and apply/recovery require explicit
caller-owned authorization.

An invoker-selected v2 policy can assess submitted records against exact
requirements; it cannot authenticate their authors or grant acceptance.

Raw pair publication remains file-integrity-only. The qualified Edition form
selects a dual-media Candidate, Qualification Set, policy, and prior report;
one named decision adopts those exact bytes and a separate decision authorizes
the local effect. The receipt attributes those decisions without authenticating
the actors or granting a source-product or hosted release. Both forms use the
same `publish plan/apply/recover` commands and file installer.

```text
built ≠ qualified ≠ authorized ≠ published ≠ hosted-observed
```

## Governance

This repository is governed by ETHOS. OpenSpec owns active Change intent and the
active Change's `tasks.md` is the sole repository progress ledger. Work occurs
only in an owned Work Lane after exact-path admission.
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
