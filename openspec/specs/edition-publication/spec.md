# edition-publication Specification

## Purpose

Define an Edition as an editor-owned audience, question, selection, and
presentation contract over attributed claims from one or more source owners.
Compilation yields one paired Candidate with independently composed media;
source, editor, verifier, accepter, and custodian authorities remain distinct.

## Requirements

### Requirement: Edition is a complete authored contract

One editor-owned Edition Project SHALL select audience, questions, source
addresses and references, question-scoped assertions, limits and omissions,
attributed editorial assertions, narrative, and separate static and interactive
obligations. The Build Request, not the Project, selects source revisions and
requested media. Each selected assertion SHALL appear in its promised view or
have an allowed omission; unselected facts need not be enumerated.

#### Scenario: An editorial assertion is added

- **WHEN** an Edition states a cross-source relationship or conclusion not
  asserted by either source
- **THEN** it names the editor as proponent and identifies its selected basis
- **AND** it does not appear as source-approved fact

#### Scenario: An Edition omits a source claim

- **WHEN** a selected source assertion is absent from a view promising its
  reader question
- **THEN** its omission must be classified as covered in another answering
  view of the same medium or as an explicit limit on that answer
- **AND** unrelated, unselected source facts do not create exhaustive-graph
  obligations

#### Scenario: An Edition changes source meaning

- **WHEN** selected source identity or typed Claim Model rules establish an
  incompatible fact, or an authored group violates its declared forbidden pair
- **THEN** compilation rejects that exact contradiction before Candidate
- **AND** a later renderer cannot waive it by painting the same IDs

#### Scenario: Free wording seems to contradict a bound source claim

- **WHEN** an editor writes a stronger unsupported statement while retaining
  the exact source references
- **THEN** each selected public medium visibly attributes the wording to the
  editor and marks it unverified
- **AND** build success does not certify the wording, source endorsement, or
  human acceptance

### Requirement: Free editorial framing is visibly attributed

A successor Edition build SHALL visibly identify the editor of free title and
summary text in every selected public medium, and state that the medium itself
does not evidence source endorsement. Build success SHALL NOT establish source
endorsement of that wording.

#### Scenario: An independent editor writes an official-sounding heading

- **WHEN** an editor distinct from the selected source claimant writes a title
  or summary that suggests official source endorsement
- **THEN** the static SVG/PNG and interactive HTML visibly identify the editor
  and state that source endorsement is not evidenced by the diagram
- **AND** the Candidate remains unqualified until the applicable semantic and
  human review, without treating the heading as a source-backed assertion

### Requirement: Generic inputs are explicit and repository-independent

The successor Build Request SHALL be a versioned, schema-validated JSON
manifest selecting one Edition project, one or more source selectors or exact
pins, requested media, and a qualified toolchain profile. The installed build
SHALL not need ETHOS, Git, adjacent checkouts, network, product-specific
branching, or an unselected source adapter. Existing Source Bundle v1, Claim
Model v2, Edition v1, and Provider v1 inputs SHALL remain replayable under
their original meanings.

#### Scenario: Standard inputs are relocated

- **WHEN** valid Source Bundle v1, Claim Model v2, Edition v1, and build request move
  together with the same selected package to a machine without their source
  repository or provider
- **THEN** the installed core produces the same candidate bytes offline
- **AND** a changed selected byte fails identity verification rather than being
  rediscovered from the environment

#### Scenario: Provider materialization precedes build

- **WHEN** a build request selects an admitted Edition Provider manifest
- **THEN** provider materialization emits only the selected version's admitted
  inputs before the existing Edition build begins
- **AND** the provider result makes no compilation, qualification, acceptance, or
  publication claim

### Requirement: Concrete Edition authority follows declared roles

Publisher SHALL own the universal input, Edition, Candidate, qualification,
and optional local publication contracts. Each source or format owner SHALL
retain authority over its native model and domain vocabulary. The designated
Edition editor SHALL own the specific audience, reader questions, scope,
selection, attribution, and art direction, whether or not that editor shares a
repository with a source.

#### Scenario: A source product publishes an Edition package

- **WHEN** a source product is also the named Edition editor and its package
  emits valid portable inputs through the public Provider contract
- **THEN** Architecture Publisher can build and qualify them without source-repo
  discovery or product-specific branches
- **AND** Publisher records do not authorize or reinterpret the source product

### Requirement: Candidate, qualification, and publication are distinct values

Compilation SHALL emit a Candidate bound to exact materialized inputs,
Edition, selected semantic carriers, independent media, renderer supply, and
artifact identities. Qualification SHALL emit predicate-specific evidence
naming the exact subject, verifier, method, scope, result, and limit. Local
publication SHALL require exact authorization and emit an effect/recovery
receipt; hosted publication and custody SHALL be separate owner-observed
states.

#### Scenario: Compilation succeeds before qualification

- **WHEN** both media are rendered and their candidate manifest is complete
- **THEN** the result reports a built candidate rather than a publication
- **AND** it makes no browser, accessibility, human-review, authorization,
  installation, hosted-availability, or release claim

#### Scenario: Qualification is admitted against exact authority

- **WHEN** a qualification request selects exact locked native or Claim Model
  inputs, Edition, Candidate, and Qualification Set bytes
- **THEN** admission rederives Candidate scene membership and obligations from
  those selected inputs and Edition before evaluating the records
- **AND** a bare Qualification Set or a Candidate with copied or forged authority
  is rejected rather than treated as accepted evidence

#### Scenario: Qualified bytes are installed

- **WHEN** a publication plan binds an exact candidate, applicable qualification
  records, destinations, preservation state, and explicit authorization
- **THEN** apply or recovery emits a receipt for that bounded filesystem effect
- **AND** the receipt does not imply hosted availability or release publication

### Requirement: Static and interactive scenes are independent projections

An Edition SHALL author static and interactive scenes independently. They SHALL
share semantic identities and coverage obligations but SHALL NOT share required
coordinates, DOM structure, page shape, or renderer-specific layout data.

#### Scenario: A static composition changes without semantic change

- **WHEN** only the static scene is revised
- **THEN** interactive artifact identities remain unchanged
- **AND** the static artifact receives fresh medium-specific qualification

#### Scenario: An interactive atlas expands a mechanism

- **WHEN** a complete overview links to a mechanism page
- **THEN** the mechanism page remains a complete intelligible view of its named
  question rather than a detached fragment
