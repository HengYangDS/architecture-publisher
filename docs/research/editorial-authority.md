---
subject: architecture-publisher:editorial-authority
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# Editorial authority research

## Self-use does not yet prove a generic authoring baseline (2026-09-24)

At Publisher `e389d8955366fa87f134d2c80310196033b82241`, the separate
`@architecture-publisher/self-edition` package has 4,243 tracked `.mjs` lines.
Its `interactive-scene.mjs` and static `composition.mjs` alone have 840 and
740 lines. The self package explicitly prepares its Claim Model and Edition,
composes static and interactive flagship scenes, invokes public Publisher
primitives, and assembles its own Candidate. In contrast, the generic
interactive scene compiler positions grouped entities in fixed rows. The
existing installed self-use tests exercise selected public primitives with
that exact self-specific composer; they do not prove an unrelated
maintainer can obtain the same reader quality without writing comparable
composition code.

This is not a reason to delete the self Edition's authored art direction or
count its lines as poor quality. It is a falsifiable product-adoption gap. A
successor bake-off must run the same self source and reader questions through
the ordinary public Build Request, record time and decisions to first readable
static and standalone interactive baseline, then apply declared flagship
refinements through that same path. Compare visible coverage, quality and
source-delta update cost with ETHOS, full AIGW plus its limited Client
Projection, and native di-effect. If self-use still needs a privileged
composition path while adopters must hand-author geometry, the product's
generic authoring promise is unproved even if every existing self test passes.

### Owned-runtime coverage diagnostic (2026-09-24)

At Publisher `d7c9c02`, an isolated `c8 --all` probe included first-party
`packages/publisher/src/**/*.mjs`, `packages/publisher/renderers/**/*.mjs`, and
`editions/self/src/**/*.mjs`, excluding only third-party supply. A first pass
incorrectly excluded every `index.mjs`; inspection showed that Archify and
resvg `index.mjs` files are substantial first-party renderers, so the figures
below come from re-reporting the same raw test run with those files included.
It ran the unchanged `npm test` (615 pass, 2 skip) with coverage files under
`/tmp`; it did not alter the repository's configured gate. The combined result
was **96.54%** statements/lines, **92.26%** branches, and **98.64%** functions.
Of 4,605 branch units, 4,249 were covered; at that fixed denominator, 126 more
covered units would reach 95%. This is a diagnostic shortfall, not a passing
expanded gate or a prediction after source changes.

The aggregate also masks owner-specific gaps: `editions/self/src/runtime.mjs`
was not exercised, `packages/publisher/src/rendering/atlas.mjs` had 54% line
coverage, and the first-party Archify entry had 75.39% branch coverage. The
successor must first identify retained versus displaced
owners, then make each retained public entry and effectful path testable while
bringing all four aggregate dimensions above 95%. Adding tests solely to
soon-to-be-deleted composition code would increase migration cost without
improving the accepted successor; excluding retained code to manufacture a
passing percentage would be equally invalid.

### Comparable reader-question boundary (2026-09-24)

A tool bake-off needs the same promised reader questions, not merely the same
node count. The current selected source and Edition carriers have different
levels of editorial explicitness:

- **Publisher self (`d26773b`):** `editions/self/src/edition/prepare.mjs`
  authors eight explicit questions from overview through evolution. This is a
  usable editorial baseline, but its composition remains self-specific code.
- **AIGW Client Projection (`ea9b600b`):** Its Edition authors four prompts:
  overview, authority, adapters, and transaction, with eleven required claims.
  It is one chapter; human and recovery qualification are not selected.
- **ETHOS terminal (`709347f0`):** The view profile declares 24 aggregates and
  seven forbidden pairings; the Atlas catalog names thirteen pages. Neither
  selected JSON carrier authors per-page reader questions. Current
  `src/edition/evolution.mjs` generates default Edition prompts from page
  labels. Those prompts are incumbent code-authored defaults, not a separate
  question policy in the selected JSON; their successor use needs editor review.
- **di-effect (`8a168b6b`):** Three native LikeC4 views use `include *`; its
  accepted decision authorizes LikeC4 and Mermaid export. The DSL states no
  reader questions or reader-specific subsets.
