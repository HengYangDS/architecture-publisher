# Design

## Status and evidence boundary

This design and its revised specifications were approved on 2026-09-24. The
same Change's `tasks.md` alone records implementation progress. Design or
specification approval is not product acceptance or release evidence.

### Program context (non-normative)

The five worklines retain distinct purposes; this Change belongs to E.
This map records program responsibility, not product semantics or a second
progress ledger. This relocation does not change normative product decisions.

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

The complete graphical editor, live synchronization service, plugin
marketplace, universal semantic compiler, and automatic aesthetic optimizer
remain outside Workline A. Do not advertise them as implemented or let them
indefinitely delay fixed delivery.

The selected historical baseline is the signed `v0.3.0-alpha.3` product line.
No predecessor tag, Architecture Publisher 0.2 release, or signed artifact is
rewritten. The read-only cases used to challenge this design are Publisher
`8e758ec`, ETHOS `87bbb0d68`, AIGW `3318c819`, and di-effect `8a168b6b9`.
The di-effect checkout had an unrelated dirty `.serena/project.yml`; this
review did not modify it.

The observed pressure is specific:

- The observed AIGW Client Projection is a limited Edition, not a whole-product
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

| Concern                                                        | Authority or accountable role                                      | Publisher can establish                                                         | Publisher cannot infer                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Native model, domain schema, and source claim                  | Source or format owner; a claimant is named per assertion          | Exact selected bytes, format/version, reference and declared claimant           | That a maintained statement is implemented or true            |
| Import mapping and supported constructs                        | Adapter owner, with source review when official                    | Adapter identity, recognized constructs, structural preservation, reported loss | Domain equivalence from an opaque extension                   |
| Reader question, scope, abstraction, narrative, art direction  | Edition editor                                                     | Selection consistency, trace and selected-basis checks; editing assistance      | Editorial adequacy or source endorsement                      |
| Universal input, Edition, Candidate and qualification protocol | Publisher                                                          | Versioned shape, derived identities, provenance, finite generic predicates      | Authority over domain-specific vocabularies                   |
| Observation of implementation or rendered behavior             | Predicate-specific verifier                                        | Exact subject, verifier, method, result and limits                              | Independence merely because a report is signed or exported    |
| Acceptance and release decision                                | Designated accepter under the relevant product or editorial policy | Bind the decision to an exact Candidate and named policy                        | Approval from a green build or co-located file                |
| Artifact custody and retention                                 | Selected custodian                                                 | Authorized local plan/apply/recover mechanics and receipt                       | Forge publication, off-host recovery, or indefinite retention |

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
  source references, declared exclusions and attributed editorial assertions,
  narrative, static/interactive expectations, and optional visual overrides;
- output media and a selected qualified toolchain profile.

The Build Request does not own an output directory. The single successor
`archpub edition build` invocation selects one fresh Candidate output directory
with `--output`; absence of that argument has no implicit default. Publisher
validates the destination before creating artifacts and records its location as
invocation evidence, not as source, Edition, materialized-lock, Candidate, or
publication authority. Compiling the same selected meaning into two fresh
directories may produce identical Candidate bytes without conflating the two
local effects. Historical v1 build plans retain their original `output` field
and CLI meaning; an output override must not silently reinterpret them. This
is one command with version-aware input dispatch, not a second command plane.

The successor's `architecture.edition-candidate/v2` is a built-but-unqualified
value. Its input binding holds the selected lock and Edition hashes, native
semantic digest, consumed semantic-supply identities, and declared read-closure
limit. The supply list is empty when an exact Claim Model needs no parser; it
must not contain a fabricated LikeC4 digest. Each
requested medium records its own Scene digest, artifact hashes, and consumed
supplies. Its private carrier-map digest binds source identities to opaque
graphic IDs without serializing source locators into the public SVG or HTML;
rendered words and geometry must be observed separately before claiming visible
coverage. The manifest also retains the Edition-derived reader obligations and
limits. A Source Bundle is used only as an exclusive, hash-inventoried local
Candidate container. Its manifest and a structurally valid Candidate do not
authorize source truth or publication. Output paths are invocation results,
never Candidate fields. Historical `architecture.edition-candidate/v1` remains
unchanged and replayable.