- **AND** the overview remains understandable without opening that page

### Requirement: Interactive inspection preserves selected meaning

Standalone interactive media SHALL provide a reversible reading state for
selected meaning. Its subject index SHALL reach every visible graphic and every
selected record without a page-wide record dump or a panel covering only part
of the diagram. Keyboard entry and return SHALL preserve a useful focus target.

#### Scenario: Reader inspects a diagram subject

- **WHEN** a reader opens inspection from a diagram subject or the chapter header
- **THEN** the subject index reaches every selected record without dropping one
- **AND** the complete diagram remains available on return at the same chapter
- **AND** a keyboard reader returns to the invoking subject or header control

### Requirement: Source identity is not source content

Interactive inspection SHALL label a selected source's namespace, claimant, and
exact digest as provenance metadata. It SHALL distinguish that identity from
source bytes and verified domain truth. Without a source-owner-supplied
verifiable locator, Publisher SHALL NOT offer a source-code pane or inferred
file or network link.

#### Scenario: A standalone work has no source-code link

- **WHEN** the exact selected source identity is available but source bytes and
  an owner-supplied locator are not part of the interactive work
- **THEN** inspection presents the identity and its scope without a dead-end
  source-code control or an invented path
- **AND** the Candidate manifest and input lock remain the exact audit carriers

### Requirement: Edition classes expose different promises

The product SHALL distinguish `structural` Editions from `flagship` Editions.
A structural Edition promises deterministic source-bound completeness and
technical readability. A flagship Edition additionally promises deliberate art
direction, reader-tested hierarchy, and human visual acceptance.

#### Scenario: A structural example passes automated checks

- **WHEN** a structural Edition satisfies its declared machine checks
- **THEN** it may be published as a structural example
- **AND** it SHALL NOT be described as flagship or aesthetically approved

### Requirement: Evolution is conservative and approval preserving

Evolution SHALL distinguish changed source bytes, supported meaning, unknown
or uninterpreted meaning, editorial selection, media composition, and
packaging-only bytes. Declared dependencies and finite materialized view
membership SHALL identify affected questions, views, media, and qualification
predicates. Unknown dependency or ambiguous lineage SHALL broaden obligations.

#### Scenario: A claim changes without changing graph cardinality

- **WHEN** a claim changes plane, condition, scope, maturity, value, or provenance
- **THEN** every dependent view is marked affected
- **AND** previous semantic, visual, browser, and human approval is not reused

#### Scenario: Generated output is edited

- **WHEN** a generated SVG, PNG, or HTML file differs from the exact artifact
  identity bound by its selected Candidate manifest
- **THEN** qualification rejects that changed file as an unowned projection
- **AND** an explicitly selected new renderer, font, or toolchain may instead
  produce a new Candidate with fresh applicable qualification without requiring
  an unrelated Edition authoring change

### Requirement: Edition project root and derived identity

An Edition project SHALL select an exact root without requiring a copy of
every native source fact or authored pixel geometry. Publisher SHALL derive
its lock and Candidate identities from the selected bytes; authors SHALL NOT
maintain Publisher-generated source hashes or seals as editorial truth.

#### Scenario: An editor works outside a source repository

- **WHEN** one Edition project selects exact inputs from two source namespaces
  while living in a separate directory
- **THEN** its reader questions and choices belong to the named editor
- **AND** each source retains its own claimant, revision, and native authority

### Requirement: Edition and source selector protocol

The Edition project SHALL use a versioned authoring manifest plus selected
native files or assets, not a Publisher seal edited by hand. Each source
selector SHALL identify namespace, native format and version, claimant,
revision evidence, and a portable local locator or pin. Unknown protocol
fields SHALL fail rather than silently acquire meaning.

#### Scenario: An author supplies a native source

- **WHEN** a Build Request selects a native LikeC4 file, an Edition authoring
  manifest, and a supported toolchain
- **THEN** Publisher derives exact materialized-input and Candidate identities
  without requiring the author to copy the source into a Claim Model JSON file
- **AND** the author does not hand-edit Publisher-generated hashes or seals

#### Scenario: A mixed-source request is relocated

- **WHEN** exact pinned native inputs and an Edition project are relocated with
  an installed Publisher package
- **THEN** the same supported Candidate can be compiled offline without the
  original source repositories or Providers
- **AND** changed selected bytes fail pin verification

### Requirement: One materialized Edition selection

Direct inputs and zero or more selected Providers SHALL converge on the same
materialized input lock before the public Edition build. Direct Edition
selection names an authoring filesystem root and manifest; Provider Edition
selection names the sole authored Edition item supplied by one exact selected
Provider. Both are one semantic Edition selection, not two competing roots or
an implicit filesystem lookup.

#### Scenario: Edition selection is ambiguous

- **WHEN** two selected Providers or direct inputs each offer a conflicting
  Edition project root without an exact Build Request choice
- **THEN** preparation fails instead of merging scope, questions, or omissions

### Requirement: Candidate destination is invocation evidence

The successor Build Request SHALL NOT contain an output directory or release
target. The single `archpub edition build` invocation SHALL require a fresh
explicit Candidate output directory and reject missing or conflicting
destinations before output effects. That directory SHALL be invocation
evidence, not part of the source or Edition lock or Candidate semantic
identity. Existing v1 build-plan output fields and meanings SHALL remain
unchanged; no successor flag SHALL silently override them.

#### Scenario: The same meaning is built in two locations

- **WHEN** the same exact successor Build Request is compiled into two fresh
  directories selected by separate invocations
- **THEN** the materialized meaning and Candidate artifact identities remain
  equal when all selected compiler inputs are equal
- **AND** each output effect retains its own location evidence without
  becoming acceptance or publication

#### Scenario: A successor output destination is missing

- **WHEN** an `archpub edition build` invocation selects a successor Build
  Request but no explicit Candidate output directory
- **THEN** the command fails without choosing a hidden repository-local path
  or creating output

### Requirement: Accepter and custodian retain distinct roles

The designated accepter and custodian SHALL own their respective decisions.
Co-location SHALL NOT merge these roles, and a central mutable migration copy
SHALL NOT remain a parallel authority.

#### Scenario: A source maintainer edits the Edition