- **Full AIGW product:** No whole-product Edition is tracked under
  `architecture/`; the current Provider owns only Client Projection. A complete
  product candidate needs a named editor and source-bound scope decision.

For feasibility probes, Publisher may state researcher-proposed questions where
none are authored, but must label their proponent and cannot treat a good-looking
render as source endorsement. Final adopter acceptance needs each designated
Edition editor's exact scope and question decision. This distinction permits a
fair direct-tool comparison for di-effect without forcing Publisher where the
native tool already suffices, while preventing Client Projection from being
rebranded as complete AIGW architecture.

### Frozen successor-comparison inputs (2026-09-24)

These are comparison inputs, not approval to reuse old media. Git object IDs
identify source content; SHA-256 values identify local bytes. The observed
source checkouts were clean except for di-effect's unrelated
`.serena/project.yml`, which was neither selected nor modified. A new build
and acceptance must bind their own exact inputs.

- **Publisher self.** Publisher HEAD
  `7af397864b52bdd81015b8e13d53100421bab68c`;
  `editions/self` tree `1a7d3a0c95d2fdab1d56d5be454d2e0edca6c1a8`
  and `packages/publisher` tree
  `3cee2dea0bdfe31d897c4e70e8751c2c8cd7ff06`, both unchanged from signed
  `v0.3.0-alpha.3` commit `b01dafa5ab1f34cdb026afde90821c66b09179da`.
  Eight code-authored questions cover overview, semantics, edition,
  composition, qualification, publication/recovery, adoption and evolution.
  The local alpha.3 6000 × 3375 PNG has SHA-256
  `4a81c81c611b035d7b6c75b895734f89cedc94bee72b52f8f7b1f66867b98490`;
  standalone HTML has
  `a03cdcf780a1c13a63a579517c019b389d583801cc4ce754defea0f438661f52`.
  Release-link readback was observed at 09:50 UTC, not continuously proven.
  The flagship implementation is not generic-authoring evidence.
- **ETHOS terminal.** ETHOS HEAD
  `709347f0ce0965e6a338aa5128c60c4d3f4044a8`;
  `integrations/architecture-publisher` tree
  `31677a318f0f9a072caed7c6b7bb318c71d034d1`; selected
  `system/projections/terminal-architecture/semantic-graph.json` SHA-256
  `6725c589f4f68201b2e1ce099ccc9cfc2b9087411ff34c9ad5d40629a73f629c`.
  Its Atlas has thirteen pages and the view profile has 24 aggregates, but
  per-page questions are code-generated defaults, not independently authored
  selections. The preserved 6000 × 3375 PNG is
  `5f4ea104b95112d84635881600d2c75ae3eae65a45b4b61a4fe5936df3ee3cda`;
  HTML is
  `804971adf9be09d3389d7229441200a4116e5d336334e33fd9b328ba66282cfa`.
  `docs/migration/alpha7-baseline.json` binds those copies to an older release
  baseline; it does not promote the current ETHOS revision.
- **AIGW Client Projection.** AIGW HEAD
  `ea9b600b957f53737eb605772825e43de2d01ac5`;
  `architecture/edition-provider` tree
  `e0f94db982c2f1b05862abcad0147c2b37d2b57f`.
  `provider.json` SHA-256 is
  `47bcec1a8db6bb06ffc7a8148df9f4a6eb3ff097a537112d9373b9553a39350b`;
  `edition.json` is
  `d7ee26e15e603285046f74577296d85fe8a211df601f3f96a86b7cedda2020de`.
  Four authored questions cover overview, authority, adapters and
  transaction, with eleven required claims. Human/recovery qualification is
  not selected. The Provider's content revision is not a Git commit.
  Conformance fixture media identities are Candidate evidence, not AIGW
  acceptance; no accepted media bytes were established here.
- **Whole AIGW product.** The same source revision has no whole-product
  Edition under `architecture/`. AIGW or a named editor must author its scope,
  questions, omissions and art direction; researcher questions remain
  provisional. The Client Projection cannot be relabelled as the whole product.
  No whole-product accepted static or interactive medium is established.