For successor qualification, first verify the Candidate's exact file envelope,
then replay the selected Build Request through the same installed Publisher
package into a private temporary output and compare the complete bundle
manifest and normalized Candidate digest. A self-consistent forged container,
changed pin, or copied Edition therefore fails before any external predicate
record can borrow its authority. This is current-runtime byte equivalence, not
an attestation of the original builder or independent proof of semantic or
visual truth. The replay operation is a qualification-library primitive that
will be used by the existing `qualify verify` command; it adds no command plane.
Before replay, the verifier shall inspect the pinned Build Request and Provider
manifests without executing Provider code. Evidence supplied in the v2 input
cannot authorize that execution. The invoking verifier must separately pass
`--execute-providers` with the exact set of selected `<id>@<manifestSha256>`
pairs; the public replay API takes the same invoker-owned choice separately
from its selected evidence. Absence, an extra pair, or a changed pair fails
before Provider execution. This is an explicit code-execution choice by the
caller, not a sandbox, credential grant, verifier authentication, or permission
to publish. One independent parent watchdog starts a monotonic total deadline
before selected reads and supervises the complete replay and record binding;
Provider-local timeouts do not bound their sum. A nested Publisher worker must
register its process group with that parent before its selected code starts.
On timeout, the parent stops new work and cleans registered groups before the
outer worker. It removes only scratch proved unused and admits no records when
registration or cleanup is unproved.

This is containment of Publisher-owned ordinary workers, not a sandbox for
arbitrary detached descendants created by an executable Provider. On Windows,
tree termination requires the selected root to remain alive. Unexpected root
loss therefore yields `cleanup_unproved` and no passing result; the verifier
must not claim descendant reclamation or erase scratch that might still be in
use. A stronger unconditional Windows claim would require a separately admitted
Job Object mechanism, not another `taskkill` wrapper. Until the bounded
supervision and its native counterexamples pass, no end-to-end boundedness
claim is made.

### Successor qualification authority

The successor `qualify verify` input selects exact Build Request, Candidate
container, and Qualification Set bytes under versioned Publisher contracts.
On the v2 qualification route, every selected JSON value, including the
v1-format Source Bundle manifest carrying the Candidate, rejects duplicate
keys; other historical v1 consumers remain unchanged. The verifier performs
one current-package Candidate replay before considering external records. A v2
Qualification Set binds the resulting Candidate and input-lock digests and
contains predicate-specific records with verifier identity, implementation
digest, selected subject and scope, observations, verdict, and limits. Unlike
v1's Claim Model fields, it does not repeat identities the v2 Candidate already
binds. Scope is a closed tagged choice of Candidate, medium, artifact,
medium-scoped view/question, or medium-scoped assertion within a view/question.
View/question pairs, assertion membership, and artifact membership are checked
against the Edition obligations derived during that same successful replay. A
second Provider materialization must not supply a different editorial scope. A
view/question limit may be disclosed without crediting an omitted source
assertion as visible. The Candidate's submitted obligation arrays alone confer
no authority. A record cannot invent a medium, view, question, artifact, or
source identity. The existing path-reader race limit remains explicit until
handle-relative confinement is proved.

The presence of a PASS record establishes only that submitted bytes _attribute_
a result to a named verifier; Publisher has not authenticated that identity or
executed the stated method. The current runtime may prove byte equivalence;
browser, aesthetic, domain, installed-use, and recovery predicates require their
own observations. Until a versioned policy selected by the designated accepter
names required predicates and trusted verifier roles, the result may report
structurally bound records and unresolved scopes, but cannot claim qualification
completeness, admission, or acceptance. A trusted or independent role needs
authenticated provenance or an explicit accepter-owned decision that does not
impersonate independence. Policy may allow the editor and reviewer to be the
same person, but that does not make the judgment independent implementation
verification. Policy and final acceptance remain separate from source and
Edition authorship.

An invoker claiming the accepter role selects policy bytes by exact path and
SHA-256 outside the three-selector v2 qualification input. This prevents
submitted evidence from choosing its own rule and keeps one `qualify verify`
command. The finite `architecture.qualification-policy/v1` value names its
accepter and exact Candidate digest, which already binds the input lock. It
acknowledges the Candidate's limits and enumerates required predicate, scope,
verifier identity, method, and allowed record limitations. There is no implicit
wildcard selector or second policy engine. A source product may derive this
per-Candidate value from its accepted policy; Publisher does not own that
derivation.

