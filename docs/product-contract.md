---
subject: architecture-publisher:product-contract
role: policy
state: canonical
relations:
  canonical_for: product meaning, semantic roots, and authority boundaries
---

# Architecture Publisher product contract

## Product

Architecture Publisher turns explicit, source-bound system meaning into
understandable, verifiable, recoverable Architecture Editions for people and
Agents. It occupies the boundary between authoritative system knowledge and
reader-facing representations: it preserves semantic identity while allowing
static and interactive media to use different compositions.

The product does not discover truth by looking at code, screenshots, or tool
output. Source owners provide claims and provenance. Editions decide what a
particular audience must understand. Scenes express those decisions in a medium.
Renderers produce bytes. Qualification makes bounded judgments. Publication
performs explicit, recoverable effects. No downstream layer grants authority to
an upstream one.

## Promise

A published Edition answers three questions without conflation:

1. **What is asserted?** — exact claims, their plane, scope, condition,
   maturity, validity, provenance, unknowns, and contradictions.
2. **What must this reader understand?** — audience, questions, coverage,
   omissions, narrative, and reading order.
3. **What was actually delivered and checked?** — medium-specific artifacts,
   observations, qualifications, publication effects, and limits.

The promise is not automatic architecture inference or automatic beauty. It is
preserved meaning, explicit editorial judgment, independently composed media,
and evidence that names exactly what it establishes.

## Semantic roots

The seven product values are:

| Value           | Owns                                                                                                      | Does not own                        |
| --------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `Source Bundle` | Exact selected bytes, revision, location, and source authority                                            | Interpretation or acceptance        |
| `Claim Model`   | Typed meaning across intended, implemented, observed, governed, and published planes                      | Layout or permission                |
| `Edition`       | Audience, questions, required claims, omission policy, narrative, visual grammar, scenes, and obligations | Source truth                        |
| `Scene`         | Medium-specific hierarchy, geometry, routes, typography, and interaction                                  | Semantic identity                   |
| `Artifact`      | Exact emitted SVG, PNG, HTML, and supporting bytes                                                        | Its own qualification               |
| `Qualification` | Predicate-specific judgment over exact subjects, evidence, verifier, scope, and limits                    | General truth or reusable authority |
| `Publication`   | Authorized, recoverable installation of selected artifacts                                                | Rendering, intent, or acceptance    |

Claim Model is one admitted typed carrier, not a mandatory intermediate for
every native format. A native import index is a disposable source-bound
interpretation, not an eighth editable authority. Selected evidence precedes
checked meaning, Edition, Scene, and Artifact; Qualification binds exact
subjects across that chain, and Publication requires separate authorization.
Every durable value has one semantic owner. Derived views remain rebuildable.
A contradiction or unrepresentable meaning fails closed; it is not hidden by a
layout choice, compatibility alias, or optimistic inference.

## Inputs

The generic compiler consumes four explicit roles, not necessarily four
separately authored files:

1. **Selected source evidence** — exact native files or a Source Bundle with
   provenance, source identity, and revision.
2. **Semantic interpretation** — a checked native-format index, an attributed
   projection, or the historical Claim Model v2, bound to selected bytes with
   supported meaning and loss explicit. Native sources do not require a tracked
   duplicate Claim Model.
3. **Edition** — audience, reader questions, required claims, explicit
   omissions, narrative, visual grammar, independent scenes, and qualification
   obligations.
4. **Build Request** — selected source and Edition meaning, optional Providers,
   requested media, and toolchain. The successor build invocation selects its
   Candidate output directory separately; historical v1 plans retain their
   original output-field meaning.

An Edition Provider is an optional source-owned transport boundary before the
compiler. A declarative Provider selects portable standard values; an executable
Provider materializes the same values through one independently installed,
bounded child-process export. Both converge before semantic compilation. The
Provider does not interpret claims, compose scenes, qualify artifacts, authorize
effects, or own publication.

In the unreleased successor Edition Project, a source selection's question
list is the sole authored source-assertion record; its assertion ID is derived
from the selection ID. A questionless selection can support an attributed
editorial assertion but has no source-visible obligation of its own. Ordered
medium views own page order, and each view owns its question order. This
authoring subtraction does not alter historical Edition v1 contracts or merge
source truth with editorial judgment.

The initial successor authoring contract accepts exact references, not a
query or transformation field without an implemented consumer. Such fields
fail validation rather than promising a Candidate that cannot be built.
Editorial assertions preserve their proponent and basis without becoming
source-approved transformations.

