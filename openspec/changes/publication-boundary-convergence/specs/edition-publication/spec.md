# Spec Delta

## MODIFIED Requirements

### Requirement: Edition is a complete authored contract

One editor-owned Edition project SHALL select audience, reader questions,
source namespaces and revisions, scope, required assertions, explicit limits
and omissions, attributed editorial assertions, narrative, and separate static
and interactive presentation obligations. An Edition SHALL NOT silently alter
source facts or claim source endorsement from a source path or maintainer
label.

#### Scenario: An editorial assertion is added

- **WHEN** an Edition states a cross-source relationship or conclusion not
  asserted by either source
- **THEN** it names the editor as proponent and identifies its source basis
- **AND** it does not present the new assertion as source-approved fact

#### Scenario: An Edition omits a source claim

- **WHEN** a claim is absent from a view
- **THEN** the omission is admitted only when the Edition policy classifies it
  as outside that view's question, represented visibly by another declared
  view, or an explicit limit on the promised answer
- **AND** an unclassified omission fails coverage validation

#### Scenario: An Edition changes source meaning

- **WHEN** authored wording, grouping, or decoration contradicts a bound claim
- **THEN** compilation fails before either medium is accepted

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

### Requirement: Successor Candidate manifest binds selected supplies

The successor Candidate SHALL use a distinct versioned manifest from
historical Claim Model/Edition v1 Candidates. Its unqualified value SHALL bind
the selected input lock, Edition bytes, native semantic digest, selected
semantic supplies, and each selected medium's independent Scene, artifacts,
and checked supply inventory. Supply records SHALL state identity, evidence
basis, and method; a checked file set SHALL NOT be called an observed execution
trace. Publisher-owned semantic and media-stage file sets SHALL be distinct.
The Candidate SHALL separately bind common compiler implementation before
complete compilation closure is claimed; these file sets alone are
insufficient. Unselected media implementations and package-only content SHALL
NOT enter a medium's supply identity. Derived reader obligations and
unresolved or ambient limits remain visible. The build output directory SHALL
remain outside Candidate semantic identity.

#### Scenario: One selected input produces two sibling media

- **WHEN** a successor Build Request selects static and interactive media and
  the same materialized inputs are built at two fresh output locations
- **THEN** the two builds have identical Candidate and artifact identities
- **AND** the static SVG/PNG and interactive HTML have distinct Scene hashes,
  artifact hashes, and medium-specific supplies without shared coordinates or
  DOM ownership

## ADDED Requirements

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

## RENAMED Requirements

- FROM: `### Requirement: Concrete Edition authority remains with its source product`
- TO: `### Requirement: Concrete Edition authority follows declared roles`