- **Native di-effect.** di-effect HEAD
  `8a168b6b9c6933c30ab2ea25e60cac8a54212566`;
  `tools/likec4/models` tree
  `9d08a56139d2756f46763d426c8febb828a994d7`. The three individual
  SHA-256 values appear in the native LikeC4 counterexample below. Its
  `five_layers`, `packages` and `runtime_flow` views each use `include *`;
  no reader-specific questions are authored. The LikeC4/Mermaid decision and
  a research PNG probe do not establish an accepted Publisher-style
  dual-medium publication.

A direct-tool win for one workload does not imply replacement of another.
Where accepted media or authored questions are absent, that absence limits
parity claims; it does not license invented acceptance or source endorsement.

## ETHOS source-owned abstraction counterexample (2026-09-24)

At ETHOS `87bbb0d68fc20034e80d8772d86410cb0b0dc0d3`, the selected
`system/projections/terminal-architecture/semantic-graph.json` has 113 nodes
and 164 edges (SHA-256
`6725c589f4f68201b2e1ce099ccc9cfc2b9087411ff34c9ad5d40629a73f629c`).
Its source-owned `view-profile.json` (SHA-256
`c548c2afb2a8186860382b57f64876d1c8d718c87973071da11e4c1c925afb5e`)
declares 24 aggregates, a projection for every node and edge, seven forbidden
aggregation-kind pairs, and no omitted graph member. All 113 nodes have
`contained` projections; 82 edges are `contained` within aggregates and 82
remain `direct`. These counts describe authored selection, not proof that the
rendered media visibly or correctly realizes it.

This is a counterexample to the current generic Edition v1 rule that a complete
overview must display every raw model entity and relation. A readable overview
can be complete for its reader question through explicit, source-owned
abstraction while retaining a total trace from each underlying member. A
successor contract must distinguish direct representation, containment,
approved aggregation, and explicit omission without importing ETHOS-specific
aggregate names or treating the view profile as a second source of product
truth. The general contract and its user experience remain design hypotheses
until AIGW, ETHOS, self, and unrelated-domain workloads are tested.

## AIGW authored-input cost and revision-kind counterexample (2026-09-24)

At AIGW `ea9b600b957f53737eb605772825e43de2d01ac5`, the declarative
Provider already lives at the source-owned `architecture/edition-provider/`
location. Its authored scope is explicitly **AIGW Client Projection** at its
declared source revision, not the whole AIGW product. The Claim Model has 12
entities, 11 relations, and 14 source members; all 14 recorded source hashes
match both its captured Source Bundle and the corresponding live files at the
observed HEAD. That byte match does not expand the Edition's stated scope to
onboarding, route/model lifecycle, readiness, update, or other product areas
visible in current `internal/cli/app.go` command composition.

The current source-owned `materialize.mjs` is 621 lines, `edition.json` is 517
lines, and `semantic.json` is 477 lines. Structurally, the Edition's `scenes`
section occupies 461 lines when pretty-printed and contains 33 route choices,
each with side directives across independent media scenes. This is an
authoring-cost signal, not a code-quality score: separate static and
interactive compositions are intentional, but source maintainers should not
need to own generic package installation, source packing, derived hash
rewriting, candidate building, and atomic replacement merely to maintain a
12/11 architecture chapter. The successor should test whether Publisher can
derive those identities and mechanics from source selectors and editorial
intent without losing AIGW's semantic or visual control.

The Provider's 64-hex subject revision is **not** a Git commit. In
`materialize.mjs:213–216`, AIGW removes `semantic.context.revision`, computes
SHA-256 over Publisher-canonical JSON of the remaining semantic model, and
sets that value as the revision. Independent recomputation produced
`e1972e7211d8835b82e628b77a4de80fbc9b05960074142fbaf830b8e03d4ac7`,
exactly matching the Claim Model and Provider. The captured Source Bundle
manifest also hashes to the Provider's declared
`7915527c43865d917645cb5b5c4ecd6f78f9c4ffa532243e5d89e61925da4f06`.
The attempted Git object and GitLab commit lookups used the wrong resolver;
their failure is **not** evidence of a lost source commit. The v1 contract
allows an untyped revision string, which made this category error possible.
The successor should declare revision kind and verification method: verify this
content-derived revision by its canonical digest, apply Git resolution only to
an explicitly selected VCS reference, and never infer either meaning from a
hash-shaped string. Verified content identity does not itself establish source
endorsement, implementation truth, or whole-product coverage.