A Git repository, SDD tool, documentation service, code graph, telemetry store,
or project-specific schema is a possible upstream source, not a hidden compiler
dependency. Its adapter emits an admitted source-bound interpretation or
attributed projection with loss, uncertainty, and provenance explicit; it need
not duplicate the source as a Claim Model. Manual authoring of admitted standard
values is also valid.

## Processing

```text
verify selected evidence
-> validate source-bound meaning
-> resolve Edition coverage and omissions
-> compile independent static and interactive scenes
-> render exact artifacts
-> qualify each exact subject
-> plan and authorize publication
-> apply, replace, or recover
```

Each arrow crosses a narrow contract. Adapters cannot grant source authority;
Editions cannot change claims; scenes cannot change meaning; renderers cannot
add product claims; qualification cannot manufacture human acceptance; and
publication cannot infer intent.

## Outputs

The output is not merely a PNG or HTML file and not every generated directory is
a publication. The product distinguishes:

- **Edition Candidate** — exact source, Claim Model, Edition, scene, renderer,
  and artifact identities; it is rendered but not thereby qualified.
- **Qualification Set** — non-compensating semantic, coverage, geometry,
  browser, accessibility, installed-use, recovery, and human-review judgments
  over exact subjects.
- **Publication Plan** — selected qualified bytes, destinations, authorization,
  preservation, replacement, and recovery state without performing the effect.
- **Edition Publication** — reader artifacts plus exact build, qualification,
  publication, and recovery identities after the authorized effect.

Reader-facing artifacts normally include an independent static SVG/PNG and a
standalone interactive HTML atlas. Their manifest and receipts explain what the
bytes mean, where they came from, which checks passed, which limits remain, and
which effect occurred. Installation, hosted availability, and release are
separate claims.

## Product identity

The product is **Architecture Publisher**. The package is
`architecture-publisher`; the public command is `archpub`; the canonical
repository is `architecture-publisher`. ETHOS, AIGW, and the product itself are
Editions or adopters. `ETHOS Architecture` names the ETHOS publication, never
the publishing product.

Historical releases retain the identities under which they were published. The
current runtime does not retain aliases or a second mutable product identity.

## Product boundary

Architecture Publisher is downstream of source truth and upstream of reader
artifacts.

- ETHOS owns governed repository evolution, authority, lanes, proof, CAS effects,
  and Attestations.
- OpenSpec and other SDD carriers own accepted intent in their source domains.
- Git owns object identity, history, refs, and repository-local CAS.
- Code graphs and telemetry supply observations, never product intent.
- Skills supply replaceable methods, never lifecycle or acceptance authority.
- Archify, SVG, rasterizers, and browsers are rendering or observation backends.

Architecture Publisher may reject, explain, project, qualify, install, replace,
and recover an Edition. It may not authorize a source-system transition or
silently write feedback into a source authority.

The Architecture Publisher repository is a development and conformance
workspace. Its distributable product contains generic contracts, renderer
capabilities, qualification, publication, and the `archpub` composition root.
It also owns the source-owned live Edition for Architecture Publisher itself,
because that Edition describes this source product.

A live adopter Edition belongs to the repository whose architecture it states.
ETHOS owns its adapter, Claim Model authoring, Edition, native authorization,
and release decision; AIGW owns the corresponding AIGW values. The Publisher
repository may keep compact immutable protocol fixtures and exact conformance
receipts, but it may not retain a second mutable implementation of an adopter's
Edition. During the 0.2 migration, existing central extension packages are
migration staging only and are removed after source-owned installed parity is
proved.

Cross-repository use occurs through one `architecture.edition-provider/v1`
manifest selecting portable standard values or an independently installed
package by exact identity. Both modes enter through `archpub edition build`;
there is no Provider command tree, registry, or ambient discovery. Ordinary
execution has no adjacent checkout dependency, repository-name dispatch,
local-user path, or implicit source discovery. The source repository's native
lifecycle authorizes its own changes; Publisher qualification and release
consume exact outputs without copying that lifecycle or its progress ledger.

Candidate and publication provenance keep `subject`, `producer`,
`authorizationOwner`, and `custodian` distinct. Provider conformance does not
grant acceptance, publication, independent verification, or source-product
authority.

## Construction discipline

The implementation follows the causal dependency direction:

```text
source -> semantics -> edition -> scene -> renderer -> qualification -> publication
```