Publisher compares submitted records to those exact tuples and reports missing,
failing, unknown, unselected, or limited evidence separately. Every selected
view/question must have a named requirement. Even a complete submitted PASS
set remains `invoker-selected-unverified`: the CLI cannot authenticate the
claimed accepter or verifier, decide editorial adequacy, or authorize a source
product release. A human verifier may equal the editor when explicitly named
by that policy; this is not independent implementation verification.

This contract delta remains within the approved Change; implementation and
acceptance status belong only in `tasks.md`. Historical Qualification Set and
Input v1 retain their meanings and command route.

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

The v2 join already seals derived bytes, but a Provider-local item ID is
deliberately absent from the lock and cannot serve as an Edition address. Each
selected derived projection therefore has one stable, globally unique
`namespace`, distinct from every native namespace. The lock binds this address
to claimant, format, exact bytes, adapter identity, and resolved native
ancestry; equal bytes do not equate native and derived authority. An Edition
lists its native `sourceNamespaces` and only the derived
`projectionNamespaces` it intends to address; it does not echo unused Provider
outputs. Each reference resolves against its named class. An Edition with no
derived references may omit the empty projection list. A duplicate address
fails before compilation.
Using a content digest as the editor's reference would force unrelated
re-authoring after every source change; using the Provider-local ID would make
delivery mode editorial authority; calling executable output native would
misstate its derivation. None is an acceptable shortcut.

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

Lock equivalence is not Candidate equivalence. A Candidate separately binds its
selected input closure, disclosed limits, scenes, and media. Delivery modes can
select the same locked meaning and produce the same visible carriers, while a
different closure or an unobserved executable dependency changes the Candidate
or its scene identity. Qualification and human review therefore bind the exact
Candidate and media, never just the shared lock or a cross-mode test result.

Historical v1 manifests and signed outputs retain their old meanings and bytes;
a SemVer successor does not reinterpret them in place.

### Local-input race boundary

Publisher is a caller-invoked local compiler, not a service that promises
isolation from a hostile same-user filesystem mutator. Bounded regular-file
reads and stable symlink rejection reduce accidental misselection; a pathname
check followed by `open` does not prove confinement under concurrent ancestor
replacement. The lock binds bytes actually consumed, not an atomic multi-file
snapshot or a race-free path. A changed pin fails, and the read method and
concurrent-mutation limit remain explicit qualification evidence.

A native capability-bound reader is deferred, not a hidden prerequisite for
Task 2.4. It would add a cross-platform executable, distribution and license
closure, a second read protocol, and native test and coverage obligations
without solving atomic multi-file snapshots or arbitrary same-user mutation.
No admitted consumer or requirement currently needs the stronger property.
If that boundary becomes necessary, first name the hostile-mutator consumer
and acceptance predicate, then compare source-owned immutable snapshots,
caller-supplied handles, and a native reader on the same counterexample and
total ownership cost. Do not claim path confinement meanwhile.

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

The existing Claim Model v2 is the first non-LikeC4 counterexample. It may be
selected as authored native input or as an attributed Provider-derived
projection, but those are different provenance classes. Its entities,
relations, and claims retain typed plane, condition, scope, validity, maturity,
dependencies, and provenance through semantic selection. A layout engine may
use their structural subset as disposable geometry; it cannot replace or
silently flatten those claim fields. A required assertion that a medium cannot
express fails or becomes an explicit reader-question limit. This lets AIGW and
ETHOS use the same public compiler without an editable LikeC4 copy or a false
claim that derived ETHOS facts are unchanged native bytes.

Input admission alone does not establish that route. Common-compiler support
requires conservative evolution and independent usable media for native and
source-derived Claim Model entities, relations, and claims, including their
typed qualifiers, provenance, applicability, obligations, and explicit limits.
A Candidate records only parser supplies actually consumed. Unsupported
expression fails before Candidate completion. These responsibilities belong at
semantic selection/evolution, Scene, and renderer owners, not in source
Provider transport. Full AIGW and ETHOS acceptance must exercise installed
public builds rather than infer parity from partial Claim Model fixtures.

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
For this LikeC4 adapter, an Edition's opaque `reference` string is resolved
only when it names `element:<native-id>`, `view:<native-id>`, or a relation's
`relation:<line>:<column>` under a selected source namespace. Line and column
are one-based positions derived from LikeC4's bound LSP source locator, not its
generated relation ID; equal labels are never lookup keys. The relation's
source digest and location, endpoints, kind, direction, label, and opaque
metadata remain selected meaning. A supported structural view resolves its
finite upstream-computed member set while retaining the view-membership
qualification limit; a relation whose source endpoints are absent from the
view's visible member set makes that structural selection unrepresentable
instead of creating a dangling or falsely aggregated edge. Selecting a relation
implies no transitive or causal edge.
Generated views have no authored source binding, and dynamic views remain
uninterpreted rather than satisfying structural obligations. No free-form
LikeC4 query language is admitted yet; adding one requires a separately
reviewed, versioned interpretation rule rather than a hand-written DSL parser.
These selections are disposable compiler projections, not a second editable
source graph. A parser-run ID change alone does not change selected meaning
when source bytes, location, and supported fields agree; changed source
location or meaning requires fresh correspondence or editor review before old
acceptance can be reused. Candidate semantic identity must be derived from
these normalized, source-bound selections, not by hashing the raw native index
with its volatile engine IDs.
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

