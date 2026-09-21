# Design

## Context

See `proposal.md` for motivation. The current repository already has strong
source-bundle, semantic comparison, independent static/interactive rendering,
ETHOS Edition, browser-evidence, file-publication, installed replay, and recovery
mechanisms. Alpha.7 validated those contracts. Its public self-host example,
however, models eight selected modules through one small generic authoring file;
it is evidence of self-use, not a complete product portrait or flagship Edition.

The implementation currently has one generic semantic core, one generic static
compositor, Archify as an embedded interactive backend, a substantial ETHOS
Edition, an AIGW adopter example, and a CLI named `architecture`. The accepted
Git history and alpha.7 releases must remain immutable. ETHOS owns repository
mutation and product intent for ETHOS; this product is a downstream publisher.

## Goals / Non-Goals

**Goals:**

- Establish one canonical Architecture Publisher identity and remove current
  parallel product/CLI identities after migration.
- Make source-bound Claim Model and Edition the stable public abstractions.
- Reorganize code so each semantic owner has one reason to change and specific
  Editions cannot leak into the generic kernel.
- Deliver a flagship self-Edition whose semantic and visual quality meets or
  exceeds the current ETHOS flagship reference.
- Keep static and interactive media semantically aligned but compositionally
  independent.
- Demonstrate conservative evolution and three first-party consumers.
- Qualify, package, install, recover, release, and deliver exact outputs.

**Non-Goals:**

- Inferring product intent automatically from source code.
- Replacing ETHOS, OpenSpec, Git, Archify, or other native owners.
- A hosted collaborative graphical editor, live synchronization service,
  marketplace, graph database, or universal aesthetic optimizer.
- Compatibility aliases for the old CLI, package, or product identity.
- Independent off-host disaster recovery before an operator supplies a
  destination and custody policy.

## Decisions

### 1. Product identity follows capability, not the first adopter

Use `Architecture Publisher` / `architecture-publisher` / `archpub`. Preserve
`ETHOS Architecture` only as the ETHOS Edition name. Rename the current GitLab
project and local accepted checkout after accepted closeout so all Git history,
tags, and worktree records move as one repository rather than being copied.

Alternatives rejected:

- Keep `ethos-architecture`: falsely makes ETHOS the product owner.
- Use `Semantic Atlas`: collides with existing products and describes only the
  interactive reading form.
- Use `Architecture Compiler`: omits authorship, verification, publication,
  readers, and recovery.
- Create a new repository: creates two mutable authorities and loses a clean
  history-preserving migration.

### 2. Claims, not diagrams or code symbols, are the semantic root

Introduce a closed v2 Claim Model in which every claim binds subject, predicate,
object or value, plane, condition, scope, maturity, provenance, and validity.
Entities and relations remain addressable structural objects, but claims own the
asserted meaning. The five planes prevent target design, code implementation,
runtime observation, governance constraints, and published statements from
collapsing into one truth.

A one-shot alpha.7-to-0.2 source migration is admitted only as an offline
conversion tool exercised during development. Current runtime readers accept the
new schema only; old alpha tags remain the historical reader for old inputs.

### 3. Edition is the product's aggregate and public unit

An Edition binds:

```text
identity + audience + questions + coverage + omissions + narrative
+ visual grammar + static scene + interactive scenes + obligations
```

The semantic model owns meaning. The Edition owns selection and communication.
Scenes own geometry. Renderers own byte production. Qualification owns scoped
judgment. Publication owns effects. No layer may silently absorb another.

Edition source is data where possible and narrow executable composition where a
flagship requires genuine authored geometry. Executable Edition code remains
first-party, package-bound, and unavailable to untrusted input. The Edition
contract belongs to the generic product; a concrete Edition implementation does
not. First-party Editions may share this repository for development and
conformance, but each is an independently installable downstream package.

### 4. Input, compilation, and output states are explicit

The generic product consumes four exact input values:

