# Design

## Status and evidence boundary

This design was approved on 2026-09-24 as the baseline for revising the same
Change's proposal and delta specifications. The revised written specifications
were approved on 2026-09-24; that approval permits task planning, not
implementation or release. The former task list remains superseded until the
reviewed implementation plan replaces it in this Change.

The selected historical baseline is the signed `v0.3.0-alpha.3` product line.
No predecessor tag, Architecture Publisher 0.2 release, or signed artifact is
rewritten. The read-only cases used to challenge this design are Publisher
`8e758ec`, ETHOS `87bbb0d68`, AIGW `3318c819`, and di-effect `8a168b6b9`.
The di-effect checkout had an unrelated dirty `.serena/project.yml`; this
review did not modify it.

The observed pressure is specific:

- AIGW's current Client Projection is a limited Edition, not a whole-product
  architecture. Its selected model has 12 entities and 11 relations; its
  source-side materializer and Edition are 621 and 517 lines. Line count is
  not a quality score, but source-side authoring cost is a product acceptance
  measure, not an adopter problem to ignore.
- At the observed AIGW HEAD, all 14 selected source-member hashes still match
  the live files. Its v1 Provider revision is a reproducible SHA-256 of its
  canonical semantic model, not a Git commit. The v1 protocol's untyped
  `revision` string permitted an investigative Git lookup to be mistaken for a
  provenance failure; revision kind and verifier must be explicit.
- ETHOS's selected terminal graph has 113 nodes and 164 edges. Its view profile
  declares 24 aggregates, explicit forbidden aggregation pairs, and rules
  that hidden IDs or metadata do not earn visible semantic coverage. A complete
  reader view need not draw every raw node, and a total ID mapping is not proof
  that an abstraction says the right thing.