The native execution boundary must not reuse Provider protocol semantics or
copy its process-tree algorithm into another owner. Extract only the
process-lifecycle primitive below both adapters, preserving Provider's
existing error contract. The native adapter first verifies the installed
supply and selected source bytes, then runs a code-owned parser worker under
one finite deadline and bounded request/reply sizes. That worker receives the
sealed source bytes through an already-open input descriptor and loads a
private copy of the verified parser bytes, not the mutable installed path.
The parent validates the returned index shape and its selected source and
supply identities before admitting it; this does not independently reparse
LikeC4 meaning. Timeout, output overflow, execution error, or unproved
owned-tree cleanup never yields a successful index; no ambient parser, direct
in-process fallback, or second command plane is allowed.

Node's stable Permission Model narrows this worker's reads to Publisher's
installed source-module directory and the private verified parser file, without
granting child processes or writes. The directory grant avoids maintaining a
second hand-authored ESM dependency list, but is broader than exact per-module
grants. Version-specific network scope, inherited-descriptor and symlink
exceptions, and same-user limitations make these flags defense in depth, not a
sandbox or a complete-read attestation.
Keep the general Node package floor unchanged until an installed-platform
contract justifies a change; fail the native feature closed where its selected
worker capabilities are unavailable. The separate dependency/read-closure
claim requires observed installed execution and explicit unknowns, not merely
`useFileSystem: false`, a manifest hash, or permission flags. The dated probe
and upstream limits are recorded in `docs/research/mechanism-evaluation.md`.

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
may be the subject of an Edition. Broken input and unadmitted transformation
declarations block the affected Candidate at input validation; attributable source
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
the same reference. The selected reference must actually yield a source
assertion for that question, and the target must retain it. A context-only
reference cannot claim coverage elsewhere. This finite authoring check does
not prove that the target's rendered words and shapes communicate the assertion; visible coverage
and reader review remain independent later gates.
Before layout, one frozen projection derives assertion IDs and explicit limits
for each view/question, then unions the view obligations for each selected
medium. A view-specific omission removes only the matching source assertion
there; editorial assertions are never implicitly erased. A view cannot promise
a question with neither a retained assertion nor a disclosed limit. This
projection is a compilation obligation over authored choices, not proof that
the source claim is true or the rendered carrier is readable.

### One authored source-selection record

An in-memory, source-adjacent translation of AIGW's four questions, five
static groups, eleven relations, and eleven claims into the unreleased Edition
Project needed 22 selected references plus 22 separately authored source
assertions. Under identical two-space JSON formatting, that draft was 699
lines against 634 for AIGW's current Edition v1. Line count is not a quality
score, but updating one source claim in two editable records is avoidable
authoring cost. The trial did not produce qualified media or an accepted AIGW
Edition Project.

The successor contract therefore has one authoring record per source
selection. An optional nonempty `questions` list on that selection declares a
required source assertion with the same ID; absence marks a context-only
selection that establishes no visible-coverage obligation. Context-only still
requires exact parsing and binding, and remains a dependency of each editorial
assertion that names it as a basis. Retargeting or changing that selection must
invalidate the affected editorial views and their medium and human review; the
absence of a source-visible obligation cannot erase a semantic dependency.
Separately attributed `editorialAssertions` retain their proponent and exact selected
basis. The compiler derives one immutable assertion inventory for view
selection, meaning, and coverage; authors do not maintain a second
`requiredAssertions` list. Omission references still name the source
selection and are scoped to medium, view, and question. Source selection and
editorial assertion IDs cannot collide.