- **WHEN** the source maintainer is also the named Edition editor
- **THEN** both roles may be exercised by that actor under the selected policy
- **AND** the resulting publication still distinguishes source assertion,
  editorial choice, verification, and acceptance

#### Scenario: An independent editor publishes a comparison

- **WHEN** an Edition compares target and observed claims from two owners
- **THEN** each source claim remains attributed to its owner and revision
- **AND** the comparison's new judgments are attributed to the editor rather
  than implicitly endorsed by either source

### Requirement: Candidate acceptance is explicit

An acceptance policy and named accepter SHALL decide whether submitted
qualification evidence admits the Candidate; Publisher SHALL not infer
approval from a green build, same-person signature, or file location.

#### Scenario: A maintainer reviews their own Candidate

- **WHEN** the selected acceptance policy permits author and reviewer to be
  the same person
- **THEN** a decision by that person may be recorded against exact Candidate
  bytes
- **AND** it is not described as an independent implementation verifier

#### Scenario: A Candidate passes automated geometry checks

- **WHEN** geometry and browser checks pass but visual faithfulness or domain
  truth has not been assessed
- **THEN** only those automated predicates pass
- **AND** the Candidate receives no inferred domain or flagship acceptance

### Requirement: Successor Candidate manifest binds selected supplies

Candidate v2 SHALL bind input lock, Edition, semantic digest, selected checked
semantic supplies, and each medium's independent Scene, artifacts and checked
supplies. Supply records SHALL state identity, basis and method; checked file
sets are not execution traces. Publisher semantic and media file sets remain
distinct. Unselected implementations, package-only content and output paths
stay outside Candidate identity. Reader obligations and limits remain visible.

#### Scenario: One selected input produces two sibling media

- **WHEN** a successor Build Request selects static and interactive media and
  the same materialized inputs are built at two fresh output locations
- **THEN** the two builds have identical Candidate and artifact identities
- **AND** the static SVG/PNG and interactive HTML have distinct Scene hashes,
  artifact hashes, and medium-specific supplies without shared coordinates or
  DOM ownership

### Requirement: Source-to-graphic maps are trace carriers

Each medium SHALL bind the digest of a private source-to-graphic carrier map
without placing raw source identifiers in public static or interactive media.
The map is traceability evidence, not proof that the corresponding words and
shapes are painted or understood. Source assertion carriers SHALL retain
source-qualified identities so same-ID members of distinct namespaces cannot
collapse into one assertion.

#### Scenario: Two sources reuse one local identifier

- **WHEN** selected source assertions have the same local ID in distinct
  namespaces
- **THEN** each private carrier binding retains its source-qualified identity
- **AND** public media need not expose the raw source identifiers

### Requirement: Candidate structure is not source approval

Structural validation of a Candidate manifest SHALL NOT grant source
authority, visible coverage, qualification, or acceptance.

#### Scenario: A self-consistent Candidate container borrows authority

- **WHEN** a Candidate container has internally matching file hashes but its
  Candidate value, Edition, or selected source differs from the exact Build
  Request under review
- **THEN** byte replay under the current installed Publisher package rejects
  that Candidate before qualification records are admitted
- **AND** a matching replay is reported only as current-runtime byte
  equivalence, not original-builder attestation, independent semantic proof,
  visual approval, acceptance, or publication

### Requirement: Requested media form one complete Candidate

A hard failure in any requested medium SHALL NOT emit a complete Candidate for
the other medium.

#### Scenario: A later medium fails

- **WHEN** one requested medium has rendered but another requested medium fails
- **THEN** no complete Candidate output directory is emitted
- **AND** temporary owned render inputs are removed without deleting foreign
  output state

### Requirement: Layout evolution does not transfer approval

A cached or authored layout whose layout-affecting inputs change SHALL be
recomputed within constraints or returned for editor review. No regeneration
SHALL silently transfer prior acceptance; policy MAY admit a new-byte decision
on explicit unchanged-meaning and unchanged-visual evidence.

#### Scenario: Only package metadata changes

- **WHEN** selected architecture meaning and media bytes remain unchanged but
  distribution bytes change
- **THEN** semantic redraw is not required solely for that packaging change
- **AND** package and release evidence is refreshed for the new bytes

#### Scenario: A view selector changes membership

- **WHEN** a new claim enters a selected predicate or an old claim leaves it
- **THEN** the exact materialized membership and applicable media identities
  change before layout
- **AND** acceptance of the old membership does not transfer silently

### Requirement: Edition reading order has one owner

Authors SHALL NOT maintain a second source-assertion list or a duplicate
reading-order list. Medium views SHALL own page order; each view's question
list SHALL own within-page order. The top-level questions SHALL own
definitions and default listing order.

#### Scenario: A second authored reading-order list disagrees

- **WHEN** an author adds a parallel source-assertion or reading-order list
- **THEN** the Edition rejects or ignores that list rather than treating it as
  another authority for view or question order

### Requirement: Executable Provider replay requires invoker selection

The verifier and public replay primitive SHALL inspect exact selected Provider
manifests before replay and SHALL NOT execute an executable Provider based on
evidence-supplied permission. The invoking verifier SHALL separately select
the exact executable Provider ID and manifest-digest set. This Provider replay
boundary is not a sandbox for arbitrary detached descendants created by
Provider code.

#### Scenario: Qualification would execute selected adopter code

- **WHEN** a pinned Build Request selects an executable Provider but the
  invoking verifier does not separately choose that exact Provider set
- **THEN** verification fails before Provider code runs or records are admitted
- **AND** an evidence-supplied execution choice alone cannot launch code
- **AND** an execution choice is not represented as a sandbox or publication
  authorization

### Requirement: Qualification replay has one bounded supervisor

The v2 verifier SHALL start one monotonic deadline before selected reads and
supervise Publisher-owned worker groups or ordinary trees through replay and
record binding. Selected worker code SHALL NOT start before ownership
registration is acknowledged. Expired work, missing registration, or unproved
cleanup SHALL yield no passing result or record admission; uncertain scratch
SHALL be retained. A Provider-local timeout alone is insufficient.

#### Scenario: Candidate replay exceeds its total deadline

- **WHEN** envelope reading, Provider execution, parsing, or rendering exceeds
  the v2 qualification invocation deadline
- **THEN** the verifier stops admission and attempts bounded cleanup of only
  registered owned workers and scratch proved unused