- di-effect already owns three LikeC4 files totalling 102 lines. On installed
  LikeC4 1.59.4, a copy of those files validated and exported a computed model
  with 25 elements, 35 relations, and four views. Each computed view edge
  carried source-model relation IDs within that build. Yet the three authored
  `include *` views and generated index each contained the same 25 nodes and
  35 edges, so native export alone did not perform reader-specific editing.
  An exact copy of the same DSL at another workspace path changed all 35
  generated relation IDs;
  adding one relation within the same path changed three pre-existing IDs.
  Those are bounded local probes, not a full upstream conformance verdict.
  LikeC4's
  [`EdgeModel.relationships()`](https://github.com/likec4/likec4/blob/33dbc2d34c399a99daf96e92fc28fe5d280a7fd5/packages/core/src/model/view/EdgeModel.ts)
  confirms within-build relation links;
  the inspected JSON export did not provide per-relation source paths.
- Direct LikeC4 export of the AIGW subset preserved useful model/view
  machinery but the default blue-box publication was visually rejected.
  Replacing a custom renderer with a framework default does not satisfy the
  product's reader-quality promise.
- A second isolated LikeC4 1.59.4 probe at AIGW `ea9b600b957f` authored four
  question-specific views over the 12/11 Client Projection subset. All five
  exported PNGs were byte-identical over two runs. A single-file HTML opened
  offline without external requests or page errors, but the two HTML builds
  differed in embedded Draw.io export data, so whole-file determinism was not
  established. The visible page did not show the relation `plane` metadata or
  semantic IDs. The automatic index duplicated the authored overview, and its
  generic layout, palette, branding, and whitespace were not a qualified
  publication. This proves useful native view and offline delivery mechanisms,
  not sufficient visible provenance or flagship quality.

These observations and their source-level comparators are recorded in
`docs/research/mechanism-evaluation.md`. The new probe can be repeated by
copying di-effect's three `tools/likec4/models/*.c4` files to an isolated
workspace and using `likec4 validate --json` and
`likec4 export json --skip-layout`; it does not require modifying di-effect.

## Product job and non-negotiable invariants

Architecture Publisher is a native-model-first architecture editing and
publication tool. It helps an editor turn attributable system knowledge into
clear, professional static and interactive works and maintain those works at
low cost as sources change. Its irreducible value is the combination of
reader-oriented abstraction, medium-specific composition, visible traceability,
scoped quality evidence, and regeneration. It is not a repository governor, a
truth oracle, a general ontology, a traffic service, or merely a diagram
converter.

An architecture publication is necessarily selective. The correct invariant is
not that every domain detail appears in every image. It is that every visible
assertion has an identified claimant and evidence basis; each promised reader
question has explicit coverage or an explicit limit; and a lossy abstraction
never masquerades as semantic equivalence. Source bytes can be acquired and
bound exactly while their interpretation remains contested or unknown.

The following constraints are non-compensating:

1. No downstream artifact, model adapter, rendered line, test result, or file
   location grants authority over source facts or product acceptance.
2. No editable duplicate of an adopter's native model is required merely to
   satisfy Publisher's internal representation. Derived indices and scenes are
   disposable.
3. A mapping from source IDs to graphic carriers proves traceability only.
   Domain validity, editorial adequacy, and actual visible expression are
   distinct predicates.
4. Static and interactive media share selected meaning and claim identities,
   not coordinates, DOM, screenshots, or approvals.
5. A normal maintainer must be able to obtain a readable, complete-for-its-
   question baseline without writing a renderer, duplicating the model, or
   specifying pixel geometry. Flagship art direction may require refinement.
6. Ordinary build and preview do not require ETHOS, Git, network access,
   hosted services, local installation, or source-product release authority.
7. The same public path must build Publisher's self-Edition and unrelated
   adopters. A hidden self-only renderer is not evidence of generic ability.

## Alternatives and selection

| Approach                                                   | Advantage                                                                      | Disqualifying limit or condition                                                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use a mature architecture platform directly                | Lowest cost when its native views and output already satisfy the reader        | It may not bind mixed sources, editorial claims, independent media, or evolution obligations; Publisher should not interpose without added value. |
| Thin evidence wrapper around a diagram tool                | Small implementation and strong artifact binding                               | Leaves abstraction, geometry, two-media editing, and updates to the adopter; useful as a component, insufficient as the target product.           |
| Universal architecture ontology and automatic art director | Attractive single input story                                                  | Conflates distinct domain relations, makes false equivalence claims, and creates unbounded implementation and maintenance cost. Rejected.         |
| Native-model-first editorial workbench                     | Separates source truth from editor and compiler work; can reuse mature engines | Recommended only if four real workloads prove lower authoring and update cost without semantic or visual regression.                              |

The recommendation is conditional, not protection of sunk effort. If a mature
platform plus a thin adapter passes the exact ETHOS, full AIGW, di-effect, and
self-use acceptance cases with less total ownership cost, reduce Publisher to
that adapter or discontinue the custom core. A custom mechanism must have a
named failing mature alternative and a narrower ownership cost.

## Authority by role, not repository

One actor or repository may hold several roles; co-location does not merge
their authority. For an Edition spanning multiple products, none of its source
repositories silently becomes editor, accepter, or custodian for the others.

| Concern                                                        | Authority or accountable role                                      | Publisher can establish                                                             | Publisher cannot infer                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Native model, domain schema, and source claim                  | Source or format owner; a claimant is named per assertion          | Exact selected bytes, format/version, reference and declared claimant               | That a maintained statement is implemented or true            |
| Import mapping and supported constructs                        | Adapter owner, with source review when official                    | Adapter identity, recognized constructs, structural preservation, reported loss     | Domain equivalence from an opaque extension                   |
| Reader question, scope, abstraction, narrative, art direction  | Edition editor                                                     | Selection consistency, trace and declared transformation checks; editing assistance | Editorial adequacy or source endorsement                      |
| Universal input, Edition, Candidate and qualification protocol | Publisher                                                          | Versioned shape, derived identities, provenance, finite generic predicates          | Authority over domain-specific vocabularies                   |
| Observation of implementation or rendered behavior             | Predicate-specific verifier                                        | Exact subject, verifier, method, result and limits                                  | Independence merely because a report is signed or exported    |
| Acceptance and release decision                                | Designated accepter under the relevant product or editorial policy | Bind the decision to an exact Candidate and named policy                            | Approval from a green build or co-located file                |
| Artifact custody and retention                                 | Selected custodian                                                 | Authorized local plan/apply/recover mechanics and receipt                           | Forge publication, off-host recovery, or indefinite retention |

A maintainer may review their own work where the selected policy permits it.
A source maintainer's approval of a design statement is not proof of deployed
behavior; an independent verifier is required only for predicates whose policy
requires a separate trust domain. An editor may publish independent analysis,
but new editorial assertions are attributed to the editor and cannot appear as
source-approved facts. Official multi-source endorsement must identify each
endorsing source explicitly.

ETHOS may supply optional managed-repository lifecycle, scaffold, acceptance,
and release governance for any participant. It does not own the Publisher
protocol, and Publisher must work equally for unmanaged AIGW, di-effect, or a
standalone Edition project.

## Versioned input and Edition contract

Publisher owns a small, versioned _publication interchange_ protocol because
it is the receiving product. Source and standard maintainers own their native
formats and semantics. An Edition editor owns the instance of Publisher's
versioned authoring contract. Publisher-generated locks, seals, Candidate
identities, and qualification reports are derived records, not fields that a
source author must refresh by hand.

The authored Build Request selects:

- one or more locally available source selectors, each with a source namespace,
  native format identifier and version, selected revision/time basis, declared
  claimant, and either an authoring locator or an already pinned input reference;
- one Edition project root with audience, reader questions, scope, selected
  source references or queries, declared exclusions and transformations,
  narrative, static/interactive expectations, and optional visual overrides;
- output media and a selected qualified toolchain profile.

An authoring locator does not claim immutability. Publisher materializes the
selected inputs and generates their content-addressed identities in a lock
before compilation; ordinary authors do not maintain derived hashes. Callers
may instead select already pinned inputs for replay; a pin mismatch fails
before compilation. Changed bytes at an unpinned authoring locator produce a
new lock, Candidate, and applicable verification obligations, not silent reuse
of the previous lock or approval.

The versioned envelope identifies each revision's kind and verification
method, rather than guessing from the shape of a string. A content-derived
revision is checked against its declared canonical inputs and algorithm; an
explicit VCS reference is checked against its selected repository; a native
opaque revision remains an attributed label unless its format adapter can
verify it. Git resolution is not applicable to a content revision with no VCS
claim. If a required VCS selector cannot resolve during materialization,
selection fails rather than falling back to HEAD. Exact bytes supplied by
another route may still compile with a scoped VCS-provenance limitation when
VCS provenance was actually claimed; applicable acceptance policy determines
whether that limitation blocks qualification. Neither a content digest nor a
matching current checkout silently grants source endorsement, implemented
behavior, or a newer revision identity.

The Edition project may live in the source repository, a separate editorial
repository, or a standalone directory. This changes neither source authority
nor the acceptance owner. Source items may be LikeC4, Structurizr, a native
ETHOS graph, AIGW source-supported architecture material, the historical
Publisher Claim Model, or another admitted format. Unstructured documents and
code can yield _extraction candidates_ with exact references, not automatically
accepted architecture facts. The current Claim Model remains an admitted input
format for historical consumers; it is not a mandatory second editable model
for all successors. A declaration of source ownership is attribution, not
proof that the named owner endorsed the input. The Build Request selects
exactly one Edition project root across direct and Provider-supplied inputs;
ambiguous or conflicting selections fail rather than being implicitly merged.
Direct selection names a root and manifest as authoring locators. Provider
selection names the selected Provider only: its v2 manifest contains at most
one Edition item and binds those authored bytes independently of delivery
mode. Repeating a filesystem root and manifest in a Provider-mode Build
Request would couple the editor's selection to declarative transport and
would have no equivalent meaning for executable delivery. Other selected
Providers cannot silently contribute competing Edition material; the global
join must reject it. Delivery paths remain invocation evidence, not Edition
identity. The Edition JSON alone is not a closed editorial input when it names
an external visual override or resource. Provider mode must bind those bytes
in the selected envelope or fail; it cannot recover them from an ambient
directory or quietly omit them from a cross-mode identity.

The successor Provider is an input-preparation boundary, not a publication
stage. Declarative mode selects native bytes or pre-existing projections with
their authoring or derivation recorded. Executable mode may also perform an
explicitly selected, attributed semantic adaptation when native data cannot be
consumed directly.
Both modes return one closed selected-input envelope: native source items,
optional derived projections with exact `derivedFrom` references, optional
Edition project material, and optional source- or editor-asserted lineage.
Each item identifies its claimant and whether it is native, authored, or
derived; an executable projection does not acquire source endorsement merely
by appearing in a Provider reply. A separate Build Request may combine several
Providers with an independent Edition project.
For an explicitly paired logical input, the modes must yield the same normalized
selected contents and source references; their invocation receipts may differ.
Executable-generated material identifies its derivation and cannot masquerade
as unchanged native source bytes. The reply protocol rejects rendered media,
acceptance, and publication claims. A Provider may materialize an Edition
project from exact selected authoring bytes; an inferred or defaulted editorial
choice is a new attributed proposal, not accepted source intent. The Provider
does not compose scenes. Executable mode sanitizes inherited
environment and configuration and supervises the ordinary process tree; it is
not an OS, filesystem, network, or native-credential-access sandbox. Selecting
an executable Provider is a distinct code-execution trust decision.
Declarative mode selects exact portable files without executing adopter code.
Both converge before one `archpub edition build` entry point; there is no
Provider command tree, discovery registry, or second lifecycle state machine.
Provider ownership follows the item it transports, not a mandatory rule that
it be housed in one source repository.

Each admitted adapter resolves or declares its intended upstream dependencies,
including native includes, resources, scripts, and external references.
Publisher validates the materialized inputs it receives. Compilation qualifies
as reproducible only when the selected backend's inputs and supplies have a
checked closure; unresolved or ambient compiler inputs fail or remain
explicitly unqualified. An executable Provider's
dependency declaration does not establish observed reads or enforced access
confinement. Without appropriate observation or isolation, Publisher cannot
claim that Provider materialization was hermetic or that no undeclared file,
environment value, or network resource influenced it. The Publisher-generated
lock binds the exact materialized bytes Publisher verified and consumed,
adapter/backend versions, checked fonts and other supplies, toolchain
configuration, and Edition bytes. Dependency records state their evidence
method and limits; Provider declarations are not silently promoted into a
proved complete closure.

There is one canonical materialized-input lock, not a direct-mode lock and a
Provider-mode lock. Its selected meaning consists of one Edition's authored
bytes and logical resource references with their exact bytes; one native item
per globally unique source namespace, with format, claimant, typed revision
evidence and exact bytes; derived items with claimant, format, adapter identity
and digest, method, exact output bytes, and ancestors resolved to selected
native namespace and content identity; and the selected media and toolchain
profile. A direct source selector ID and a Provider-local item ID are read
handles, not semantic identities. `derivedFrom` is resolved inside its own
Provider before the global join. A repeated native namespace fails even when
both contents match. A repeated full derived semantic tuple also fails rather
than selecting a last writer. Distinct Providers may reuse local IDs when
their globally selected meanings differ. Set-valued items are sorted before
canonical serialization; delivery order, object-key order and non-VCS file
locator spelling cannot change the lock. A declared VCS repository locator is
currently part of typed revision evidence and may change identity when
respelt; it is not silently equated with another repository until an
independently checked stable repository identity exists.

Provider ID, delivery mode, manifest locator or digest, package root,
supervision, and unresolved or merely declared dependencies belong to
invocation evidence and scoped limits, not the selected-content digest.
Actually observed dependencies enter the lock only with their exact selected
identities; observation methods remain in verification evidence. Equal lock
identities across modes are claimed only when normalized contents and revision
evidence are equal; different receipts still distinguish how those bytes were
prepared. The request-local `read(id)` remains local to a direct request;
cross-Provider access uses typed semantic keys, never one flat namespace of
Provider-local IDs. An Edition resource missing its logical reference or exact
bytes fails before compilation.

Historical v1 manifests and signed outputs retain their old meanings and bytes;
a SemVer successor does not reinterpret them in place.

### Capability-bound local input (proposal for design review)

The current pathname reader can follow an outside ancestor when a checked
parent is replaced with a symlink before `open`. A matching byte digest does
not establish path confinement. This affects Source Bundle inventory, direct
and Provider-selected inputs, Edition resources, and recursive executable
package scanning. Repeating `lstat` or `realpath` cannot repair the race.

The proposed boundary retains local authoring paths but moves only selected
file reading and tree enumeration into one package-private, bounded native
reader built on a pinned stable `cap-std` release. It is not a new public
command, adapter registry, repository authority, or Provider sandbox. For
an absolute path, the reader anchors at the operating system volume root and
opens **each** component relative to the previous directory handle with
no-follow semantics. On Windows it additionally rejects an opened reparse
point of any tag. It reads only regular files from the final handle and
recurses through directory handles, never by reopening a previously checked
pathname. Unsupported path forms, platforms, architectures, missing native
supply, and integrity mismatches fail closed; there is no JavaScript fallback.

One internal protocol provides bounded `read-file` and `scan-tree` operations.
A scan returns sorted, portable member paths, sizes and digests, and exact
bytes only for explicitly selected members. Partial output is discarded if
the helper fails. Publisher keeps format, manifest, Edition, Provider, and
identity validation; the helper exposes no semantic interpretation or write
operation. This gives Source Bundle and Provider package inventory the same
path-confinement primitive instead of a separate scan implementation. The
native executable and its platform digests are packaged with the Publisher
archive, resolved from package-local paths, and tested after offline
relocation. The source file and executable names describe this responsibility,
not a protocol generation.

This design does **not** claim an atomic snapshot of a mutating multi-file
tree, hermetic Provider execution, or resistance to an actor replacing the
contents of an already-open regular file. The lock binds the bytes actually
read; a changed pin fails. Cross-platform race tests must show that outside
bytes are never consumed even when their digest matches. Stable-tree
membership and file-content mutation remain distinct, explicit acceptance
limits. Native macOS, Linux, and Windows tests must cover ancestor and final
symlinks, Windows junctions and other reparse points, rename races, regular
files, limits, and package relocation. First-party native code enters the
95% quality bar rather than escaping coverage by being outside JavaScript.
The sidecar is admitted only if this matrix and measured package/runtime cost
pass; otherwise revisit transport without weakening the source-intake claim.

A self-contained carrier still needs a trusted initial read and would change
direct-mode authoring. Caller-supplied handles transfer confinement and
provenance duties to every adopter. An in-process native addon could avoid
process overhead but adds Node ABI and crash coupling. The bounded sidecar
is the preferred review candidate, not yet an implemented or qualified fact.

## Import, identity, and semantic limits

For each admitted native format or derived projection, one adapter declares
recognized constructs, source-reference quality, supported transformations,
and unsupported fields. It may be Publisher-owned for a public native format
or supplied by a source or qualified third party inside an executable Provider
for domain-specific adaptation. This is one input contract, not a second
command plane or semantic authority.
The imported representation is a derived view-compilation index, not a general
semantic database or new editable authority. Native bytes and format identity
remain attached. An opaque construct is retained as opaque and diagnosed when
an Edition asks Publisher to reason about it; preserving a JSON blob is not
understanding it. No adapter may silently turn ordering, state transition,
permission, causation, or authority into an undifferentiated arrow.

For LikeC4 model and view files, the preferred native importer uses the
upstream `@likec4/language-services/node` `fromSources` API on the exact
selected byte map, not a hand-written DSL parser or an ambient workspace
scan. It checks that parsed document paths equal the selected file set and
translates the public `locate` results for elements, relations, and views
into logical file paths, byte digests, and LSP ranges. A relation locator may
be only a point; it is not a full-source-span claim. The importer preserves
LikeC4 element IDs, typed relation endpoints/kinds/direction, and view IDs;
user metadata and unsupported predicates remain opaque until an admitted
vocabulary assigns them meaning. Engine-generated relation IDs are
revision-scoped even if they stay equal in one workspace run.
An authored LikeC4 dynamic view has ordered flow semantics; its elements and
edges alone are not an equivalent structural view. Until an admitted adapter
preserves those steps, the native index lists it separately as an opaque view
with kind and source origin, rather than placing it among supported structural
views. A later Edition compiler must reject a semantic obligation that depends
on such an opaque view; retaining its bound DSL bytes is not understanding it.
Element and relation metadata are copied only as bounded `opaqueMetadata`
values on their source-bound items. The enclosing item's location is not a
claim of a precise metadata-key span. Keys such as `owner` or `policy` cannot
become Publisher authority, plane, or acceptance facts without a separately
admitted source vocabulary and interpretation rule.

For the pinned LikeC4 1.59.4 implementation, `fromSources` creates virtual
documents and selects its `NoFileSystem` provider when `useFileSystem` is false;
that provider rejects non-builtin `readFile` requests and scans no project
files. The importer now requests this mode, disables manual layouts and
watching, and selects WASM rather than a Graphviz binary explicitly. This is
source-level evidence for the selected upstream parser mode, not an attestation
that an arbitrary supplied callback obeys those options or that all package
and execution reads are closed. The emitted index therefore retains its
`parsed-document-set-only` limit.

LikeC4's parser is an optional, explicitly selected toolchain supply, not a
mandatory Publisher-core dependency or a Provider registry. The installed
parser, its declared peer packages, transitive content, and execution limit
must be bound and qualified before an Edition may claim complete replay.
No ambient Homebrew binary, adjacent `node_modules`, or unverified package
version is a fallback. A source-specific Provider may instead supply an
attributed projection, but that does not silently become independently
verified native parsing. The derived index is disposable; the authored DSL
and Edition remain their respective sources of truth.

For the successor pilot, prefer one reproducibly generated LikeC4 parser
supply inside the existing Publisher package over a mandatory transitive npm
runtime dependency or a second Adapter package. The supply is installed with
Publisher but loaded only when selected native LikeC4 input requires it; its
presence grants no source or editorial authority. The pinned development lock
and esbuild generator own the source graph. A derived manifest must bind the
exact bundle, all included package identities, complete license notices, and
the permitted Node built-in imports; runtime admission must reject drift and
non-built-in dynamic resolution. The public build path must use this admitted
supply rather than accept an arbitrary parser callback as qualified evidence.
The current 5.18 MB raw, approximately 1.48 MB gzip probe replaces an observed
roughly 91 MB cold dependency tree at the cost of increasing every Publisher
installation; that is a measured trade-off, not a universal size optimum.
Revisit this choice if package growth, license renewal, cross-platform output,
or maintenance cost makes an optional separately installed supply cheaper.
No Candidate may claim complete replay until license closure, native Windows
and Linux installed use, bounded execution, and exact consumed-supply identity
are proved.

Within one source revision, a native engine's relation IDs may map view edges
back to its model relations. Across a relocation or revision, generated IDs
are not automatically stable. Use source-defined stable IDs when available;
otherwise bind revision-scoped locators and report matching confidence.
Ambiguous rename, split, merge, duplicate relation, or moved-source matching
requires explicit editor lineage and applicable review. Rehashing after a
source edit does not make an old claim current.

Multi-source identity is `(source namespace, native reference, revision)`, not
label equality. Cross-source joining, comparison, or synthesized relations are
explicit editorial/domain assertions with named proponents. A composition
cannot infer `A -> C` from `A -> B -> C` or turn an existential member relation
into a universal group relation. Aggregations declare their particular claim
(e.g. containment, some-member flow, all-member invariant), affected source
references, and any source-owned forbidden pairs. Publisher checks finite
structural and declared rules; source-specific semantic adequacy remains a
scoped proof or review question.

A conflict between selected sources, or between target and implemented planes,
may be the subject of an Edition. Broken input and self-contradictory
transformation declarations block the affected Candidate; attributable source
disagreement does not. Concealment or silent resolution of disagreement is
forbidden. Public media must visibly distinguish target, current observation,
editorial proposal, and unresolved difference where that distinction changes
reader interpretation.

## Editorial composition and media

The default authoring loop is import, inspect, state reader questions and
forbidden simplifications, receive explainable grouping/view candidates,
accept or edit one Edition project, preview both media, and refine local
constraints. An accepted machine suggestion becomes an edit in the same
Edition project, not a parallel auto-generated intent store. Baseline authoring
must not require duplicating labels and relations, writing hundreds of lines
of geometry, or implementing a renderer. A full canvas/WYSIWYG design suite is
not required; declaration plus immediate visual preview and bounded local
adjustments is the initial product surface.

The unreleased Edition Project contract declares named views inside each
medium. A view owns its reader-question subset; the medium's promised question
set is derived from the ordered views rather than copied into a second list.
View IDs are unique within a medium, so `overview` may be reused across static
and interactive compositions without conflating their identity or geometry.
An omission names its medium and source view. A `covered-elsewhere` target must
be a distinct view in that same medium, ask the affected question, and not omit
the same reference. This is a finite authoring check, not evidence that the
target's rendered words and shapes communicate the assertion; visible coverage
and reader review remain independent later gates.
Before layout, one frozen projection derives assertion IDs and explicit limits
for each view/question, then unions the view obligations for each selected
medium. A view-specific omission removes only the matching source assertion
there; editorial assertions are never implicitly erased. A view cannot promise
a question with neither a retained assertion nor a disclosed limit. This
projection is a compilation obligation over authored choices, not proof that
the source claim is true or the rendered carrier is readable.

The Edition project selects _what_ matters and may constrain _how_ it must be
expressed. Publisher supplies reusable neutral composition patterns, spacing,
typography, hierarchy, contrast, and layout assistance. Semantic role, domain
classification, and visual shape remain separate: a database icon cannot
assert that an AIGW authority is a database. Source or editor can provide
visual vocabulary and flagship art direction without changing source facts.
Generic defaults must earn reader quality; they are not a license for uniform
boxes, excessive blank space, or hidden-only coverage. Manual art direction is
an override of a qualified baseline, not the price of entry.

Static and interactive scenes compile independently from the same selected
semantic obligations. A static overview may use carefully chosen aggregates
and visible relational text; interactive pages may reveal mechanisms and
source traces without downgrading their own complete reader questions. Each
medium has separate geometry, accessibility, artifact identity, quality
observations, and applicable human review. Raw imported files and private
source bytes are not embedded in public HTML by default. The editor and
custodian choose disclosure; Publisher checks the declared output inventory
and performs no ambient source publication.

A visible assertion must be linked to a source or editorial claim, and every
required claim for that medium must have a visible carrier for coverage to
pass. An omission changes that medium's editorial scope and requires a new
judgment that the promised reader question is still answered; it cannot keep
the old complete-coverage claim. A limited Edition may be published with its
limit explicit. Metadata, hover-only content, or hidden element IDs do not
satisfy static visual coverage. A carrier map is necessary for tracing, not
sufficient proof that the actual words and shapes communicate the claim.

## Framework admission and deletion

Use the best maintained mature mechanism for each bounded responsibility,
without treating a framework's default diagram as a finished Edition. LikeC4
is a real candidate for native ingestion, model/view computation, and layout
reuse; its `EdgeModel.relationships()` exposes relation links within a build.
Its generated IDs need a separate cross-revision identity strategy and its
default AIGW visual failed publication-quality review. Structurizr is a
model/view alternative where C4 semantics fit. D2, Archify, SVG/raster
libraries, layout engines, Playwright, and axe-core are candidates at their
actual layout, rendering, or observation boundaries. Kroki's conversion
registry is not by itself a semantic publishing engine.

Run a frozen workload bake-off on self, ETHOS, the whole AIGW product plus its
Client Projection chapter, and native di-effect. Test direct framework use,
a thin evidence wrapper, and the editorial workbench path on the same reader
questions. Hard requirements are exact source identity, no hidden domain
reinterpretation, truthful omissions/conflicts, two independent usable media,
offline installed use, bounded effects, and accessibility. Among candidates
that pass, compare adopter-authored lines/decisions, time to first acceptable
work, update work after one source delta, output quality, dependency closure,
license, upgrades, repair, and exit cost. Keep one selected owner per
mechanism. Delete displaced custom owner and duplicate tests after parity;
do not wrap a new engine around an unchanged old engine indefinitely.

No current evidence establishes one winning complete backend stack. The
versioned Publisher protocol and Edition intent should survive backend
replacement. Publisher-generated vendor representations and layout geometry
are derived carriers; an authored native DSL remains authoritative for its
declared source meaning.

## Change, qualification, acceptance, and custody

After input materialization, closed-input validation, and dependency locking,
Publisher's compiler derives Candidates from selected source revisions,
Edition project, and qualified toolchain without authorizing publication.
Executable Provider materialization is a separate code-execution boundary;
process-tree supervision alone does not make it side-effect-free or sandboxed.
The evolution report separates source-byte changes, supported meaning changes,
unknown/uninterpreted changes, editorial selection changes, media changes,
and packaging-only changes. Each triggers only its applicable rebuild and
review predicates; uncertainty broadens obligations, while irrelevant changes
do not force meaningless redraws. No previous acceptance transfers merely
because a hash is updated. An acceptance policy may explicitly allow new-byte
acceptance using strong unchanged-meaning/unchanged-visual evidence; the
Publisher reports that evidence but does not grant the policy or decision.

Qualification distinguishes source binding, structural carrier trace,
declared transformation checks, domain/predicate verification, actual visual
readability, browser behavior, accessibility, installed/offline behavior,
recovery, and human editorial assessment. Each result names exact subject,
verifier, method, scope, and limit. One result never impersonates another.
Reproducible compilation from sealed materialized inputs is a separate
predicate from reproducible or hermetic upstream Provider execution.
Automated geometry and accessibility tests do not prove faithfulness or taste;
a single human may serve as author and reviewer where policy permits.

The Candidate contains independently openable reader artifacts and a portable
provenance/quality manifest, not the entire private source bundle. The accepter
decides whether to publish it, and the selected custodian owns release assets,
retention, withdrawal, and readback. Publisher's `publish` remains an optional
bounded local filesystem install/replace/recover effect after exact external
authorization; preview and export do not depend on that effect. It does not
advance Git refs, create Forge Releases, certify hosted availability, or own an
adopter's artifact retention. Publisher's own off-host DR remains a separate
operator decision requiring destination, custody, retention, encryption,
credential, and clean-host restore acceptance; this Change supplies the
contract, not an unapproved implementation.

## Contract counterexamples and migration order

Before the old specifications become implementation tasks, make these cases
executable at the contract boundary:

1. Two sources with the same `authority` or `client` label retain separate
   identities. A cross-source relation has a named proponent; different source
   times are not represented as one simultaneous observation.
2. Target/current conflict can be published as an explicit comparison. A
   broken input or self-contradictory transformation fails; mere disagreement
   is not silently hidden or globally blocked.
3. di-effect's native LikeC4 sources enter without a tracked duplicate Claim
   Model. Existing source views may be reused, but a reader-specific chapter
   must not be forced to include every model element. Relocation and a new
   relation do not silently inherit lineage or acceptance.
4. ETHOS's 113/164 source case supports its explicit allowed aggregates and
   forbidden pairs, visible target notice, cooperative/competitive/all-drop
   Lane semantics, and static/interactive independent composition. Hidden IDs
   cannot make an incorrect aggregate pass.
5. Full AIGW and Client Projection remain distinct Editions or chapters.
   Credential authority, desired state, native clients, guarded effects,
   rollback, and release owners are not flattened into the 12/11 subset.
6. A maintainer without renderer code or pixel geometry can produce a readable
   static and single-file interactive baseline through the public path. The
   self-Edition uses that same path and may add declared flagship refinements.
7. A local source change identifies affected questions, views, predicates, and
   acceptance work precisely where declared dependency closure supports it;
   otherwise unknown impact triggers necessary broader checks. Packaging-only
   change does not masquerade as semantic change; changed published bytes do
   not silently reuse approval.
8. An AIGW declarative Provider can select authored meaning and its exact
   native evidence without rewriting tracked source snapshots or derived
   Publisher hashes. An ETHOS executable Provider may supply a declared,
   source-derived semantic projection and Edition intent without performing
   Publisher sealing or later-stage effects. An explicitly paired delivery
   fixture has equal selected contents across modes, apart from invocation
   receipts; the two different source products are not falsely required to
   have equivalent domain models.

First freeze signed historical artifacts and exact adopter source revisions.
Next reconcile this design with the proposal, delta specifications, and sole
`tasks.md` ledger in the existing Change. Then run the framework bake-off and
implement the smallest qualifying native-input and Edition path with RED/GREEN
contract tests. Migrate self-use first; AIGW and ETHOS source-side changes
remain in their separately authorized single-writer lanes, with exact installed
and media acceptance before deleting old glue. Do not move source-domain logic
into Publisher or require adopter checkout adjacency. Source, package,
installed-use, browser/accessibility, recovery, human-review, publication,
protected-ref, hosted-CI, and remote-readback claims are closed separately.
Repository coverage remains at least 95%; SemVer and Keep a Changelog govern
the successor. Historical signed releases stay byte-for-byte intact.

When the reviewed successor specifications eventually replace the active base
specifications, update the old `edition-provider` and `edition-publication`
Purpose statements to role-based wording alongside their renamed requirements.
Do not edit accepted base-spec Purpose text now: that would misdescribe the
still-released v1 product before a successor is implemented and admitted.

This design is accepted only when the counterexamples demonstrate that the
recommended workbench is both more useful than direct framework use and less
costly than asking adopters to hand-build the same Edition twice. Otherwise
reduce the product boundary rather than weaken the evidence or quality bar.
