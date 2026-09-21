<!-- markdownlint-disable MD013 -->

# Architecture Publisher operational reference

This document describes the current 0.2 public surface. Historical release facts
are isolated at the end. The OpenSpec task ledger owns implementation status;
this reference does not.

## Authority and state model

Architecture Publisher consumes selected values. It does not discover a
repository, infer intent from code, execute an SDD lifecycle, or synthesize
acceptance.

```text
Source Bundle -> Claim Model -> Edition -> Edition Candidate
                                      -> Qualification Set
                                      -> Publication Plan
                                      -> effect and recovery receipts
```

A successful command reports only its named operation. In particular:

```text
rendered or built != qualified
qualified != authorized
applied != hosted-observed or released
```

## Installation

The repository root is a private workspace. Pack the generic core independently:

```sh
npm pack --ignore-scripts --workspace architecture-publisher \
  --pack-destination build/packages
```

The core package has no runtime npm dependencies. Source repositories own their
concrete adapter and Edition packages and depend inward on an exact compatible
core. Installed journeys accept caller-selected files and can run with an empty
HOME and no adjacent checkout discovery.

## Public CLI

```text
archpub source pack|verify
archpub edition build
archpub evolution plan
archpub render interactive|raster|measure
archpub qualify verify
archpub publish plan|apply|recover
```

`archpub --help` and scoped help are generated from the same declarative command
catalog that owns dispatch. Errors are JSON with a stable `error.code`; usage
errors also identify the appropriate scoped help command.

### Source Bundle

Package explicit selected files:

```sh
archpub source pack <request.json> --sha256 <request-digest>
```

The request schema is `architecture.pack-input/v1` and contains:

```json
{
  "schema": "architecture.pack-input/v1",
  "source": {"id": "system", "revision": "selected-revision"},
  "files": [
    {
      "input": "./selected/model.json",
      "path": "model.json",
      "bytes": 123,
      "sha256": "<64 lowercase hex>"
    }
  ],
  "output": "./bundle"
}
```

Verify a closed bundle without exposing member bytes:

```sh
archpub source verify <bundle/manifest.json> --sha256 <manifest-digest>
```

Selection, packaging, and verification establish byte identity only. They do not
establish semantic acceptance or publication authority.

### Edition Candidate

```sh
archpub edition build <request.json> --sha256 <request-digest>
```

The request selects an exact Source Bundle, one Claim Model member, one exact
Edition file, and an absent output directory. The build validates semantic and
Edition contracts, compiles independent static and interactive scenes, invokes
selected renderers, and emits an `architecture.edition-candidate/v1` bundle.
The selected Edition itself uses the closed `architecture.edition/v1` schema,
and the request binds its exact `editionSha256` before compilation.

The result is `status: built` with `qualification: not-performed` and
`publication: not-performed`. Generated files are never authoring inputs.

### Evolution

```sh
archpub evolution plan <request.json> --sha256 <request-digest>
```

The request schema is `architecture.semantic-compare-input/v2`. It selects exact
before/after Claim Models, Edition sets, and explicit correspondences. The pure
compiler returns separate obligations for:

- rebuild;
- semantic verification;
- medium verification;
- human review;
- acceptance;
- publication or withdrawal.

It performs none of those effects. Unknown or unrepresented meaning broadens
work. Rename, split, and merge evidence preserves lineage but never transfers
approval.

### Rendering

Interactive rendering:

```sh
archpub render interactive <type> <input.json> \
  --sha256 <input-digest> --output <artifact.html>
```

The renderer consumes an explicit renderer-neutral scene or admitted native
input. It cannot discover source meaning or grant Edition acceptance.

Raster rendering:

```sh
archpub render raster <request.json>
```

The request selects a closed SVG/font bundle, its digest, the SVG member,
explicit font members and weights, target width, and absent PNG output. The
bundled Resvg supply is pinned and verified before use.

Typography measurement:

```sh
archpub render measure <request.json>
```

The request explicitly selects the native compiler, SDK, font files, and output.
This operation records measurement; it does not infer fonts from the host.

### Qualification

Predicate executors produce exact records outside the generic verification
command. Admit a selected set against its exact authorities with:

```sh
archpub qualify verify <request.json> --sha256 <digest>
```

The portable `architecture.qualification-input/v1` request selects the exact
Claim Model, Edition, Edition Candidate, and Qualification Set by relative path
and raw SHA-256. The Candidate must bind those Claim Model and Edition bytes;
the Qualification Set must bind that Candidate.

`architecture.qualification-set/v1` binds:

- candidate, Edition, source, and semantic digests;
- one or more predicate-specific records;
- exact subject identity;
- verifier identity and implementation digest;
- scope and optional environment;
- observations, verdict, and limitations.

Verification rederives scenes and obligations from the selected Claim Model and
Edition, validates record identities and uniqueness, and computes the
non-compensating conjunction of `PASS`, `FAIL`, and `UNKNOWN`. It does not run a
verifier, turn self-declaration into evidence, grant authorization, or publish.

### Recoverable publication

Plan a bounded paired-file effect:

```sh
archpub publish plan <request.json>
```

The request explicitly selects source roots, the stable `native` and `atlas`
publication destinations,
recovery root, payload entries, dependencies, and optional prior replacement.
The result is a dry plan; it writes no delivery target.

After a source product or operator supplies an exact authorization bound to the
plan digest:

```sh
archpub publish apply <plan.json> <authorization.json>
archpub publish recover <plan.json> <authorization.json>
```

The file engine preserves foreign content, checks destination pre-state, records
its journal before mutation, uses one writer boundary, and supports bounded
interruption recovery. These commands establish local filesystem effects only;
they do not claim hosted availability, release publication, or semantic
acceptance.