- **AND** unproved cleanup retains uncertain scratch and reports its limit
- **AND** no record or passing qualification result is emitted

#### Scenario: The Windows supervision root exits before cleanup

- **WHEN** the selected root exits before ordinary-tree termination can prove
  descendant cleanup
- **THEN** verification reports `cleanup_unproved` without record admission
- **AND** it does not claim that descendants were reclaimed or remove scratch
  that may still be in use

### Requirement: Qualification records bind exact scopes

The Qualification Set SHALL bind the exact Candidate and materialized input
lock; each record SHALL identify a predicate, selected subject and applicable
scope, verifier and implementation identity, observations, verdict, and
limits. View/question and assertion scopes SHALL include the selected medium
even when view and question IDs happen to match across media.

#### Scenario: Individually valid scope IDs form an invalid pair

- **WHEN** a record names an existing medium, view, and question that the view
  does not ask, or claims a source assertion omitted from that view/question
- **THEN** the record cannot satisfy the absent question or assertion obligation
- **AND** a second Provider reply cannot replace the replayed Edition scope

### Requirement: Record scopes derive from replayed authority

Publisher SHALL reject records whose medium, view/question pair, selected
assertion in that pair, artifact, subject, or identity is absent from the
replay-derived Edition and Candidate. It SHALL NOT rematerialize a Provider
merely to rederive record scopes or trust unreplayed Candidate obligation
arrays as Edition authority.

#### Scenario: PASS records omit a promised reader question

- **WHEN** submitted PASS records cover only some selected Edition
  view/question scopes, or claim a scope absent from the Candidate
- **THEN** the result identifies missing valid scopes or rejects invented ones
- **AND** neither case becomes a complete qualification or acceptance claim

### Requirement: PASS attribution is not authentication

A PASS value SHALL remain a submitted attribution to a named verifier, not
proof that the named verifier asserted it or that Publisher executed or
authenticated the method. Without an exact named policy selected by the
designated accepter, Publisher SHALL NOT report qualification completeness,
admission, or acceptance, even if every submitted record says PASS.

#### Scenario: A record impersonates a verifier

- **WHEN** a submitted PASS record names a verifier without authenticated
  provenance or an explicit accepter-owned trust decision
- **THEN** Publisher reports only the record's attribution, not that the named
  verifier actually made or independently proved the claim

#### Scenario: Author and reviewer are the same person

- **WHEN** an exact accepter-owned policy permits that person to review one
  selected artifact and their attributed judgment names its digest
- **THEN** Publisher may bind the review as human evidence under that policy
- **AND** the reviewer identity remains a submitted attribution unless
  authenticated or explicitly adopted by the accepter
- **AND** the record is not described as an independent implementation check

### Requirement: Policy fit is not authorization

Publisher SHALL distinguish missing, non-PASS, unselected, and
unaccepted-limit records against the invoker-selected exact policy. A
policy-fit PASS set is only an attributed submission: without authenticated
verifier provenance or an explicit accepter-owned trust decision, Publisher
SHALL NOT call it independently verified, accepted, admitted, or published.
Policy selection via the generic CLI alone SHALL NOT assert that the claimed
accepter authorized it.

#### Scenario: Selected policy lacks one reader question

- **WHEN** an exact policy omits a required view/question scope, or submitted
  records omit one policy requirement
- **THEN** the missing policy scope is rejected or the missing submitted record
  is reported without a complete policy-fit claim
- **AND** a record from another medium, verifier, or method cannot substitute

### Requirement: Omission targets are closed

An omission SHALL identify its medium, declared source view, selected source
reference, question, disposition, and reason. `covered-elsewhere` SHALL target
a distinct declared view in the same medium that asks the affected question
and does not omit the same source reference for that question.
`outside-question` SHALL NOT be used for a view that asks the affected
question.

#### Scenario: An omission points to an absent or non-answering target

- **WHEN** an omitted source reference is marked `covered-elsewhere` but the
  target is absent, belongs only to another medium, does not ask the question,
  or itself omits the same reference
- **THEN** authoring validation rejects it before layout

### Requirement: View obligations derive before layout

Structural admission SHALL NOT claim that a target view visibly communicates
an assertion; that remains a separate qualification obligation. Before layout,
Publisher SHALL derive each selected view's declared assertion and
explicit-limit obligations from the selected Edition Project. An omission
SHALL remove only matching source assertions for its medium, view, and
question; it SHALL NOT remove an editorial assertion or silently weaken
another view or medium.

#### Scenario: An overview omits a source assertion carried by a detail view

- **WHEN** the selected Edition classifies the source assertion as
  `covered-elsewhere` in one view and the detail view retains it
- **THEN** only the overview's declared source obligation is removed
- **AND** the detail view and medium remain bound to the assertion

### Requirement: Historical input reinterpretation requires migration

Any reinterpretation of valid v1 input SHALL require an explicit successor
Edition and Provider contract and consumer migration. Historical signed
manifests and artifacts SHALL remain unchanged.

#### Scenario: A successor changes a valid v1 interpretation

- **WHEN** a successor would assign a different meaning to previously valid
  Edition v1 or Provider v1 input
- **THEN** it uses an explicit successor contract and consumer migration
- **AND** historical signed manifests and artifacts remain unchanged

### Requirement: Generic styling does not depend on adopter name

Generic code SHALL NOT choose font, palette, group capacity, or raster width
by source-product name. Historical v1 output rules SHALL remain truthfully
classified.

#### Scenario: Two Editions require different presentation

- **WHEN** two valid Editions select different visual policies or bounded
  raster widths
- **THEN** each Candidate carries its own policy and output identities
- **AND** the generic compiler uses no adopter-name branch

### Requirement: Edition scope distinguishes native and derived inputs

An Edition project SHALL name its selected native source namespaces and only
the derived projection namespaces it intends to address. It SHALL NOT have to
repeat unused Provider outputs. Each source assertion SHALL resolve through
one declared, exact-lock-bound namespace. An undeclared projection, missing
native ancestor, or ambiguous namespace SHALL fail before a Candidate is
emitted. An Edition with no derived references MAY omit the empty list.

#### Scenario: Executable adaptation supplies an Edition assertion

- **WHEN** an Edition references an attributed projection derived from exact
  native input bytes
- **THEN** its assertion binds the projection namespace and ancestry without
  claiming that the projection is unchanged native or source-endorsed fact