1. a `Source Bundle` containing selected evidence bytes and provenance;
2. a `Claim Model` bound to members of that bundle;
3. an `Edition` selecting audience, questions, coverage, omissions, narrative,
   independent scenes, and qualification obligations; and
4. a build request binding the exact source, Claim Model, Edition, and output
   location.

A repository, Git checkout, SDD tool, telemetry service, or domain-specific
schema is not a compiler input. A source adapter may convert such a source into
the standard values, but the adapter remains upstream and cannot invent intent
or grant publication authority.

The processing chain is:

```text
verify source -> validate claims -> resolve Edition coverage
-> compile independent scenes -> render exact artifacts
-> qualify exact subjects -> plan and authorize publication
-> apply, replace, or recover
```

The chain produces distinct values rather than one overloaded "publication":

- an `Edition Candidate` binds source, Claim Model, Edition, scenes, renderer
  supply, and emitted artifact identities, but carries no implied acceptance;
- a `Qualification Set` records non-compensating judgments and evidence over an
  exact candidate;
- a `Publication Plan` binds qualified bytes, destinations, authorization
  requirements, preservation, replacement, and recovery state; and
- an `Edition Publication` is the resulting reader delivery plus effect and
  recovery receipts.

Writing a candidate directory is not publication. A successful renderer is not
qualification. Qualification is not authorization. Application is not hosted
availability or release publication.

### 5. Static and interactive outputs are sibling compilers

Both media consume the same selected Claim Model and Edition coverage, but each
has an independent scene contract and compositor:

- Static optimizes one-frame causal comprehension, print-scale typography, and
  exact vector/raster geometry.
- Interactive optimizes complete first-screen comprehension, focus, trace,
  progressive disclosure, source inspection, and complete mechanism pages.

Neither medium is derived from the other. Shared code is limited to semantic
selection, identity, typography tokens, and renderer-neutral verification data.

### 6. Flagship quality is an admission class, not a visual preset

`structural` and `flagship` are Edition promises. Flagship acceptance is a
conjunction of semantic, coverage, geometry, browser, accessibility,
installed-use, recovery, and exact-artifact human review. Machine metrics reject
known defects; they never assign aesthetic approval.

Use a restrained light visual system for the first-party static flagship:
hierarchical type scale, limited neutral/green/ochre palette, one causal spine,
measured whitespace, and no generic card grid. The HTML atlas receives its own
responsive composition and may use focus and trace interaction without motion
that changes geometry or distracts from reading.

### 7. Conservative evolution uses explicit dependencies before caching

Compile exact before/after Claim Models plus Edition dependencies into separate
obligations: rebuild, semantic verification, medium verification, human review,
acceptance, and publication. Unknown or opaque dependencies broaden work. A
changed output invalidates its own prior qualification.

Do not add a persistent graph, general constraint solver, or incremental query
engine initially. First measure full-build cost over self, ETHOS, and AIGW. A
future mechanism must enter through a named public interface and prove lower
whole-life cost on an irreducible adopter case.

### 8. Generic kernel and source-owned Editions remain acyclic

Target dependency direction:

```text
source -> semantics -> edition -> scene
                          |          |
                          v          v
                    qualification  renderers
                          \          /
                           publication

source-owned Edition packages -> exported public contracts
conformance -> portable values or exact installed packages
cli -> generic composition root only
```

The generic kernel never imports an Edition. Renderers never import source
adapters. Adapters cannot grant semantic or publication authority. The generic
`archpub` CLI consumes only standard contract files and does not dispatch on an
Edition, repository, or adopter identity. Concrete Edition packages may produce
standard inputs and call exported public APIs; they are never required core
dependencies and do not register a second truth or command plane. Live adopter
Editions stay with their source product. Cross-repository conformance selects
portable standard values or exact installed packages and never imports an
adjacent checkout.

### 9. One repository, one Change, one lane, staged commits