The ordered view arrays own page order; each view's question array owns
within-page order. The top-level question array owns definitions and default
listing order, not a competing page order. Remove both the separately authored
`narrative.readingOrder` and its unused interactive Scene counterpart. The old
field entered a Scene digest but never controlled renderer navigation; page
arrays already supply that order.
Medium-local `presentation.intent` is an optional editorial note, not a required
layout control. When authored, it remains selected Edition meaning and a change
renews the affected medium's review; omitting it does not invent a default intent.
Retain the authored summary. Editorial attribution and unverified status must
be visible in both public media, not merely survive in the Scene object. This
changes only the unreleased Edition Project, not valid historical Edition v1
bytes or meaning.
Do not add a compact-form compatibility facade or a generated editable
assertion file.

The initial unreleased Edition Project admits only exact source references.
Its earlier `query` selection variant and `transformations` array had no
working compiler consumer: native selectors rejected queries and meaning
compilation rejected nonempty transformations. Remove both from the authoring
schema and fail at input validation instead of offering controls that cannot
produce a Candidate. Editorial assertions still carry a named proponent,
selected basis and unverified status; they are not silently upgraded into
source claims. A future query language or transformation rule needs its own
versioned meaning, bounded execution and real adopter acceptance before it
can re-enter authoring.

The AIGW cost probe establishes duplicated authoring, not successor media
fitness. At design approval, its relation-plus-claim selection reached meaning
but both Scene compilers rejected the mixed form. The mixed grammar, four distinct reader
questions, five authored groups, public two-medium expression, and installed
Candidate belong to composition and qualification acceptance, not to a line
count or the syntax-only authoring change.

The Edition project selects _what_ matters and may constrain _how_ it must be
expressed. Publisher supplies reusable neutral composition patterns, spacing,
typography, hierarchy, contrast, and layout assistance. Semantic role, domain
classification, and visual shape remain separate: a database icon cannot
assert that an AIGW authority is a database. Source or editor can provide
visual vocabulary and flagship art direction without changing source facts.
Generic defaults must earn reader quality; they are not a license for uniform
boxes, excessive blank space, or hidden-only coverage. Manual art direction is
an override of a qualified baseline, not the price of entry.

### Selected scene refinement for flagship Editions

The self-Edition makes the override boundary concrete. Its current source model
has 38 entities, 51 relations, and 89 derived claims across eight reader
questions. Its source-owned static composition and interactive scene code
author aggregations, routing, and hierarchy; Publisher already supplies font
measurement, rasterization, Archify/Atlas rendering, and quality checks. The
legacy self builders pass their own tests, but at design admission the successor
scene compilers rejected every non-null `visualPolicy.override`. Re-authoring the same model as a
neutral Edition Project cannot by itself establish flagship visual parity.
Neutral-only output discards authored aggregation and geometry; accepting
self-rendered files bypasses the common compiler's visible-meaning check; an
executable renderer registry adds a new trust and upgrade surface before a
second backend need is demonstrated.

Use the existing selected `visualPolicy.override` resource as a versioned,
data-only scene refinement. The editor may prepare it from source-owned code,
but `archpub edition build` consumes only its selected bytes. Each refined
medium retains its own scene, source-qualified semantic-to-graphic bindings,
dimensions, visible limits, and selected backend supplies. Publisher checks
the refinement against the same required assertions, actual source members,
allowed and forbidden aggregates, and disclosure policy as the neutral path;
private bindings do not enter public media without explicit disclosure.
Group membership alone never authorizes a collapsed claim. Missing or
unsupported refinement fails the affected medium rather than falling back
to a falsely equivalent neutral output. Pre-rendered SVG/HTML and a self-only
build command are not substitutes for this join.

The selected resource makes an explicit decision for every requested medium.
Each medium selects an authored refinement or the closed `{ "kind": "neutral" }`
choice, which invokes that medium's ordinary compiler. A missing or extra
medium, unknown choice, or all-neutral no-op resource fails before Candidate
completion. The neutral choice is not a silent fallback: it lets a source editor
refine static geometry without inventing interactive art direction, or vice
versa. One medium's refinement cannot transfer its visible-meaning judgment or
approval to its sibling. The resource bytes remain bound to the input lock;
an authored Scene records only the digest of its medium decision, so editing
the sibling decision cannot change its Scene identity or visible artifact
bytes, even when both media are authored.