Adapters point inward to public contracts. Editions depend on public contracts
and selected renderers. Generic modules never import a concrete Edition.
Renderers never infer semantic truth. The CLI is a composition root, not a
domain owner.

Abstractions must reduce the number of concepts a consumer needs to understand.
No `core`, `common`, `shared`, `utils`, `legacy`, or compatibility owner is
created without a demonstrated, independently testable responsibility.

## Media

Static and interactive publications are sibling projections. They share source
and Claim identities but not coordinates, DOM, page shape, layout constraints,
or acceptance evidence.

- Static composition optimizes one-frame causal comprehension, stable print-scale
  typography, vector geometry, and high-resolution raster delivery.
- Interactive composition optimizes a complete first-screen overview, focus,
  trace, source inspection, progressive disclosure, and complete mechanism views.

Neither medium is generated by capturing or serializing the other.

## Quality

`faithful`, `intelligible`, and `restrained` are non-compensating gates.

- **Faithful**: visible claims are source-bound; planes and uncertainty are not
  collapsed; required meaning is covered; limits are explicit.
- **Intelligible**: purpose and causal spine are immediate; hierarchy, grouping,
  routes, and detail views answer named reader questions.
- **Restrained**: proportion, typography, whitespace, rhythm, color, and motion
  support meaning without decorative noise.

Machine checks reject known semantic, geometry, browser, accessibility,
installation, and recovery defects. Human review judges perceptual hierarchy and
character for an exact artifact digest. Neither substitutes for the other.

## Evolution

An exact semantic change produces conservative obligations:

```text
source delta
-> affected claims
-> affected Editions and scenes
-> rebuild
-> semantic and medium verification
-> human review when required
-> explicit acceptance
-> publication
```

Unknown dependencies broaden review. Changed artifact bytes invalidate their
prior qualification. Generated artifacts are never authoring inputs. Persistent
graph storage, incremental query runtimes, and general constraint solvers remain
out until a named adopter proves an irreducible need and lower ownership cost.

## Product modes

- A **structural Edition** promises deterministic source binding, declared
  coverage, and technical readability.
- A **flagship Edition** additionally promises deliberate art direction,
  reader-tested hierarchy, accessibility, and exact-artifact human acceptance.

The minimal structural examples remain useful protocol demonstrations. They are
not the public self-portrait and must not be presented as flagship work.

## Completion

A release is complete only when exact source, package, static and interactive
artifacts, qualification, installed replay, recoverable publication, signed tag,
remote readback, and declared human acceptance are independently accounted for.
Local existence, a clean tree, a green test suite, or a package upload proves
only its own boundary.

## Program boundaries

The five worklines retain distinct purposes; product phases below belong to E.
This map defines responsibility, not a second progress ledger.

| Workline                    | Owner and outcome                                                                                               | Boundary                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| A: accepted delivery        | Preserve qualified artwork, releases and reader installation                                                    | Do not redraw unchanged meaning or rewrite released evidence |
| B: tool availability        | Bounded browser, authentication and runtime diagnosis                                                           | A usable supported path is not a universal upstream repair   |
| C: ETHOS product            | Existing ETHOS contract and building task: intent, norms, adoption, lanes, execution, verification and feedback | The publisher cannot own ETHOS intent compilation or effects |
| D: mechanism research       | Source-level evidence and counterexamples informing C and E                                                     | Adopt only with explicit cost and ownership benefit          |
| E: architecture publication | This product: source meaning, authorship, composition, verification and recoverable evolution                   | One ETHOS edition does not prove arbitrary-domain capability |

E progresses through bounded semantic compilation, explicit authorship and
composition, a real independent adopter, broader domain qualification, then
demand-led ecosystem interfaces. Research covers intent, code semantics,
incremental execution, formal constraints, repository adoption and publication.
GitLab projection and independently recoverable off-host backup require separate
failure-domain evidence.

## Authority Matrix

"Source product" means Architecture Publisher for its self-Edition, ETHOS for
ETHOS, and AIGW for AIGW. The same repository may hold both a source-owned
Edition and Publisher's generic code, but that co-location never transfers one
role's authority to another. This is the current matrix; archived proposal
matrices remain historical evidence, not a second active rule.

Source → semantic validation → authored views → constrained composition →
medium-specific rendering → artifact observations → authorized publication.