### Native LikeC4 multi-view probe

A separate disposable probe used that same AIGW HEAD and the current
`architecture/edition-provider/_source/semantic.json` (SHA-256
`26b7c1d16adc112f8bff9c0c03e44e4800e24cb63106fb86124791c31232563c`).
The 5.7 KB derived LikeC4 source, identified during the run by SHA-256
`4db7f730f504a9739cf32b513e3e6a966d8437f80ad438c5eb0036f19265abac`,
selected the 12 entities and 11 directed relations in four authored views:
overview 12/11, authority 5/3, adapters 7/6, and transaction 3/2. It retained
source semantic IDs and relation planes as LikeC4 metadata, not as assertions
of native LikeC4 domain semantics. This was a research projection of the
**Client Projection subset**, not a whole-AIGW Edition or accepted source
authoring. The disposable generated source was not admitted as a durable
conformance fixture, so this observation cannot substitute for a reproducible
installed-product gate.

Installed LikeC4 `1.59.4` validated the source, exported five PNGs, and built
`--output-single-file` HTML. A background Chromium file-URL run opened the HTML
with no external requests or page errors. Two PNG export runs produced identical
bytes for every view. The automatic `index.png` duplicated the authored
`overview.png` byte-for-byte, while two HTML builds differed in embedded
Draw.io export data (`e579c7f8…` versus `a159b24a…`), so byte-stable HTML was
**not** established. The initial HTML view showed the titles, elements, and
edge labels, but neither the `plane` metadata nor the source semantic IDs were
visible to a reader. The exported overview was visually sprawling, with
default saturated boxes and excess whitespace. This is a concrete reason to
admit LikeC4's native model/view and offline delivery capabilities for further
testing while withholding visible semantic coverage, deterministic-HTML, and
flagship-publication approval. It does not prove that LikeC4 cannot be styled
or exported deterministically with a different qualified configuration.

## Successor mechanism selection (2026-09-24)

This is a bounded **feasibility** decision on the frozen inputs above, not
four-workload product acceptance. A candidate stops as a universal replacement
on the first decisive hard mismatch: loss of attributed relation meaning,
reader-question coverage, independently composed static and interactive media,
exact offline input/output identity, or a named acceptance boundary. It may
still remain the best native source or medium-specific backend.