First reuse the existing static scene audit, SVG/raster primitives, and
Archify/Atlas renderer boundaries. Generalize only a mechanism exercised by
both the self-Edition and one unrelated Edition; do not add a renderer plugin
registry or import self package code into Publisher Core for this case. Keep
signed historical refs and verified comparison evidence immutable.
The live legacy builders may be removed after exact selected-meaning coverage,
installed reproduction, and independent static/interactive browser and
accessibility behavior pass on the public successor path. Their deletion must
not wait for approval of a Candidate that still attributes the new interactive
artifact to the old self-only Atlas builder. Re-author the self Claim Model and
provenance against the surviving owners, then obtain human visual acceptance of
the resulting exact static and interactive bytes before integration or release.
If the current scene contracts cannot carry those obligations without loss,
revise that contract explicitly
instead of weakening parity or claiming that a carrier map proves meaning.
The successor may earn a different accepted visual composition; byte equality
is required for repeat builds of the same selected inputs and supplies, not
between a new Edition and historical signed release artifacts.

Historical signed releases retain their own Atlas v1 bytes and meaning. That
does not require a live successor compatibility path. The terminal product
names its unqualified interactive medium an interactive artifact, not an
Atlas or a publication effect. After the public self-Edition passes semantic,
installed, browser, and accessibility acceptance, retire the legacy self-only
static, Atlas, and Candidate builders and the displaced live Atlas composer.
Then regenerate the truthful final self Candidate and obtain human visual
acceptance before release. Keep one public build path and one active
interactive-artifact contract; history remains recoverable from its immutable
release, not from a second current implementation.

Static and interactive scenes compile independently from the same selected
semantic obligations. A static overview may use carefully chosen aggregates
and visible relational text; interactive pages may reveal mechanisms and
source traces without downgrading their own complete reader questions. Each
medium has separate geometry, accessibility, artifact identity, quality
observations, and applicable human review. Raw imported files and private
source bytes are not embedded in public HTML by default. The editor and
custodian choose disclosure; Publisher checks the declared output inventory
and performs no ambient source publication.

For a selected authored LikeC4 structural view, the admitted parser supply may
also compute layout through its WASM backend. A distinct, bounded Worker
request returns geometry only after native import has resolved the same exact
source bytes. The parent validates that every positioned node and routed edge
maps back to the selected view's source-bound elements and relations; generated
edge IDs do not cross this boundary. Missing members, ambiguous source
locations, namespace-ambiguous native IDs, unrepresentable aggregation, or
uninterpreted dynamic views fail instead of becoming visible claims. The
geometry remains an unqualified,
replaceable projection. It is not part of the native semantic digest, does not
authorize a scene, and is not shared as coordinates between static and
interactive compilers. The selected view is copied before asynchronous parser
supply access, so a caller cannot retarget the in-flight request.

The first neutral static Scene joins that layout to one explicitly selected
Edition view. Its source carriers are the exact members required by that
medium's assertions, not every upstream-layout member. Assertion carriers use
source-qualified node and relation references, never a bare native ID that can
collide across namespaces; editorial prose stays
editor-attributed and unverified. A partially selected upstream edge cannot
stand for all of its relations. Content bounds are recomputed from retained
nodes and routes, so narrowing the Edition does not inherit unrelated canvas
space. Unsupported visual policy or ambiguous view choice fails by name.
This Scene remains an unqualified compilation input, not rendered SVG/PNG or
reader acceptance; interactive composition owns its own geometry and path.

For a selected Claim Model claim, the first neutral grammar is a typed reading
plate rather than an invented graph edge. Both media visibly distinguish
subject, predicate, object or value, plane, condition, scope, maturity,
validity, coverage, selected claimant, declared model owner, and declared
evidence authority. Identical values may be expressed once for an explicitly
identified group only when the grouping is exact and exceptions remain visible;
repeating the entire source record for every relation is not editorial
composition. Source-qualified IDs remain in private carrier maps. Static and
interactive plates have independent layout. Claim-only HTML does not load a
graph engine it does not use. Entity, relation, and mixed-model media were
unadmitted at this design baseline; later implementation status belongs only
in `tasks.md`. A compiled Scene or provisional Candidate is not flagship
visual acceptance.