### Requirement: Source assertion authorship has one owner

In the unreleased Edition Project, a selected source reference with declared
reader questions SHALL compile into one required source assertion using that
selection's ID. A selection without reader questions SHALL remain
context-only. Separately attributed editorial assertions SHALL name their
proponent and selected basis.

#### Scenario: A source relation answers two questions

- **WHEN** one selected relation declares two reader questions
- **THEN** both applicable views derive the same source assertion identity
- **AND** a change to that reference requires one authored edit, not a copied
  selection and assertion update

#### Scenario: Context-only evidence is selected

- **WHEN** a selected reference has no reader questions and is used as an
  editorial assertion's basis
- **THEN** it adds no source-visible obligation by itself
- **AND** the editorial assertion remains attributed to its proponent

#### Scenario: A context-only basis is retargeted

- **WHEN** its selected reference changes but source bytes and editorial text do not
- **THEN** affected editorial views require medium and human review again
- **AND** their prior qualification is not inherited by stable assertion ID

#### Scenario: Coverage is claimed elsewhere

- **WHEN** an omission says a selected reference is covered in another view
- **THEN** that reference SHALL yield a source assertion for that question
- **AND** the target view SHALL retain that source assertion

#### Scenario: Editorial attribution reaches readers

- **WHEN** an editorial assertion is emitted in static and interactive media
- **THEN** each public medium SHALL visibly identify its proponent and unverified status

### Requirement: Authoring controls have an implemented consumer

The initial unreleased Edition Project SHALL admit exact source references but
SHALL reject query selections and authored transformation declarations at
input validation. An editorial assertion SHALL remain an attributed proposal
with an exact selected basis; it SHALL NOT acquire source authority by being
called a transformation. A future query or rule requires a new versioned
contract and an executable consumer before admission.

#### Scenario: Unsupported control is authored

- **WHEN** an author selects a query or adds a transformation field
- **THEN** Edition validation fails before native import or Candidate effects
- **AND** no default query engine or guessed transformation is invoked

### Requirement: Successor qualification records are policy-bound claims

A versioned successor qualification input SHALL select exact Build Request,
Candidate container, and Qualification Set bytes through the existing `archpub
qualify verify` route. Candidate replay SHALL precede record admission. Every
JSON value selected by the v2 route, including the v1-format Source Bundle
manifest carrying the Candidate, SHALL reject duplicate object keys without
redefining historical v1 readers. Historical v1 qualifications SHALL retain
their original meaning.

#### Scenario: Selected JSON contains duplicate keys

- **WHEN** a v2 qualification input, Qualification Set, or Candidate container
  manifest has duplicate object keys despite a matching file digest
- **THEN** verification rejects the ambiguous bytes before record admission

### Requirement: Invoker-selected qualification policy remains attributed

An invoker MAY select an exact versioned policy file separately from the three
v2 evidence selectors. The policy SHALL name its claimed accepter, exact
Candidate digest, accepted Candidate limits, and a finite set of required
predicate/scope/verifier/method tuples with permitted record limitations.
Submitted evidence SHALL NOT select or alter that policy. Every selected
view/question SHALL have a required question-scoped predicate.

#### Scenario: Evidence attempts to choose its own policy

- **WHEN** a v2 Qualification Set or input embeds a policy or alters the
  invoker-selected policy digest
- **THEN** the extra field or changed digest is rejected before record assessment
- **AND** no submitted PASS becomes an acceptance claim

### Requirement: Edition views and omission targets are closed

An Edition Project SHALL declare an ordered, nonempty set of uniquely named
views for each medium. Each view SHALL name at least one declared reader
question. The questions promised by a medium SHALL be derived from its views,
not maintained as a second authored list. A view that asks a question but has
neither a remaining assertion nor an explicit limit SHALL fail selection.
Per-medium obligations SHALL be the derived union of its selected views, not a
second authored list.

#### Scenario: The same view name is reused in both media

- **WHEN** static and interactive Editions each declare an `overview` view
- **THEN** each view is identified within its medium without a duplicate
  media-question authority

### Requirement: Static views compose one faithful figure

Selected static views SHALL yield one complete-page SVG and PNG, each retaining
questions, assertions, reader-question limits, source-status qualifiers and
graphic-carrier bindings. Views SHALL remain distinct without inventing
cross-view relations or transferring claims or acceptance. Text, structural
marks, annotation and decoration SHALL fit without clipping, occlusion, overlap
or inadequate clearance. Missing carriers fail before Candidate; graph-only
layout success is insufficient.

#### Scenario: Two static views answer distinct questions

- **WHEN** an Edition selects two static views with distinct questions and
  source assertions, including one source entity present in both views
- **THEN** one static SVG and PNG visibly distinguish both views and retain
  each view's own assertion-to-graphic carriers and limits
- **AND** no edge or endorsement is inferred merely from the shared entity

#### Scenario: Claim Model structure has no authored groups

- **WHEN** a static view selects Claim Model entities or relations and the
  editor declares no visual groups
- **THEN** Publisher uses its selected bounded structural geometry to render
  every required entity, relation, direction, and qualifier without inventing
  group membership or printing a reading-group key
- **AND** unsupported or infeasible geometry fails before Candidate rather
  than requiring a dummy authored group or dropping a source assertion

#### Scenario: One neutral raw-structure view retains the complete figure grammar

- **WHEN** exactly one unrefined static view selects source entities or
  relations without selecting Claim cards for that view
- **THEN** its question leads one complete figure containing its exact graph,
  relation explanation, source status, and declared limits
- **AND** absence of authored groups does not switch to a separate side-rail
  composition or imply that an unreviewed result is visually accepted
- **AND** a selected upstream authored view without editorial groups retains
  its source-view composition instead of being mistaken for raw structure

#### Scenario: Neutral peer nodes have unequal label lengths

- **WHEN** the selected Dagre adapter composes source nodes with different
  label lengths in one structural view
- **THEN** it measures one sufficient node width for that view, rounds the
  box to its 32-unit grid, and gives every peer the same width and height
- **AND** same-rank left edges align while relations and captions are routed
  against the resulting boxes, not the former varying widths
- **AND** a regular-row Dagre candidate is preferred when every caption clears
  every route; a caption-clearance failure may select the balanced Dagre
  candidate, with its own routes and captions recomputed
