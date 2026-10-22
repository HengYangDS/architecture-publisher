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