For a structural Claim Model view with authored groups, first reuse the
existing Publisher-owned grouped geometry mechanism through a neutral input
boundary rather than adding another engine. Its AIGW v1 run positions twelve
selected entities and eleven relations without a new supply, but this does not
qualify a successor Scene or media. If the shared mechanism fails a named
geometry or authoring counterexample, compare one mature replacement on that
case and remove the displaced owner after parity. An unadorned relation arrow
does not prove a claim's plane, condition, scope, validity, or provenance. A
claim may instead share a compound visible carrier with its corresponding
relation if the two meanings are visibly distinguished, each required field
is expressed or explicitly limited, and each identity is bound independently
in the private carrier map. A geometry-specific failure can disqualify the
selected owner; an overloaded Edition or field-dump compositor cannot. Do not
add a public layout registry or keep multiple backends merely because one
composition was visually imperfect.

The next structural trial must preserve editorial decisions already made by
its source owner. A view may author ordered semantic groups of source-qualified
elements; group membership is a layout constraint over selected elements, not
a new source assertion or a list of pixel coordinates. If groups are present,
their members must partition that view's retained elements exactly. A label is
attributed to the Edition editor and cannot override an element's source role.
For a Claim Model relation and claim to share a visible carrier, the selected
claim must explicitly depend on that selected relation at the same source
revision. Endpoint resemblance alone is insufficient. The carrier must
separate topology from claim plane, condition, scope, validity, and provenance;
its private map binds the relation and claim identities independently. Exact
scalar claims instead depend on their declared subject entity. A mixed page
may show one as a separately bound subject-attributed claim card without
inventing a relation, provided both renderers preserve the typed value and
source identity and reject a forged subject dependency. A relation-valued
claim still requires the exact selected relation; a subject link cannot waive
that rule. AIGW's source-owned recommendation claim is the concrete
counterexample: the previous mixed-page path rejected it, tempting the editor
to disclose the claim only as a limit. The successor must carry that claim
visibly before the whole-product Edition can be accepted. Exact common values
may be factored into one visible, explicitly scoped legend. The
first neutral static grammar factors only exactly equal plane, condition,
maturity, validity, coverage, and claimant/owner context. Subject, predicate,
object/value, scope, and evidence authority stay on each claim even when equal,
so every claim retains a visible anchor. Exceptions stay attached to their
own carriers. Neither grouping nor factoring
changes semantic identity or grants source endorsement. Static and interactive
media compose these obligations independently.

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

### Mechanism subtraction

Keep a mechanism only when it owns a distinct invariant, trust boundary, or
consumer. If two steps consume the same selected bytes under the same authority
and establish the same fact, one step must go. A digest, cache, wrapper, or
receipt is not valuable merely because it is named. Prefer a mature mechanism
at its actual boundary, then remove the displaced custom owner after installed
parity; do not maintain both indefinitely.

This rule must not collapse different questions into one check. Exact input
identity and semantic equivalence, Candidate file integrity and source replay,
predicate observations and accepter policy, or a publication plan and its
recoverable effect each establish different facts. Nor may a stored result
authorize Provider execution: replay needs the caller's separate exact choice.

The concrete subtraction order is:

1. In the successor join, verify each Provider manifest once and pass the
   verified value to materialization. Keep defensive copies only where a
   mutation-isolation test proves the consumer needs them. Current-source
   installed tests assert contract and self-consistency; immutable release
   matrices, not rolling source tests, own historical byte-goldens. Consolidate
   repeated exact-field validators on a collision-safe key-set primitive;
   delimiter-joined field names are not a field-set proof.
2. Measure Edition parse/obligation repetition and LikeC4 semantic/layout
   parsing on the same frozen workload. Share a selected, immutable result only
   within one trust boundary and parser identity; never use an ambient cache to
   paper over changed source bytes or untrusted public inputs.
3. At replacement parity, delete displaced legacy render, browser, and
   publication paths rather than polishing their redundant scans or scope
   aliases. Retain one qualified optional local file-effect owner. A breaking
   successor may remove obsolete runtime protocols with a SemVer and migration
   note; preserve historical signed refs and accepted artifact bytes, not dead
   code in the new package.
4. At source-owned migration, replace ETHOS's temporary bundle-for-digest
   roundtrip and generic media pipeline with a minimal semantic Provider plus
   its authored Edition; replace AIGW's copied `_source` snapshots and
   self-materialization engine only after a truthful native source and complete
   AIGW acceptance path exist. Neither source migration grants Publisher
   domain authority.

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
admitted transformation checks when supported, domain/predicate verification, actual visual
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
   broken input or unadmitted transformation fails; mere disagreement
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