- **AND** if neither candidate clears its captions, composition fails rather
  than shrinking text or moving nodes after layout without updating edges

#### Scenario: Method evidence does not become figure copy

- **WHEN** an Edition's selected source and compiler have method or
  dependency-closure limitations that do not alter a promised reader answer
- **THEN** the static SVG and PNG retain reader-question limits and source
  status without printing raw method-limit identifiers as a diagnostic ledger
- **AND** the Candidate retains the exact limitations for inspection and
  qualification, without implying that their absence from the art clears them

#### Scenario: An unsupported construct affects the answer

- **WHEN** a selected reader question depends on source meaning that its
  admitted interpreter cannot preserve
- **THEN** compilation fails before Candidate rather than suppressing the
  limitation in the figure and claiming complete coverage

#### Scenario: A view forbids two selected members in one visual group

- **WHEN** its Edition declares a reasoned forbidden pair of source-qualified
  members and an authored group contains both
- **THEN** Publisher rejects that medium before layout
- **AND** an unselected or duplicate unordered pair fails rather than being
  treated as source authority or silently ignored

#### Scenario: One authored static canvas covers ordered views

- **WHEN** an editor selects one data-only authored static scene for two or
  more ordered static views
- **THEN** Publisher binds the complete scene to the union of their selected
  source assertions and retains each view's own assertion attribution
- **AND** the scene is rendered through the ordinary static SVG and PNG path,
  not accepted as pre-rendered media
- **AND** absent, duplicated, or extra source meaning fails rather than being
  repaired by dropping a view, forging a cross-view relation, or reusing an
  unrelated graphic carrier

#### Scenario: Authored static wording retains source identity

- **WHEN** an authored canvas changes visible wording while retaining the same
  source-qualified graphic bindings
- **THEN** the Candidate declares authored text meaning unverified
- **AND** exact membership and geometry checks do not certify the wording as a
  source assertion or turn the unqualified Candidate into accepted media

#### Scenario: A structural overview does not inherit sibling Claim coverage

- **WHEN** a static view selects source entities and relations but no Claim
  facts, while interactive views select the source Claim facts
- **THEN** the static figure binds and renders its selected structural
  assertions without claiming to paint the unselected Claim facts
- **AND** interactive Claim coverage cannot be transferred to the static
  figure or treated as a shared approval

#### Scenario: A selected relation supplies its endpoint members

- **WHEN** an authored static canvas selects a source relation without separate
  entity selections for its exact endpoints
- **THEN** Publisher admits those source-bound endpoint members as visible
  nodes without requiring duplicate Edition selections
- **AND** an unrelated or source-inconsistent entity still fails

#### Scenario: One static view cannot be represented

- **WHEN** any selected static view cannot fit without structural loss or
  overlap in the composed figure
- **THEN** no complete static Candidate is emitted
- **AND** Publisher does not silently drop or shrink that view to force a pass

#### Scenario: Text clearance dimensions remain distinct

- **WHEN** a source-selected quality rule specifies clearance between text and
  non-owner geometry but does not specify a text-to-text gap
- **THEN** the scene audit applies that distance only to the selected geometry
  predicate and still rejects actual glyph overlap
- **AND** it does not infer the same numeric distance for text pairs
- **AND** a successor authored canvas retains its separately selected
  text-to-text clearance floor

#### Scenario: Editorial groups interleave in causal placement

- **WHEN** a source-authorized static view assigns each selected node to one
  editorial group but a compact causal layout interleaves those groups
- **THEN** Publisher preserves every group label and exact member list in a
  reading key outside the causal graph
- **AND** it does not paint a floating group heading or enclosure that could
  imply a different membership or invent a source relation
- **AND** missing, duplicate, or visually ambiguous members fail with a named
  diagnostic rather than being omitted or silently reassigned

#### Scenario: Compactness conflicts with legibility

- **WHEN** two layouts carry the same selected assertions and one reduces
  empty area only by shrinking text or increasing collisions or crossings
- **THEN** Publisher does not choose that layout solely for its smaller canvas
- **AND** human review of visual hierarchy and unused space remains required

### Requirement: Historical Edition and Provider contracts remain truthful

Previously valid Edition v1 and Provider v1 inputs SHALL retain their selected
source meaning, omission policy, scene meaning, and identity-only
`authoredInputSha256` interpretation. A successor SHALL NOT claim that this
legacy digest proves media-input consumption. A changed v1 default SHALL be
identified as either correction of a proven contract violation or a versioned
successor behavior.

#### Scenario: A v1 Edition is replayed

- **WHEN** unchanged valid v1 inputs are selected by the successor package
- **THEN** their semantic choices and identity-only authoring digest retain
  their prior meaning
- **AND** fresh output qualification is not misrepresented as historical
  approval

### Requirement: Authored rendering dependencies are truthfully bound

If an Edition selects exact authored media bytes, the Candidate SHALL identify
them, prove that the selected renderer consumed them, and bind the affected
artifact identity. A digest used only for edition identity SHALL be labeled
identity-only and SHALL not satisfy media provenance or visual qualification.
An absent, unreadable, changed, or unselected required rendering dependency
SHALL fail before successful Candidate emission. Static and interactive
consumption SHALL be tracked independently.

#### Scenario: Static authoring changes alone

- **WHEN** only selected static authoring bytes change
- **THEN** the static artifact and its applicable qualification obligations
  change
- **AND** unchanged interactive composition remains independently identifiable

#### Scenario: A declared digest is not consumed

- **WHEN** an Edition supplies a digest but no selected media build consumes
  its corresponding bytes
- **THEN** the digest is reported as identity-only
- **AND** no qualification claims that those bytes shaped the output

### Requirement: Edition-selected visual policy governs generic media

The Edition editor SHALL select required visual grammar, typography and font
supply, density and layout constraints, and bounded output dimensions, or an
explicit documented neutral profile. Publisher SHALL provide a readable
complete-for-question baseline without requiring adopter renderer code, a
second model, or manual pixel geometry. Unsupported selected policy SHALL fail
rather than silently substitute style or drop meaning.

#### Scenario: A neutral first build is requested

- **WHEN** a maintainer supplies admitted native sources and reader questions
  without renderer code or pixel coordinates
- **THEN** Publisher offers a readable baseline and explainable suggestions
  for the same Edition project
- **AND** suggested grouping or geometry does not become source truth or a
  parallel editorial intent store

