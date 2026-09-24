# Design

## Context

See [proposal.md](proposal.md) for the reason for this change. The selected
baseline is the signed `v0.3.0-alpha.3` product line; this design does not amend
that tag, Architecture Publisher 0.2, or any earlier release byte.

The current public chain distinguishes Source Bundle, Claim Model, Edition,
Scene, Artifact, Qualification, and Publication. That separation is valuable,
but it does not justify preserving each custom implementation. In particular:

- `packages/publisher/src/compiler/edition.mjs` selects JetBrains Mono and a
  2400-pixel raster width; `renderers/archify/architecture.mjs` selects one
  editorial preset; `scene/interactive/architecture.mjs` uses fixed 170-pixel
  cells; and `edition/contract.mjs` rejects a group with more than eight
  entities. Those are implementation decisions, not universal architecture
  facts or source-owned Edition choices. The current `semantic-publication`
  specification also states a universal 6000-pixel PNG, so its scope and the
  generic 2400-pixel build must be reconciled rather than called equivalent.
- The generic build changes identities when `authoredInputSha256` changes but
  does not consume the corresponding authoring bytes. The existing Provider
  reference documents this limit; the successor must not leave a dependency
  name that appears to promise more than the builder proves.
- `docs/product-contract.md` is an exact self-Edition source and current tests
  bind it, the recovery decision contract, and migration documents. Document
  ownership correction therefore changes source and Candidate identities; it
  is not a path-only cleanup.
- ETHOS and AIGW already own their live Provider/Edition inputs. Their
  repository governance, authorization, artifact release, and future source
  edits remain outside this Work Lane.