The change is large but semantically coupled: identity affects every public
surface, the Claim Model shapes Editions, and flagship artifacts exercise the
new contracts. Splitting it into concurrent Changes would create temporary
parallel identities and incompatible schemas. Implement as one Change with
small verified commits and one final release closure.

## Target Physical Structure

```text
architecture-publisher/                 # private product and conformance workspace
├── packages/
│   ├── publisher/                      # published architecture-publisher core
│   │   ├── src/
│   │   │   ├── source/
│   │   │   ├── semantics/
│   │   │   ├── edition/
│   │   │   ├── scene/
│   │   │   │   ├── static/
│   │   │   │   └── interactive/
│   │   │   ├── compiler/
│   │   │   ├── rendering/
│   │   │   ├── qualification/
│   │   │   ├── publication/
│   │   │   └── cli/
│   │   └── renderers/
│   │       ├── svg/
│   │       ├── fonts/
│   │       ├── archify/
│   │       └── resvg/                  # each owns its exact bundled supply
├── editions/
│   └── self/                           # source-owned flagship self-Edition
├── conformance/
│   └── journeys/
│       └── self-host/                  # installed public-contract exercise
├── examples/
│   ├── greenfield/
│   └── brownfield/
├── migration/
│   ├── ethos/                          # temporary; removed by Task 6.1
│   └── aigw/                           # temporary; removed by Task 6.2
├── tests/                              # contract and installed-product proof
├── docs/
├── openspec/
└── package.json                        # private workspace only
```

The root is never a distributable product package. `packages/publisher` is the
only generic runtime authority. `editions/self` is a real downstream consumer
owned here because its source product is Architecture Publisher. ETHOS and AIGW
own their live adapters and Editions in their native repositories; this
repository retains only immutable protocol fixtures and exact conformance
receipts. Conformance consumes portable standard values or an independently
installed package, so no adjacent checkout, hard-coded user path, or repository
name becomes a runtime dependency.

Physical migration follows semantic ownership. There is no `core`, `common`,
`shared`, `utils`, compatibility, or legacy runtime directory. Vendored renderer
supply stays below the owning renderer and is verified as exact supply rather than
participating as another product surface. Existing modules move only where the
owner becomes materially clearer; a directory diagram alone is not a reason for
churn.

The current `migration/ethos` and `migration/aigw` paths are explicit migration
staging. The self package now lives at `editions/self`. Before release, ETHOS and
AIGW are recreated under their own repository-native module policies, exercised
as independently packed consumers, and then removed from this repository. The
migration compares the same immutable candidate digests or explicitly explains
any intended semantic change before deleting the central copy.

## Flagship Self-Edition

The self-Edition answers one root question:

> How does selected system meaning become a trustworthy, useful, and renewable
> Architecture Edition without becoming a new authority?

Its complete overview contains:

1. source authorities: accepted intent, implementation, runtime observations,
   and evidence;
2. loss-aware source adapters and exact source bundle;
3. typed Claim Model with planes, unknowns, and contradictions;
4. Edition: audience, questions, coverage, narrative, visual grammar;
5. independent static and interactive scenes;
6. rendering and painted-output observation;
7. conjunctive qualification, including bounded human review;
8. recoverable publication and installed readers;
9. self, ETHOS, and AIGW consumers;
10. feedback returning to each source owner through its native lifecycle.

The static poster uses a horizontal causal spine with source fields above,
medium-specific projections below, a qualification cross-section, consumer
outcomes at the right, and a restrained feedback return. The interactive atlas
uses a complete overview plus complete chapters for semantics, Edition,
composition, qualification, publication/recovery, adoption, and evolution.

## Qualification Model

Every result records:

```text
subject digest
Edition digest
source and semantic digests
verifier identity and implementation digest
predicate and scope
viewport or physical dimensions when applicable
observations
verdict and limitations
```

Required flagship predicates are:

