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

| Value | Owns | Does not own |
| --- | --- | --- |
| `Source Bundle` | Exact selected bytes, revision, location, and source authority | Interpretation or acceptance |
| `Claim Model` | Typed meaning across intended, implemented, observed, governed, and published planes | Layout or permission |
| `Edition` | Audience, questions, required claims, omission policy, narrative, visual grammar, scenes, and obligations | Source truth |
| `Scene` | Medium-specific hierarchy, geometry, routes, typography, and interaction | Semantic identity |
| `Artifact` | Exact emitted SVG, PNG, HTML, and supporting bytes | Its own qualification |
| `Qualification` | Predicate-specific judgment over exact subjects, evidence, verifier, scope, and limits | General truth or reusable authority |
| `Publication` | Authorized, recoverable installation of selected artifacts | Rendering, intent, or acceptance |

```text
Source Bundle -> Claim Model -> Edition -> Scene -> Artifact
                                      \          /
                                       Qualification
                                             |
                                        Publication
```

Every durable value has one semantic owner. Derived views remain rebuildable.
A contradiction or unrepresentable meaning fails closed; it is not hidden by a
layout choice, compatibility alias, or optimistic inference.

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

| Workline | Owner and outcome | Boundary |
| --- | --- | --- |
| A: accepted delivery | Preserve qualified artwork, releases and reader installation | Do not redraw unchanged meaning or rewrite released evidence |
| B: tool availability | Bounded browser, authentication and runtime diagnosis | A usable supported path is not a universal upstream repair |
| C: ETHOS product | Existing ETHOS contract and building task: intent, norms, adoption, lanes, execution, verification and feedback | The publisher cannot own ETHOS intent compilation or effects |
| D: mechanism research | Source-level evidence and counterexamples informing C and E | Adopt only with explicit cost and ownership benefit |
| E: architecture publication | This product: source meaning, authorship, composition, verification and recoverable evolution | One ETHOS edition does not prove arbitrary-domain capability |

E progresses through bounded semantic compilation, explicit authorship and
composition, a real independent adopter, broader domain qualification, then
demand-led ecosystem interfaces. Research covers intent, code semantics,
incremental execution, formal constraints, repository adoption and publication.
GitLab projection and independently recoverable off-host backup require separate
failure-domain evidence.

## One chain, distinct owners

Explicit source → semantic validation → authored views → constrained composition
→ medium-specific rendering → artifact observations → authorized publication.

| Owner | Responsibility | Does not own |
| --- | --- | --- |
| Source project | Entities, relations, conditions, quantifiers, scope, maturity, obligations | Publisher geometry or cached approval |
| Source adapter | Explicit, loss-aware mapping and provenance | Invented intent or automatic execution of untrusted source |
| Authoring | View purpose, grouping, selection, reading order and visual constraints | Changed product meaning |
| Rendering | Typography, routes, layout and static/interactive expression | Source authority or publication approval |
| Verification | Scoped checks against actual selected inputs and outputs | Human acceptance or unsupported universal correctness |
| Publication | Exact file plans, preservation and recoverable effects | Rendering, semantic inference or implicit target authorization |

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
bounded composition change, not guessed identity substitution. Source-document
changes conservatively require all-view review; selective execution and automatic
aesthetic optimization are not established by this increment.

The shared semantic compiler admits a finite typed vocabulary, complete JSON
qualifiers, byte-bound provenance, explicit propositions and opaque assertions.
Opaque prose retains unknown dependency coverage, never inferred formal meaning.
The ETHOS adapter preserves source extensions and invokes this one comparison
owner. It does not add a second diff engine or infer semantic equivalence.
Change propagates over both source versions and explicit view dependencies;
unknown coverage or unrepresented change broadens obligations. The output lists
rebuild, verification and review separately without executing or approving them.
Explicit rename/split/merge records lineage, not equivalence or inherited proof.

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