#### Scenario: One medium is intentionally neutral beside authored refinement

- **WHEN** a selected data-only refinement explicitly chooses authored
  composition for one requested medium and `neutral` for its sibling
- **THEN** Publisher compiles each medium through its selected path and checks
  its visible obligations independently
- **AND** changing either medium's decision does not alter the sibling Scene
  identity or visible artifact bytes, even when both media are authored
- **AND** neither medium transfers its qualification to the other
- **AND** a missing or extra medium, unsupported choice, or all-neutral no-op
  resource fails rather than falling back without an editorial decision

#### Scenario: A policy is unsupported

- **WHEN** no qualified renderer can honor a selected required font, semantic
  distinction, layout constraint, or output dimension
- **THEN** compilation fails with a specific unsupported-policy diagnostic
- **AND** it does not emit an apparently qualified substitute

### Requirement: Installed package identity is separate execution evidence

Successor build and replay SHALL report the current installed Publisher package's
declared content-tree identity, method, and scope outside the lock and
Candidate. Package drift detected before emission SHALL fail. Package-only
changes may alter this evidence without changing Candidate bytes. The tree
is not archive identity, original-builder attestation, or acceptance; the
designated accepter's publication policy decides what else to require.

#### Scenario: Package-only content changes

- **WHEN** the same exact inputs and selected implementation file sets are
  built from two packages differing only in nonselected content
- **THEN** Candidate and artifact identities remain equal while the current
  installed-package tree identities differ
- **AND** a replay match does not claim which package built the original Candidate

#### Scenario: Installed package changes during compilation

- **WHEN** the installed package content differs between the build's opening
  and pre-emission checks
- **THEN** compilation fails before emitting a successful Candidate

#### Scenario: Qualification report remains derivable

- **WHEN** successor qualification selects a Policy and replays a Candidate
- **THEN** its records-bound report remains derivable from the selected
  Candidate, Qualification Set, and Policy without a package-tree field
- **AND** the separate replay result retains current package evidence without
  claiming the original builder or authenticating the installed package

### Requirement: Standalone pages declare no external assets

Interactive composition SHALL reject declared external scripts, frames,
stylesheets, images, media, and CSS URLs before Candidate. Supported inline
data assets and same-document SVG fragments remain allowed. The standalone
Content Security Policy SHALL block network loads and connections while
allowing selected inline, data, and blob assets. Neither check proves code
cannot attempt blocked requests or that blocking preserves a complete work;
exact-browser qualification remains separate.

#### Scenario: A selected page declares an external image

- **WHEN** a selected interactive page contains an external image or CSS URL
- **THEN** composition fails before a complete Candidate is emitted
- **AND** the reader is not given an apparently standalone work with a missing asset

#### Scenario: Page code attempts an undeclared connection

- **WHEN** executable page code attempts a network connection in the reader
- **THEN** the browser policy blocks the connection
- **AND** a browser error or incomplete rendering cannot be counted as qualification

### Requirement: Compilation distinguishes mechanical and editorial judgment

Publisher SHALL reject mechanically established identity, typed-meaning and
declared-grouping contradictions. It SHALL NOT judge arbitrary editorial
wording's semantic equivalence or contradiction with the source. Selected
media SHALL attribute that wording to the editor and mark it unverified.
Candidate build alone SHALL remain unqualified until applicable semantic and
human acceptance. These checks do not authenticate the editor or confer source
endorsement.

#### Scenario: A valid build lacks an editorial acceptance decision

- **WHEN** exact inputs pass identity, typed-meaning and declared-group checks
  but the selected wording has no applicable semantic or human acceptance
- **THEN** build remains unqualified and attributes the wording to its editor
- **AND** mechanical success neither certifies that wording nor grants source
  endorsement or publication authority

### Requirement: Edition selects a question-matched visual form

Per question and medium, Edition SHALL select a source-bound form for the
dominant relationship, preserving assertions and limits without a second model
or requiring authored pixel positions. Publisher SHALL validate representability
before layout and SHALL NOT infer ownership, temporal order or evidence status
from node order, edge direction, labels or layout. Typed native views may supply
the form without a duplicate Edition field; ambiguous generic selections
require an editor's choice.

#### Scenario: Ownership question is not a traffic flow

- **WHEN** an Edition asks which actor owns a responsibility or handoff
- **THEN** its visual form distinguishes authority and boundary from traffic
  direction using selected source-backed assertions
- **AND** a generic left-to-right relation chain is not accepted solely
  because every selected entity and edge appears somewhere in it

#### Scenario: A responsibility role lacks its attributed basis

- **WHEN** a selected responsibility/handoff form assigns a visible zone,
  membership, or handoff without a same-question selected source assertion or
  separately attributed editorial assertion naming its basis
- **THEN** Publisher reports the affected question and unsupported role before
  layout, without a complete Candidate
- **AND** it does not derive ownership from entity type, box position, line
  direction, or a free narrative summary

#### Scenario: A relation is not an ownership claim

- **WHEN** an Edition binds a responsibility role or handoff directly to a
  selected entity, relation, or structural view rather than a typed Claim or
  editor-attributed assertion with selected source basis
- **THEN** Publisher reports the affected view question and unsupported role
  before layout, even if all referenced source endpoints are present
- **AND** it does not silently reinterpret a traffic route as an authority
  handoff

#### Scenario: Every responsibility role has an attributed basis

- **WHEN** the selected form binds each visible role and handoff to exact
  same-question assertions and discloses applicable conditions and limits
- **THEN** Publisher preserves source versus editorial attribution while
  composing the form without requiring authored pixel positions
- **AND** finite reference validation does not claim that free editorial
  wording is source-endorsed or substantively correct

#### Scenario: Group storage order differs from responsibility reading order

- **WHEN** an Editor changes only the order of the view's group records while
  retaining each group's members and the responsibility form's role order
- **THEN** the form's ordered role references, not group-record position,
  determine the visible reading order
- **AND** the selected group membership and assertion carriers remain exact

#### Scenario: Form or layout cannot answer the question

- **WHEN** the selected form cannot express a required assertion, or every
  complete painted candidate fails readable whole-page composition
- **THEN** Publisher reports the affected question and a bounded editorial
  form, grouping, or source-bound caption need before Candidate completion