- semantic validation and claim coverage;
- static and interactive cross-medium coverage;
- actual glyph, stroke, route, arrowhead, node, and canvas geometry;
- browser viewport, interaction, overflow, and console health;
- keyboard navigation, focus, contrast, reduced motion, and text scaling;
- installed offline build and reader use;
- replacement, interrupted-effect recovery, and exact replay;
- human `faithful`, `intelligible`, and `restrained` decision.

Static authoring closes only when its delivery-resolution candidate proves
semantic coverage, measured source geometry, emitted paths, actual raster
canvas bounds, paint presence for every declared glyph, node, stroke,
arrowhead, and rule, and absence of raster paint outside their declared
envelopes. These build-time checks are candidate evidence, not qualification
records. Task 5 promotes the applicable checks into independent,
digest-bound predicates, adds hostile fixtures and cross-medium observation,
and alone may support later acceptance.

The human decision applies only to exact bytes. Automated acceptance cannot set
it. User review of the final artifacts is the product's final aesthetic gate.

## Migration Plan

1. Commit this complete Change and preserve alpha.7 references.
2. Introduce product identity and public `archpub` command; delete the old
   command surface in the same semantic commit.
3. Add the Claim Model and Edition contracts with a one-shot fixture migration;
   migrate self, AIGW, and current semantic examples.
4. Reorganize generic owners and enforce dependency direction.
5. Build the Architecture Publisher first-party Edition and static scene under
   test, then generate and inspect the 6000-pixel candidate.
6. Move the self-Edition to its terminal source-owned root and consolidate each
   renderer's supply below that renderer without changing public semantics.
7. Build the independent interactive atlas and browser/accessibility checks.
8. Move the ETHOS and AIGW live Editions into their source repositories under
   native governance; prove independently installed parity, then remove the
   mutable central copies and retain only compact conformance fixtures.
9. Exercise exact semantic evolution across both media and all three consumers.
10. Run full source, package, installed, recovery, geometry, browser, and human
   acceptance; commit applicable evidence.
11. Prove and land the Work Lane, close accepted source, and archive the Change.
12. Rename the local repository and GitLab project with preflight, dry-run where
    available, exact remote/path readback, and no history copy.
13. Create signed `v0.2.0-alpha.0`, publish immutable assets, independently read
    back their bytes, and install the final PNG/HTML into Documents.
14. Retire the landed Work Lane and remove only classified disposable build
    residue. Keep alpha.7 releases and local predecessor archives unchanged.

Rollback before accepted closeout is ordinary Work Lane abandonment. After the
repository rename, rollback means renaming the same repository object back;
never create a replacement repository or rewrite history. A failed release is
not retagged: correct source and publish a later immutable prerelease.

## Risks / Trade-offs

- **Large semantic break** -> Keep one Change and one-shot migration; refuse
  runtime dual-schema support.
- **Flagship work dominates generic product design** -> Make Edition the owner of
  art direction and require AIGW plus self-use to exercise generic contracts.
- **Source-owned Editions create cross-repository coordination cost** -> Keep
  portable values and package identities as the only integration seam; do not
  introduce an adjacent-checkout runtime or copy source-repository task state.
- **Automated quality metrics produce false confidence** -> Treat them as hard
  defect gates and retain exact-artifact human acceptance.
- **Over-generalization introduces a graph database or solver too early** ->
  retain finite deterministic compilation until measured adopter evidence shows
  an irreducible need.
- **Repository rename breaks consumers** -> enumerate local and remote consumers,
  perform the rename only after source closeout, and verify exact paths/remotes.
- **Generated evidence inflates Git** -> track only source, compact durable
  qualification records, and release manifests; publish large reader artifacts
  as release assets and keep disposable build output ignored.
- **Long campaign makes evidence stale** -> bind every proof and review to exact
  digests; complete one semantic closure per commit and rerun only affected gates
  until the final whole-product matrix.