| Concern                            | Authority                   | Other role                                                         | Not implied                                                             |
| ---------------------------------- | --------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Accepted meaning and claim content | Source product              | Adapter maps provenance/loss; Publisher owns and validates schema  | Observation or rendering cannot invent intent.                          |
| Edition and flagship composition   | Source-owned Edition        | Provider materializes values; Publisher supplies public primitives | Authoring digest alone is not media proof.                              |
| Provider transport                 | Publisher contract          | Source product selects exact data or package                       | No acceptance or repository effect.                                     |
| Generic Scene, render, Candidate   | Publisher                   | Edition supplies authored inputs                                   | Structural output cannot inherit flagship approval.                     |
| Predicate observations             | Predicate-specific verifier | Publisher binds exact Qualification Set                            | Technical pass is not human acceptance.                                 |
| Human acceptance and Git           | Source-product governance   | ETHOS may govern; Skills remain methods                            | Publisher core inherits no source Work Lane, CAS, or release authority. |
| File publication and recovery      | Publisher effect contract   | Source product authorizes exact target                             | A file effect cannot infer intent or authorization.                     |
| Release subject and custody        | Source product              | Publisher records producer; selected store holds bytes             | Generated output need not enter source Git.                             |
| Feedback to intent                 | Source product              | Publisher proposes a source-bound finding                          | No silent writeback.                                                    |

These are modules and data contracts, not services, a graph database, an event
bus or another governance kernel. Source adapters, backends and skills remain
replaceable behind explicit interfaces. Ordinary installed use does not require
Git, OpenSpec, ETHOS, a neighboring checkout, personal HOME or agent credentials.
Explicit source replay and development governance have separate prerequisites.

## Meaning before representation

Assertions retain subject, relation, object, direction, condition, quantifier,
scope, maturity, provenance and permitted aggregation. Every required assertion
needs a readable carrier; every visible claim needs a source. Counts and labels
alone do not establish equivalence. Code reachability cannot establish intended
architecture or deployed behavior.

ETHOS views must preserve intent alignment/compilation, greenfield and brownfield,
repository quality, concurrent cooperative or competing lanes, experiments and
reasoned abandonment, object-scoped CAS, accepted integration, verification,
attestation, runtime admission and continuity. Skills supply execution methods;
they are not a second authority. OpenSpec and Git are selected concrete carriers,
not proof that arbitrary SDD/VCS replacements are lossless. Terminal design must
not be presented as fully implemented behavior.

Static and interactive editions share semantic identities, not coordinates.
The overview remains a complete intelligible system map. Detail pages each
contain a complete mechanism view rather than disconnected fragments. Thirteen
pages describe the accepted ETHOS edition, not a universal cardinality.

## Minimum independent product

An installed CLI accepts explicit file input, typed diagrams and authored SVG;
it renders, verifies identities, packages selected files and installs/replays
an authorized pair through public commands. Non-ETHOS use must survive removal
of ETHOS edition/integration modules. Raw file publication establishes integrity
and controlled filesystem effects only; qualified ETHOS publication additionally
requires its own applicable semantic, visual and browser evidence.

Dependencies must be declared, pinned and independently obtainable. Paths in
portable inputs are explicit and relative to their owning descriptor; installation
plans deliberately bind exact resolved targets. Never search sibling repositories
or borrow developer credentials. Source execution is opt-in and identity-bound.
Font redistribution requires its license; unchanged backend licenses stay bundled.

Demonstrate topology and conditional lifecycle examples, real membership/edge
updates, both media, relocation, empty HOME/PATH, offline installed use and explicit
temporary deployment/recovery. These bounded examples do not prove arbitrary
domains, universal platform support, automatic composition or browser acceptance.
The public paired installer retains two named slots and a shared-parent constraint;
arbitrary target cardinality is not an implied capability.

## Quality: faithful, intelligible, restrained

Semantic fidelity, complete required mechanisms, readable typography, no unintended
overlap/clipping, correct connected endpoints and truthful scope are hard gates.
No weighted aesthetic score can compensate for their failure. Among feasible
candidates, optimize hierarchy, alignment, reading flow, balanced canvas use,
spacing and routing burden. Measure actual glyph envelopes and stroke/arrow
geometry; generator bounding boxes alone are insufficient.

Use restrained color, contrast, scale and intentional negative space. Irregular
shapes and decorative curves are not evidence of elegance. Philosophical intent
belongs in coherent architecture and composition, not meaningless labels. Visible
copy is English except the ETHOS name 问道 and an explicitly selected source poem.
Do not add version badges, debug counters, diff counts or vendor plate labels.