- **AND** it does not substitute a prose inventory, a different source claim,
  or an unreviewed renderer-specific fallback

### Requirement: Interactive chapters carry meaning in the chosen form

Neutral HTML SHALL compose intrinsic, navigable chapters in continuous flow,
not fixed-height slides or a default page-wide source ledger. Relation captions
and question-relevant typed Claim cues SHALL bind exact visible subjects, use
selected-font metrics and clear the page. Routes SHALL clear nodes, routes and
arrowheads. Focused inspection SHALL expose full selected records. Captions and
cues SHALL NOT invent, silently abbreviate or transfer source authority.

#### Scenario: A selected relation has a readable source label

- **WHEN** the source label fits a feasible routed graph at the declared
  desktop reading size
- **THEN** the reader can identify that relation in the graphic without
  consulting a numbered prose ledger
- **AND** the emitted label clears nodes, other labels, arrowheads, and the
  page boundary after the actual graph renderer has painted it

#### Scenario: A selected Claim qualifies a diagram relation

- **WHEN** the Edition selects a typed Claim whose answer depends on its
  plane, condition, scope, or validity
- **THEN** a source-bound visual cue near its exact relation or subject
  distinguishes the necessary qualification in the default reading state
- **AND** focused inspection exposes the complete selected record without
  making the cue a new editable Claim

#### Scenario: The complete visual argument is infeasible

- **WHEN** measured labels and cues cannot fit without illegible scaling,
  collisions, omission, or a false source assertion
- **THEN** composition fails with the selected view and a bounded editorial
  regrouping or caption need
- **AND** an ordinal-only graph plus default relation transcript is not
  emitted as an apparently complete architecture diagram

#### Scenario: A short chapter precedes another chapter

- **WHEN** one selected mechanism needs less than a viewport of height
- **THEN** the next complete chapter follows in document flow rather than
  leaving an otherwise empty fixed-height slide
- **AND** navigation and inspection preserve each chapter's own identity,
  question, selected meaning, and keyboard focus

#### Scenario: Desktop width admits a shorter complete figure

- **WHEN** validated layout candidates preserve the same selected meaning
  and a horizontal candidate keeps labels readable at the declared desktop
  width while using less intrinsic height
- **THEN** composition does not prefer a tall isolated figure solely because
  it fits a fixed slide-height rectangle better
- **AND** actual browser paint verifies readable labels, complete routes,
  and the unchanged selection before visual acceptance

#### Scenario: A wrapping cut saves height but introduces a long detour

- **WHEN** valid candidates have readable labels and a wrapping cut reduces
  height while adding avoidable route distance
- **THEN** the single layout owner compares intrinsic height plus mean route
  detour before total route length, not height alone
- **AND** detour is the complete orthogonal route length beyond its terminal
  Manhattan distance; no emitted point or selected relation is adjusted
- **AND** at most four native candidates per selected page remain within the
  existing execution, output, and page-count bounds

#### Scenario: Exact applicability belongs to the reading region

- **WHEN** a graph has selected relation qualifiers or reader limits
- **THEN** native intrinsic layout places them alongside the complete figure
  when sufficient reading width exists, otherwise directly below it
- **AND** their exact subjects, predicates, exceptions, and attribution stay
  visible without a page-wide source inventory or a narrow-device variant

#### Scenario: Selected claims share exact context

- **WHEN** every selected Claim contains an identical context fact
- **THEN** one visible shared context may carry that fact without repeating it
- **AND** every distinct condition, scope, claimant, validity, value, and
  semantic anchor remains with its own Claim and complete Inspect record

#### Scenario: Display spelling could conflate typed applicability

- **WHEN** two selected scalar types or dimension values would have the same
  unquoted display spelling
- **THEN** unambiguous tokens distinguish their names and values in both
  visible media and Inspect before exact shared context is factored; only
  nonreserved identifiers omit quotes, with other strings using canonical JSON
- **AND** a string containing dimension punctuation cannot become equivalent
  to another Claim's conjunction

### Requirement: Neutral interactive geometry has one exact layout owner

Neutral interactive graphs SHALL use one pinned layout implementation for node,
flat-group, label, and complete route geometry. The SVG painter SHALL preserve
those coordinates. Viewport interaction SHALL neither re-route nor re-label.
Missing or invalid geometry SHALL fail before Candidate success. Verified
layout supply SHALL execute in the existing bounded owned-worker scope.

#### Scenario: Parallel relations and a return cycle coexist

- **WHEN** two selected relations share endpoints and another returns upstream
- **THEN** each retains its own complete route and source identity
- **AND** actual paths, arrowheads, and measured labels clear unrelated nodes
- **AND** a browser interaction cannot replace the selected route

#### Scenario: A route crosses a flat-group boundary

- **WHEN** the layout returns cross-group, intra-group, or self-loop sections
- **THEN** section and label coordinates are normalized from the named container
- **AND** every terminal attaches to its selected leaf-node boundary
- **AND** missing sections or ambiguous containers fail without a fallback line

#### Scenario: Layout supply stalls or returns malformed output

- **WHEN** the selected worker exceeds a declared time or output bound
- **THEN** the existing supervisor reclaims its owned process scope
- **AND** the operation fails without emitting an apparently successful Candidate
- **AND** prior artifacts, source meaning, and static geometry remain unchanged

### Requirement: Layout worker retains bounded reclamation lifetime

A selected layout worker SHALL remain live after every reply until owner
reclamation, within its validated finite lifetime. It SHALL flush enabled V8
coverage before replying and reject malformed lifetime bounds before reading
input. Root loss SHALL remain an unproved cleanup failure; a reply SHALL NOT
authorize Candidate emission before cleanup.

#### Scenario: Owner reclamation follows a success or error reply

- **WHEN** the selected layout worker replies before its owner reclaims it
- **THEN** the selected root remains live within its validated lifetime
- **AND** enabled worker coverage is flushed before the reply
- **AND** the existing supervisor still requires native reclamation before admission

#### Scenario: The layout owner disappears after a reply

- **WHEN** the replying layout worker is not reclaimed by its owner
- **THEN** it expires at the selected lifetime bound
- **AND** descendant reclamation and Candidate acceptance remain unproved

#### Scenario: The layout lifetime is invalid

- **WHEN** the lifetime is absent or outside its admitted bound
- **THEN** the worker exits unsuccessfully before reading inputs or executing layout