## Public JavaScript contracts

The core exports narrow owners:

```text
architecture-publisher/source
architecture-publisher/semantics
architecture-publisher/edition
architecture-publisher/scene
architecture-publisher/compiler
architecture-publisher/rendering
architecture-publisher/qualification
architecture-publisher/publication
architecture-publisher/runtime
architecture-publisher/renderers/archify
architecture-publisher/renderers/fonts
architecture-publisher/renderers/resvg
architecture-publisher/renderers/svg
```

The font-supply export owns verified font and license bytes shared by sibling
renderers. Archify consumes that capability but does not own or re-export it.

The first-party self-Edition exports:

```text
@architecture-publisher/self-edition
@architecture-publisher/self-edition/edition
@architecture-publisher/self-edition/runtime
```

Its public Edition surface prepares explicit source-bound inputs and renders the
independent flagship static candidate. The render result remains unqualified
and unpublished until the later qualification and publication contracts admit
those exact bytes.

The source-owned ETHOS repository exports:

```text
@architecture-publisher/ethos/adapter
@architecture-publisher/ethos/edition
@architecture-publisher/ethos/runtime
```

The integration API consumes explicit ETHOS inputs and exposes input adapters for
source import/verification, atlas, poster, review, and publication journeys. It
is deliberately not a second CLI. It cannot compile ETHOS Commitments, control
Work Lanes, mint proof, execute CAS effects, or accept ETHOS state. This
repository retains only the exact digest-bound source-ownership handoff under
`conformance/fixtures/ethos-source-owned-handoff.json`.

## Media independence

Static and interactive scenes share semantic identities, selected coverage, and
portable design tokens. They do not share required coordinates, DOM structure,
artifact bytes, or approval.

- Static output targets single-frame comprehension and exact SVG/PNG geometry.
- Interactive output targets a complete first-screen overview plus complete
  mechanism pages, navigation, focus, trace, source inspection, and responsive
  behavior.

A screenshot of HTML is not the static compiler. An HTML wrapper around a poster
is not the interactive compiler.

## Development and verification

Use the repository-pinned Node/npm line and lockfile:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm test
```

`npm run check` performs repository syntax coverage and workspace-aware Knip
analysis over the private root, core product, and extensions. Vendored Archify
and raster supply are verified by their supply-chain and behavior tests rather
than misclassified as first-party dead-code entries.

`npm test` includes ordinary offline source, semantic, Edition, scene, rendering,
package, installed-use, publication, replacement, and recovery behavior. Tests
that require explicitly selected historical or browser evidence skip when their
selectors are absent; a skip is not a pass for that qualification.

Current opt-in selectors include:

| Selector | Scope |
| --- | --- |
| `ETHOS_ATLAS_PLAN` | Exact current atlas and browser-obligation selection |
| `ETHOS_QUALIFIED_PAIR_PLAN` | Exact current qualified paired publication |
| `ETHOS_PAIR_PLAN` | Frozen historical paired-publication generation |
| `ETHOS_REVIEW_PLAN` | Historical review-continuity generation |
| `PAIR_PRIOR_NATIVE`, `PAIR_PRIOR_ATLAS` | Explicit copied prior deliveries for migration rehearsal |

Never edit immutable release plans or substitute a similarly named newer
generation. Evidence is applicable only to its exact bytes and declared scope.

## First-party conformance consumers

- `conformance/journeys/self-host/` is a bounded structural self-use journey through the
  public generic contracts. It is not the final flagship self-Edition.
- `editions/self/` is the source-owned Architecture Publisher self-Edition.
- `conformance/fixtures/ethos-source-owned-handoff.json` records the immutable
  ETHOS package, parity, semantic-successor, and remaining-acceptance boundary.
  The mutable ETHOS adapter and Edition live only in the ETHOS repository.
- `migration/aigw/` currently supplies migration evidence. The live AIGW Edition
  is completed in the AIGW repository, then consumed here through portable
  standard values or an independently installed package with no adjacent
  checkout dependency.

## Historical alpha.7 identity

The private GitLab predecessor project is
`dig/research/human-agent-stewardship/ethos-architecture`. Release
`v0.1.0-alpha.7` selects package `architecture-publishing/0.1.0-alpha.7` and
links the immutable alpha.5 reader release. These facts describe historical
objects and do not define the current command surface.

| Role | Canonical entry | Historical status |
| --- | --- | --- |
| Published reader | GitLab release `v0.1.0-alpha.5` assets `ETHOS-architecture.html` and `ETHOS-architecture-6000.png` | Immutable published bytes; alpha.7 links them by URL and SHA-256 |
| Candidate viewing copy | Local delivery `ETHOS-architecture-viewing/README.md` | `VIEWING_COPY_NOT_QUALIFIED_RELEASE`; not promoted |
| Documents convenience delivery | Local `ETHOS-architecture.html` and `ETHOS-architecture-6000.png` | Preserved local bytes; not promoted by alpha.7 |
| Complete recovery | GitLab release `v0.1.0-alpha.3` asset `ETHOS-architecture-recovery.tar.xz` | Selected complete reader and publisher recovery closure |

The preserved local convenience digests are:

```text
HTML 804971adf9be09d3389d7229441200a4116e5d336334e33fd9b328ba66282cfa
PNG  5f4ea104b95112d84635881600d2c75ae3eae65a45b4b61a4fe5936df3ee3cda
```

The signed alpha.7 tag and all earlier release bytes remain unchanged. No
predecessor repository archive is required in the successor registry.
Independent off-host disaster recovery remains unproved and excluded until an
operator selects destination, custody, and credentials.