Geometry, source coverage, painted browser output, interaction, human visual
acceptance, installation and hosted delivery are separate evidence scopes. New
HTML bytes cannot inherit old browser approval. Inspection does not manufacture
authorization; a passing parser is not an observed execution.

## Sustainable regeneration

The accepted edition is frozen; recovery must reproduce it exactly. A new candidate
must be allowed to produce new bytes without first matching old output hashes.
Stable semantic identities survive harmless label changes; split/merge/rename
mappings require explicit source evidence, never guessed identity substitution.

1. Keep explicit candidate inputs separate from accepted-output locks in the same renderer.
2. Demonstrate one real ETHOS semantic update across source, views, both media,
   qualification and candidate publication without changing generic code or
   editing generated SVG/HTML.
3. Exercise label growth, entity/edge insertion/removal, changed condition and
   direction, density growth, contradictions and unsupported relations. Reject
   unsupported meaning precisely while preserving the prior release.
4. Maintain conservative assertion-to-view-to-output dependencies. Unknown
   dependencies broaden verification, not optimistic cache reuse. Rebuild,
   recheck and reapprove are separate decisions.
5. Measure edited inputs, manual repositioning, rebuilt views, repeated checks
   and update time before adding incremental execution or speculative tooling.

Preserve reader mental maps with soft relative anchors; do not freeze coordinates
when meaning changes. Layout infeasibility must trigger explicit regrouping or
detail views, not silent omission or unreadable type. A new visual grammar may
require a bounded adapter; effortless arbitrary redesign is not promised.

Candidate preparation binds explicit authored text sites and complete-value
source identities. Checked preimages prevent stale edits, and a complete page
permutation preserves the atlas while allowing explicit reading order. The
refresh example uses this same contract. Unsupported topology requires a future
bounded composition change, not guessed identity substitution. A source-manifest
change rebinds the Edition, invalidates acceptance and publication, and requires
fresh semantic plus installed-use verification. It does not by itself imply that
scene geometry changed; changed or unrepresented meaning determines the affected
scenes. Automatic aesthetic optimization is not established by this increment.

The shared semantic compiler admits one v2 Claim Model: a finite typed
vocabulary, complete JSON qualifiers, byte-bound provenance, explicit planes,
conditions, scope, maturity and validity, plus opaque claims whose dependency
coverage remains unknown. The ETHOS adapter preserves source extensions and
invokes this one comparison owner. It does not add a second diff engine, accept
the retired v1 document at runtime or infer semantic equivalence.

Claim Model comparison reports meaning change only. Edition evolution then uses
the complete before/after Editions as the sole scene-dependency authority. It
propagates changed meaning through required claims, explicit omissions, static
composition and interactive scenes, broadening work when coverage is unknown or
meaning is unrepresented. Its result keeps `rebuild`, `semanticVerification`,
`mediumVerification`, `humanReview`, `acceptance`, and `publication` as six
separate obligations. Compilation executes none of them. Explicit rename,
split, and merge records lineage, not equivalence or inherited proof.

## Replacement is not replay

Recovery resumes its exact operation; a different edition requires an explicit
replacement selection. The same installer derives ownership from the prior plan,
not its broad preserved-file inventory. Replacement binds actual managed preimages,
preserves unknown files, refuses modified/missing owned files and retains bounded
rollback material through the existing journal and local rename boundaries.
Verify successive editions, no-op updates, dropped managed files, foreign edits,
interruption at either target and recovery. Never disable collision protection
or delete a destination to make an upgrade pass.

## Publication, storage and completion

Git holds source, small authored inputs, specs and locks. Releases link exact
reader assets. Qualification packages hold required scoped evidence; renderer
source has its own reproducibility boundary. Reuse unchanged packages, not one
package per operation. Predecessor history remains local, not a permanent remote
dependency. Remove only classified disposable work after checking consumers.

Source acceptance, main promotion, signed tags, Release entries, downloaded bytes,
clean-source restoration, actual installation and lane retirement are distinct
completion boundaries. A source push or package upload proves none of the rest.

The complete graphical editor, live synchronization service, plugin marketplace,
universal semantic compiler and automatic aesthetic optimizer remain outside
Workline A. Current implementation limits are stated in README; these aspirations
must neither be advertised as implemented nor indefinitely delay fixed delivery.