At 11:04 UTC on 2026-09-24, read-only GitHub Release API responses reported stable
[LikeC4 v1.59.4](https://github.com/likec4/likec4/releases/tag/v1.59.4)
(MIT), [D2 v0.9.0](https://github.com/d2lang/d2/releases/tag/v0.9.0)
(MPL-2.0), and
[Structurizr v2026.09.19](https://github.com/structurizr/structurizr/releases/tag/v2026.09.19)
(Apache-2.0). The first two match the installed local CLIs; Structurizr was
inspected at source level, not installed or run. At that probe the selected
offline Archify supply was 2.16.0 (MIT), resvg was 0.48.1 (Apache-2.0 OR MIT), and the installed
browser test library was Playwright Core 1.63.0. License observations identify
reuse constraints; they are not a legal clearance.

### Direct tool routes

- **LikeC4:** On frozen native di-effect, 102 authored lines became 124 for
  three scoped views; validation, repeatable PNGs and an offline single-file
  HTML succeeded. Generated cross-workspace relation IDs and repeated HTML
  bytes were unstable; source-specific visible claims and accessibility were
  not established. On frozen AIGW Client Projection, a separate 5.7 KB
  research translation produced four views but did not visibly show semantic
  IDs or relation planes. Direct use remains credible for di-effect's present
  native scope, not as a universal replacement. The 22 net lines and 5.7 KB
  are measured; time to source-approved AIGW or ETHOS art direction was not.
- **D2:** A fresh 24-line derivation of AIGW's current 12 entities and 11
  relations, SHA-256
  `e4d9b12ff873b89d0c0194dc583ae07d2f9d359f897cd33c82e30134aab80eda`,
  validated. Dagre, ELK and TALA each emitted an SVG (20,202, 20,465 and
  20,090 bytes). The source omitted qualifiers, plane, provenance and
  questions; D2's CLI does not emit a standalone interactive Atlas. Retain
  as a static layout/render candidate, not a complete publication. A
  semantically complete adapter remains unbuilt; 24 generated lines are not
  a cost estimate for it.
- **Structurizr:** Its active release implements C4 model/view and export,
  but the inspected static-site exporter emits multiple files and its
  PNG/SVG route uses the browser viewer. That inspected route fails the
  standalone, independently composed dual-medium requirement. Native C4
  ingestion remains a candidate. Installation, conversion, aesthetics,
  accessibility and upgrade effort were not measured.
- **Archify:** The then-pinned 2.16.0 supply and adapter passed focused
  renderer tests, but Archify is an interactive renderer, not a source,
  editor or acceptance owner. Its native five-view cap and GitHub-only
  repository link cannot directly express ETHOS's thirteen-page,
  mixed-revision Edition. Retain it as a selectable interactive backend,
  not a universal product. The effort to expose and qualify more controls
  is not yet measured.

### Product route comparison

- **Thin evidence wrapper:** It could bind a direct tool's bytes and
  provenance, but would leave questions, omissions, two-media composition
  and source-delta editing to each adopter. The present AIGW Client
  Projection has 517 Edition lines, 477 semantic lines and 621 materializer
  lines; self has 4,243 Edition MJS lines. These are measured incumbent
  surfaces, not proof that all lines are accidental. Wrapper implementation
  and maintenance hours are unmeasured. Stop as the universal authoring UX.
- **Publisher workbench:** Retain the single public Build
  Request/Provider/Edition/Candidate/qualification path as a candidate
  integration owner. Existing self composition and AIGW's 33 explicit
  route choices show that a neutral, readable first build without renderer
  code remains **unproved**. Task 5.2 must supply the failing adopter test
  before any general-workbench value claim. Successor implementation effort
  is an estimate; no hours or savings are manufactured here.

The narrowed ownership decision is:

1. Source products or their named editors own native model truth, claimants,
   questions, exclusions, narrative and flagship art direction. LikeC4 or
   Structurizr may remain their native authoring language; Publisher does not
   require a second editable model.
2. Publisher owns the receiving protocol, input lock, declared-loss adapter
   boundary, conservative obligations, Candidate and qualification binding.
   One selected adapter owns each native mapping; derived indices are
   disposable.
3. A selected mature engine owns layout or pixels only within its proven
   medium: LikeC4/D2/ELK/TALA for suitable graph layouts, resvg for selected
   SVG rasterization, Archify or LikeC4 for suitable interaction, and
   Playwright for browser observation. None becomes an intent or acceptance
   authority merely by rendering.
4. The selected source-product policy owns acceptance and release. Publisher
   may perform an explicitly authorized local file effect, not source Git or
   Forge publication by implication.

The focused Archify, static-raster and semantic-browser contract suite passed
80/80 locally on this source revision. That proves those bounded mechanisms,
not a four-workload installed successor or a human visual verdict. Direct
LikeC4 for di-effect is the cheapest observed path at its current scope; the
general Publisher successor remains conditional on Task 5.2 and final
replacement parity. If a later direct mature-tool route passes every hard
question and medium gate with lower total ownership cost, shrink Publisher
before building another custom compositor.

### Claim Model structural geometry probe (2026-09-25 UTC)

The current AIGW `architecture/edition-provider/_source/semantic.json` at
`04f593a43f6cac9f8ad56d26cde3839231e32054` has SHA-256
`1975b7af02b3e28268feb9b4ed7fab88caac6e7bb44df484a6f133275775dabd`:
12 entities, 11 relations, and 11 implemented-plane claims. Each claim names
one matching relation; six claims also have nonempty scope. A topology-only
layout therefore cannot discharge the claims' planes, scope, provenance, or
reader questions. Geometry remains a replaceable projection beside visible
typed claim expression, not a new Claim Model or source authority.

An isolated `/tmp` probe used exact npm versions and the same sorted 12/11
input, fixed left-to-right settings, and two consecutive runs. These are
single-machine feasibility observations, not quality or speed guarantees:

| Geometry candidate                                                   | Upstream package evidence      | Observed 12/11 result                                                             | Cost and limit                                                                                                                                                    |
| -------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Dagre 3.1.1](https://www.npmjs.com/package/@dagrejs/dagre/v/3.1.1)  | MIT; `@dagrejs/graphlib` 4.0.5 | 0 node overlaps, stable repeated geometry, 6.8 ms initial run                     | 1.41 MB unpacked package; a single esbuild 0.28.2 ESM supply was 48,343 bytes. Routed edges include diagonals; the raw diagram is not flagship art.               |
| [ELK JS 0.12.0](https://github.com/kieler/elkjs/releases/tag/0.12.0) | EPL-2.0 OR GPL-3.0-or-later    | 0 node overlaps, stable repeated geometry, 51.4 ms initial run; orthogonal routes | 8.05 MB unpacked package and a distribution-license decision; no reader-quality acceptance.                                                                       |
| [Viz.js 3.30.0](https://www.npmjs.com/package/@viz-js/viz/v/3.30.0)  | MIT package; Graphviz Wasm     | Stable repeated 12,505-byte SVG, 12.5 ms render; compact orthogonal topology      | 4.98 MB unpacked package; adopting its geometry requires a checked Graphviz-output adapter, while using its SVG directly needs source-ID and carrier-map control. |

The earlier Dagre preference omitted an existing Publisher-owned mechanism.
On the same exact AIGW Claim Model and its authored v1 Edition, the current
`composeStaticArchitectureScene` produced five groups, twelve placed nodes,
eleven routed relations, and a 1996×1640 geometric canvas without another
dependency or supply. This source-adjacent call proves neither a successor
Candidate nor visual acceptance. It changes the implementation order: first
extract a neutral grouped-geometry boundary reused by v1 and the successor;
only a named failure against real authoring or geometry may justify replacing
it with Dagre, ELK, or Viz.js. Do not ship parallel geometry owners. The larger
`@antv/layout` dependency graph and DAG-only `d3-dag` do not remove an observed
requirement here. External package sources were read via GitHub CLI and npm
metadata on 2026-09-25 UTC; license observations are not clearance.

A later unqualified local build selected all 11 relations and all 11 matching
claims for one AIGW overview question. Its 1800×3928 static PNG
(`81cebed49617df06d27570c1c12b91c06f925db4194ad3077116a60e63e12857`)
placed a small topology above eleven full-field claim cards while repeating
entity and relation records in a side column. It fails reader hierarchy and
space use despite preserving source text. The source model distinguishes
topology from implemented claims; their separate semantic identities do not
require two complete visual copies. This result disqualifies the present
field-dump composition, not Dagre geometry. Neither the temporary build nor
its HTML is a packaged or accepted product artifact. A second bounded grouping
and wide-layout attempt produced a 1800×4538 PNG and remained a text inventory;
its uncommitted code was discarded rather than extending the failed approach.

The probe also discarded existing editorial information. At the same AIGW
commit, the source-owned Edition
(`a26b1518d7e9a2ba3bc8bf37440ec9ee1e16fb1c039c61b696d08051de246c13`)
declares four reader questions, five ordered static groups covering the twelve
entities exactly once, eleven selected relations and claims, and four
interactive pages. The temporary successor input instead asked one question
and supplied no groups. It is a negative control for naive source import, not
a fair successor-versus-incumbent comparison. The next test must carry the
source-owned question, grouping, and selection intent into one Edition Project
or name a reviewed editorial change. Group labels remain editor-owned;
relation and claim identities remain distinct; old pixel coordinates need not
be copied.