Source inspection on 2026-09-24 covered exact tagged implementations of
[LikeC4 1.59.4](https://github.com/likec4/likec4/tree/33dbc2d34c399a99daf96e92fc28fe5d280a7fd5),
[Structurizr 2026.09.19](https://github.com/structurizr/structurizr/tree/f828a297dc693e08115b7e5b51dba4a83d8148c2),
[D2 0.9.0](https://github.com/d2lang/d2/tree/d5a51743b6d5c00f1ec6f8340003f5d5a6ba4eda),
and [Kroki 0.32.1](https://github.com/yuzutech/kroki/tree/99f285a0d50c3882e20dc449b63c5358aa889b83),
plus the pinned Archify supply. This was a source-level mechanism review, not
a passing upstream suite, a visual comparison, or proof of integration fit.

## Goals / Non-Goals

**Goals:**

- Keep only irreducible Publisher obligations in the product: preserving
  explicit source meaning and editorial selection, binding exact artifacts to
  predicate-specific evidence, and executing only authorized recoverable local
  effects.
- Replace accidental implementation complexity with qualified mature
  frameworks or standards wherever they satisfy the same consumer, semantic,
  offline, and recovery contracts at lower total ownership cost.
- Make regeneration after a source revision conservative and low-cost: selected
  views update deterministically, layout drift is observable, and no prior
  approval or omitted meaning is silently reused.
- Make current documents, public APIs, and physical code owners reflect the
  product's actual semantic boundary without creating a parallel authority.

**Non-Goals:**

- Preserve custom code, Archify, or the current directory tree merely because
  it exists; replace or delete an incumbent when the selected foundation wins.
- Declare LikeC4, D2, Structurizr, or any other framework an all-or-nothing
  competitor. Their mechanisms can be composed at distinct boundaries.
- Add a source-product intent store, repository lifecycle, diagram editor,
  plugin marketplace, hosted renderer service, or operator-wide DR control
  plane to Publisher.
- Execute independent off-host disaster recovery before the operator selects
  destination, custody, retention, encryption, and bounded credentials.
- Change ETHOS or AIGW files from the Publisher Work Lane.

## Decisions

### 1. One authority per fact, not one repository for every concern

| Concern                                                                | Authoritative owner                                  | Publisher responsibility                                                         |
| ---------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| Accepted product meaning and source revision                           | Source product                                       | Validate the selected Claim Model and disclose loss or uncertainty.              |
| Audience, questions, omissions, visual intention, authored media       | Source-owned Edition                                 | Compile selected values; never invent a claim or editorial decision.             |
| Modeling, view computation, layout, rendering, accessibility mechanics | Qualified framework or backend selected by Publisher | Own the integration contract, exact version, supply, and conformance.            |
| Candidate and predicate-specific observations                          | Publisher contracts and the relevant verifier        | Bind exact subjects, evidence, verifier, scope, and limits.                      |
| Acceptance, Git/forge release, artifact custody                        | Source product                                       | Emit non-authorizing outputs; never advance source refs or claim hosted release. |
| Local pair installation and interrupted-effect recovery                | Publisher                                            | Apply only an exact externally authorized plan.                                  |
| Independent off-host restore policy and credentials                    | Operator                                             | Supply a decision-ready contract for Publisher's own protected set only.         |

The cross-product Authority Matrix remains an interface boundary record in
Publisher, not a unilateral statement of another product's live state. ETHOS
may define portable managed-repository recovery obligations; each adopter owns
its release inventory; the operator owns actual off-host custody. Moving one
current DR file wholesale to ETHOS would conflate these three decisions.

### 2. Framework-first admission, with deletion of a displaced owner

For each mechanism, start with the best maintained standard, library, or
framework that fits the language and delivery environment. Compare repair,
direct adoption, partial adoption, interchange, and deletion against one frozen
consumer workload. Custom code is admissible only when a recorded
counterexample shows that qualified mature options lose required semantics,
trust, portability, artifact quality, or total lifecycle cost. Sunk effort and
current passing tests are not reasons to retain an incumbent.

The comparison uses three source-owned cases: Publisher self-use, ETHOS's
flagship and Lane semantics, and AIGW's materially different provider and
evolution. Every candidate must be checked on:

1. lossless mapping of identity, relation direction, plane, qualifiers,
   provenance, coverage, omissions, and unknown meaning;
2. source revision and view-update behavior, including removal, rename,
   contradiction, drift, and all-drop cases;
3. independent static and interactive compositions, complete overviews,
   deterministic output, reader quality, and accessibility;
4. offline installed use on supported hosts, exact dependency closure,
   package size, license, security and maintenance posture;
5. subject/verifier/authorization separation, output identities, recovery,
   rollback, and the cost of removing displaced code.

Hard semantic and trust constraints are non-compensating. A prettier diagram
cannot offset a lost claim; faster layout cannot offset an unbounded runtime.
Among candidates that pass the hard constraints, select the lowest measured
total cost, including migration, supply, tests, upgrade, repair, and eventual
exit. Retain one default owner per mechanism. A second engine is admitted only
for a distinct, named consumer and must not be a permanent fallback for an
unresolved default decision.

| Candidate                                                                                                                                                             | Source-observed useful mechanism                                                                                                                                                                                                              | Integration stance and required proof                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [LikeC4](https://github.com/likec4/likec4/blob/33dbc2d34c399a99daf96e92fc28fe5d280a7fd5/packages/core/src/compute-view/compute-view.ts)                               | A model API, computed element/deployment/dynamic views, and [layout reuse with current non-layout data](https://github.com/likec4/likec4/blob/33dbc2d34c399a99daf96e92fc28fe5d280a7fd5/packages/core/src/manual-layout/applyCachedLayout.ts). | **Primary direct-integration candidate** for model/view/layout and possibly interactive media. Test its published core, layouts, and diagram packages as actual dependencies. It may replace custom owners, including internal Claim Model processing, if a single derived representation preserves all public semantics; it is not restricted to a cosmetic adapter. Prove independent standalone HTML and static output before selecting its full rendering stack. |
| [Structurizr](https://github.com/structurizr/structurizr/blob/f828a297dc693e08115b7e5b51dba4a83d8148c2/structurizr-core/src/main/java/com/structurizr/Workspace.java) | Explicit model, views, and documentation in one Workspace.                                                                                                                                                                                    | Compare as a model/view foundation and interchange target. Test ontology fit, Java/runtime supply, and whether its [static export](https://github.com/structurizr/structurizr/blob/f828a297dc693e08115b7e5b51dba4a83d8148c2/structurizr-application/src/main/java/com/structurizr/command/StaticSiteExporter.java) preserves the selected reader content; do not assume C4 levels fit every subject.                                                                 |
| [D2](https://github.com/d2lang/d2/blob/d5a51743b6d5c00f1ec6f8340003f5d5a6ba4eda/d2lib/d2.go)                                                                          | Layout-engine selection, board/scenario/step composition, and bounded geometry reuse.                                                                                                                                                         | Compare direct renderer/layout adoption against LikeC4 and current Archify. A diagram script is derived view data, not source intent. Test portable supply and independent-media fidelity.                                                                                                                                                                                                                                                                           |
| Archify                                                                                                                                                               | Checked standalone HTML and geometry diagnostics in the currently pinned supply.                                                                                                                                                              | Retain as a real candidate, not a sacred dependency. Test its exact source closure and visual result against alternatives; retire displaced bundled code after parity.                                                                                                                                                                                                                                                                                               |
| [Kroki](https://github.com/yuzutech/kroki/blob/99f285a0d50c3882e20dc449b63c5358aa889b83/server/src/main/java/io/kroki/server/service/DiagramRegistry.java)            | Type/format conversion registry and cache.                                                                                                                                                                                                    | Consider its backend-admission pattern or an optional explicit delivery adapter. Do not require a resident service for offline core use without a named consumer.                                                                                                                                                                                                                                                                                                    |
| Published standards and libraries                                                                                                                                     | JSON Schema/Zod for structural validation, Playwright plus axe-core for browser accessibility, mature SVG/raster/layout packages, and in-toto/DSSE-style evidence exchange.                                                                   | Evaluate each at its exact responsibility. Preserve necessary cross-field semantic checks and authorization; a standard envelope never grants acceptance. Prefer replacing equivalent custom code to merely wrapping it.                                                                                                                                                                                                                                             |

The inspected npm metadata shows LikeC4's `@likec4/core` 1.59.4, layouts
1.59.4, and diagram 1.59.4 are separately published MIT packages; diagram
brings a substantial React/XYFlow dependency graph. These package manifests
are supply inputs, not proof of installed portability, bundle size, or reader
quality. `@resvg/resvg-js`, `@axe-core/playwright`, and `@viz-js/viz` are
separate maturity candidates, not preapproved dependencies. A queried
`@in-toto/attestation` npm package did not exist at the observed registry
endpoint; the standard must not be equated with that invented package name.

### 3. Preserve one source-bound semantic contract during internal replacement

The Edition Provider v1 remains the only materialization boundary and both
delivery modes continue to emit the same standard values. The public Source
Bundle, Claim Model v2, and Edition v1 remain selected contracts until a
versioned successor is proven and each consumer migrates. A mature engine may
replace internal storage, view computation, or rendering; its model is a
derived, disposable representation, never another editable product truth.

An adapter must report an exact mapping table from each required claim and
relation to the engine's elements, links, view predicates, and emitted carriers.
If the engine lacks a qualifier, explicit omission, unknown state, or source
binding, the adapter must fail or preserve it in a separately checked carrier;
it may not silently flatten the distinction. Rewriting all source products
into a vendor DSL merely to make the engine run is not adoption. Conversely,
if the mature model carries the complete semantics, remove the parallel custom
model-processing owner rather than maintaining two full model engines.

### 4. Regeneration is a declared selection plus visible drift

Extend the existing Edition/Scene contract rather than adding another editable
view registry. A source-owned Edition declares semantic selection and exclusions,
reader questions, media-specific composition constraints, and design grammar.
Publisher computes each selected view from the current exact Claim Model. New,
removed, or changed relevant claims trigger explicit coverage and view deltas.
Unknown dependencies broaden review; auto-layout may move geometry but cannot
approve changed meaning. Manual layout or authored geometry carries the exact
semantic and layout-affecting input identity; stale layout is diagnosed and
either recomputed under the selected engine or returned for author review.

Static and interactive media share meaning and coverage, not coordinates or
DOM. Both require complete overview scenes, while additional interactive pages
may expand complete mechanisms. Source-owned visual choices determine font,
palette, visual preset, spacing policy, and selected bounded output dimensions.
Generic compilation may provide a documented neutral default for a structural
Edition, but not a hidden ETHOS or Publisher house style. A structural output
must still pass declared readability and accessibility checks; flagship adds
its source-owned art direction and exact human review.

`authoredInputSha256` must cease to act as a rendering-dependency illusion.
For a scene whose authored bytes affect media, the build selects those bytes by
path and digest, the scene compiler consumes them, and the Candidate records
that consumption. If the value is only a non-rendering identity, rename and
document it as such in a versioned contract; it cannot satisfy media provenance
or visual acceptance. Existing consumers migrate by exact parity or an
explicitly reviewed semantic successor, not by an in-place reinterpretation.

### 5. Qualification and effects stay narrow while mechanics are reused

Use framework-native validators for their declared syntax/layout scope and
mature browser accessibility tools for their actual WCAG predicates. Keep
Publisher's distinct checks for source binding, coverage, semantic-carrier
equivalence, artifact identity, installed/offline behavior, and recovery. A
human visual decision remains bound to the exact artifact and viewport. A
machine pass cannot claim human approval; an attestation format cannot claim
independent execution merely because it is signed.

Publisher's `publish` operation remains a bounded filesystem plan/apply/recover
effect after caller authorization. It does not create Git commits, forge
Releases, or product acceptance. Self-Edition assets live in Publisher's own
release; ETHOS and AIGW choose versioned custody in their source-product
release systems. Generated PNG/SVG/HTML/Candidate bytes are not mutable source
truth. The off-host DR document can specify Publisher's own protected set and
restore acceptance, while operator selections and adopter-specific inventories
stay with their owners.

### 6. Physical structure follows a demonstrated semantic owner

Keep the current root as one private development workspace and one generic
published package unless a measured consumer requires further package splits.
The current `source`, `semantics`, `edition`, `scene`, `compiler`, `rendering`,
`qualification`, `publication`, and `provider` directories are candidate
owners, not a preservation rule. After selecting a mature foundation, replace
the corresponding custom owner and its tests in the same bounded migration;
do not retain facade imports, duplicate validators, or a second layout engine
for compatibility without a real external obligation.

Reduce public exports only after auditing and migrating self, ETHOS, and AIGW
consumers. Utility functions such as generic error, record, and path helpers
should not remain in source-domain exports merely because one Edition imports
them. The public API should expose deliberate product contracts and selected
backend capabilities, not implementation conveniences.

`docs/product-contract.md` should contain generic product meaning, authority,
inputs, outputs, and limits. Remove historical workline planning and
ETHOS-specific view requirements from that canonical file. Transfer SDD,
COMET, SpecD, AgentSpec, and related repository-governance findings to ETHOS's
existing research owner through its single writer; retain only Publisher-use
consequences and architecture-publication comparisons here. Retire stale
source-product migration status prose after the adopter's own record and
immutable handoff receipt are confirmed. Preserve Git history and source URLs;
do not copy an active policy into two repositories.

## Risks / Trade-offs

- **Vendor model loses qualifiers or explicit omissions** -> Run losslessness
  counterexamples before selecting it; reject that mapping or retain one narrow
  checked semantic layer rather than hiding loss.
- **A mature UI framework increases supply and maintenance cost** -> Measure the
  installed dependency closure, self-contained HTML, startup, memory, licenses,
  vulnerabilities, and native-host behavior; adopt only after hard predicates
  and total-cost comparison pass.
- **Art direction regresses under automatic layout** -> Keep independent
  source-owned media compositions and visual review. Let an engine solve
  geometry, not substitute for editorial judgment.
- **Two modeling or rendering authorities survive migration** -> Require
  incumbent deletion, consumer migration, and import/reference closure before
  declaring the replacement complete.
- **Document relocation changes accepted self-publication identity** -> Freeze
  the prior signed artifacts; bind the successor Candidate to changed source
  bytes and obtain fresh applicable qualification and human review.
- **External framework updates drift** -> Pin exact package versions and
  portable content identity, qualify upgrades independently, and preserve a
  rollback path without retaining mutable duplicate implementations.
- **Operator DR is mistaken for product recovery** -> Label independent
  off-host restore `unproved` until the selected failure domain, retention,
  encryption, credential, and clean-host rehearsal are real.

## Migration Plan

1. Freeze the exact accepted Publisher, self-Edition, ETHOS, and AIGW consumer
   identities. Classify every affected current path and artifact as authority,
   derived output, historical evidence, or disposable residue. Preserve all
   signed historical releases byte-for-byte.
2. Establish executable RED cases for the current authored-input gap, fixed
   style and dimension leakage, source revision/view drift, source-specific
   documentation claims, and an independent non-ETHOS Edition. Baseline current
   flagship static and interactive identities separately.
3. Run the framework-admission comparison on the frozen three-product workload.
   Publish the exact candidate versions, adapters, results, license/supply
   findings, rejected alternatives, and selected owners in the existing
   Change. The outcome may combine LikeC4 model/view computation, another
   qualified renderer, and standard validators; framework names are not
   mutually exclusive votes.
4. Implement only the selected replacement mechanisms behind versioned public
   contracts. Migrate the self-Edition first, delete displaced custom owners,
   and demonstrate semantic equivalence or an explicit reviewed successor.
   Source-product adapters remain owned by their separate Work Lanes.
5. Correct Publisher documents and tests at their semantic owner. Hand the SDD
   research to ETHOS's owner without a second active copy; scope Publisher DR
   to its own recovery while preserving the decision-ready off-host contract.
   Rebuild and qualify the self-Edition because its source bytes changed.
6. Qualify semantic, package, installed/offline, native-platform, browser,
   accessibility, recovery, human-review, and publication predicates against
   the exact final artifacts. Meet the repository's at-least-95% coverage
   floor. Publish a SemVer successor and changelog only after source-product
   custody and remote readback are independently accounted for.
7. Roll back by selecting the previous immutable release and its exact source
   and publication receipts. Do not rewrite a prior tag, relax authorization,
   or preserve a second current implementation as an indefinite fallback.

The implementation task breakdown and spec deltas follow review of this
design. This document is a proposed architecture, not evidence that a mature
framework has already been integrated or that any source-product migration or
off-host restore has completed.
