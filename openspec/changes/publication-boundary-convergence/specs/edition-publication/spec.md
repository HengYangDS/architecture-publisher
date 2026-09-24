# Spec Delta

## MODIFIED Requirements

### Requirement: Edition is a complete authored contract

One editor-owned Edition project SHALL select audience, reader questions,
source namespaces and revisions, scope, required assertions, explicit limits
and omissions, attributed transformations, narrative, and separate static and
interactive presentation obligations. It SHALL select an exact Edition project
root without requiring a copy of every native source fact or authored pixel
geometry. Publisher SHALL derive its lock and Candidate identities from the
selected bytes; authors SHALL NOT maintain Publisher-generated source hashes or
seals as editorial truth. An Edition SHALL NOT silently alter source facts or
claim source endorsement from a source path or maintainer label.

#### Scenario: An editor works outside a source repository

- **WHEN** one Edition project selects exact inputs from two source namespaces
  while living in a separate directory
- **THEN** its reader questions and choices belong to the named editor
- **AND** each source retains its own claimant, revision, and native authority

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
manifest selecting one Edition project, one or more source selectors or
exact pins, requested media, and a qualified toolchain profile. The Edition
project SHALL use a versioned authoring manifest plus selected native files or
assets, not a Publisher seal edited by hand. Each source selector SHALL
identify namespace, native format and version, claimant, revision evidence,
and a portable local locator or pin. Unknown protocol fields SHALL fail rather
than silently acquire meaning. Direct inputs and zero or more selected
Providers SHALL converge on the same materialized
input lock before the public Edition build. The installed build SHALL not need
ETHOS, Git, adjacent checkouts, network, product-specific branching, or an
unselected source adapter. Existing Source Bundle v1, Claim Model v2, Edition
v1, and Provider v1 inputs SHALL remain replayable under their original
meanings.
Direct Edition selection names an authoring filesystem root and manifest;
Provider Edition selection names the sole authored Edition item supplied by
one exact selected Provider. Both are one semantic Edition selection, not two
competing roots or an implicit filesystem lookup.

#### Scenario: A mixed-source request is relocated

- **WHEN** exact pinned native inputs and an Edition project are relocated with
  an installed Publisher package
- **THEN** the same supported Candidate can be compiled offline without the
  original source repositories or Providers
- **AND** changed selected bytes fail pin verification

#### Scenario: Edition selection is ambiguous

- **WHEN** two selected Providers or direct inputs each offer a conflicting
  Edition project root without an exact Build Request choice
- **THEN** preparation fails instead of merging scope, questions, or omissions

#### Scenario: An author supplies a native source

- **WHEN** a Build Request selects a native LikeC4 file, an Edition authoring
  manifest, and a supported toolchain
- **THEN** Publisher derives exact materialized-input and Candidate identities
  without requiring the author to copy the source into a Claim Model JSON file
- **AND** the author does not hand-edit Publisher-generated hashes or seals

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
selection, attribution, transformations, and art direction, whether or not that
editor shares a repository with a source. The designated accepter and custodian
SHALL own their respective decisions. Co-location SHALL NOT merge these roles,
and a central mutable migration copy SHALL NOT remain a parallel authority.

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

#### Scenario: A source product publishes an Edition package

- **WHEN** a source product is also the named Edition editor and its package
  emits valid portable inputs through the public Provider contract
- **THEN** Architecture Publisher can build and qualify them without source-repo
  discovery or product-specific branches
- **AND** Publisher records do not authorize or reinterpret the source product

### Requirement: Candidate, qualification, and publication are distinct values

Compilation SHALL emit a Candidate bound to exact materialized inputs, Edition,
selected semantic carriers, independent media, renderer supply, and artifact
identities. Qualification SHALL emit predicate-specific evidence naming the
exact subject, verifier, method, scope, result, and limit. An acceptance policy
and named accepter SHALL decide whether that evidence admits the Candidate;
Publisher SHALL not infer approval from a green build, same-person signature,
or file location. Local publication SHALL require exact authorization and emit
an effect/recovery receipt; hosted publication and custody SHALL be separate
owner-observed states.

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

Evolution SHALL distinguish changed source bytes, supported meaning,
unknown or uninterpreted meaning, editorial selection, media composition, and
packaging-only bytes. Declared dependencies and finite materialized view
membership SHALL identify affected questions, views, media, and qualification
predicates. Unknown dependency or ambiguous lineage SHALL broaden obligations.
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

## ADDED Requirements

### Requirement: Historical Edition and Provider contracts remain truthful

Previously valid Edition v1 and Provider v1 inputs SHALL retain their selected
source meaning, omission policy, scene meaning, and identity-only
`authoredInputSha256` interpretation. A successor SHALL NOT claim that this
legacy digest proves media-input consumption. A changed v1 default SHALL be
identified as either correction of a proven contract violation or a versioned
successor behavior. Any reinterpretation of valid v1 input SHALL require an
explicit successor Edition and Provider contract and consumer migration.
Historical signed manifests and artifacts SHALL remain unchanged.

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
rather than silently substitute style or drop meaning. Generic code SHALL NOT
choose font, palette, group capacity, or raster width by source-product name.
Historical v1 output rules SHALL remain truthfully classified.

#### Scenario: Two Editions require different presentation

- **WHEN** two valid Editions select different visual policies or bounded
  raster widths
- **THEN** each Candidate carries its own policy and output identities
- **AND** the generic compiler uses no adopter-name branch

#### Scenario: A neutral first build is requested

- **WHEN** a maintainer supplies admitted native sources and reader questions
  without renderer code or pixel coordinates
- **THEN** Publisher offers a readable baseline and explainable suggestions
  for the same Edition project
- **AND** suggested grouping or geometry does not become source truth or a
  parallel editorial intent store

#### Scenario: A policy is unsupported

- **WHEN** no qualified renderer can honor a selected required font, semantic
  distinction, layout constraint, or output dimension
- **THEN** compilation fails with a specific unsupported-policy diagnostic
- **AND** it does not emit an apparently qualified substitute

## RENAMED Requirements

- FROM: `### Requirement: Concrete Edition authority remains with its source product`
- TO: `### Requirement: Concrete Edition authority follows declared roles`
