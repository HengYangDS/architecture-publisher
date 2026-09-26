# semantic-compilation Specification

## Purpose

Compile explicit source-bound architectural meaning into deterministic changes
and conservative view obligations without inventing equivalence or acceptance.

## Requirements

### Requirement: Explicit portable semantic contract

Claim Model v2 SHALL remain a validated versioned input with its original
typed claims and source-bound provenance. A successor MAY instead import an
admitted native architecture format or attributed projection into a disposable
view-compilation index. Each adapter SHALL declare supported constructs,
source-reference quality, admitted transformations, and losses.

#### Scenario: Unsupported or inconsistent model content

- **WHEN** a claim model has unknown fields, unsupported types or planes,
  dangling references, invalid provenance, contradictions, or invented
  cross-plane equivalence
- **THEN** validation fails or retains the affected meaning as explicitly
  unknown, according to the selected operation

#### Scenario: A source supplies prose without formal dependencies

- **WHEN** a claim has no supported formal representation or dependency coverage
- **THEN** its original value and provenance are retained with unknown coverage
- **AND** validation does not claim to understand, compare, or prove the prose

#### Scenario: Explicit propositions contradict each other

- **WHEN** claims within one source namespace, revision, plane, and applicable
  condition assert incompatible values or validity for the same semantic key
- **THEN** validation reports their identities and source bindings
- **AND** no effect, acceptance, or publication predicate treats that source
  assertion set as internally consistent

#### Scenario: Target and current architecture differ

- **WHEN** intended and implemented or observed claims differ
- **THEN** both planes remain representable and visibly distinguishable
- **AND** the compiler does not collapse the target into a current-state claim

### Requirement: Deterministic change with declared correspondence

Change comparison SHALL use complete selected native or projected values and
adapter capabilities, not cardinality or generated layout IDs alone. Stable
source-defined IDs MAY establish correspondence within their declared scope.
When only revision-scoped locators or engine-generated IDs exist, Publisher
SHALL report matching confidence and require explicit lineage for ambiguous
rename, split, merge, moved source, or duplicate relation.

#### Scenario: A relation changes qualifier

- **WHEN** direction, plane, condition, scope, provenance, or value changes
  without changing element and relation counts
- **THEN** the supported semantic delta reports a change
- **AND** affected views receive fresh applicable obligations

#### Scenario: A label changes without identity change

- **WHEN** an entity retains its identity but changes its label or qualifiers
- **THEN** it is reported as changed, never inferred as removed or renamed

#### Scenario: A source declares a split

- **WHEN** one removed identity is explicitly mapped to multiple added identities
  with bound provenance
- **THEN** the split is retained alongside the additions and removal
- **AND** neither equivalent meaning nor reusable approval is inferred

#### Scenario: A claim changes plane or condition

- **WHEN** a claim retains its identity but changes plane, scope, condition,
  maturity, validity, or value
- **THEN** it is reported as a semantic change even when entity and relation
  cardinality remains unchanged

### Requirement: Conservative impact and separate obligations

The compiler SHALL propagate exact source-byte and supported semantic changes
through declared native includes, imported references, Edition questions,
selected predicates, and materialized view membership. It SHALL report
rebuild, semantic verification, media verification, human review, acceptance,
and publication separately. Unknown or unrepresented dependencies SHALL
broaden applicable obligations.

#### Scenario: An entity affects a relation and an assertion-only view

- **WHEN** the entity changes and a view depends on a claim involving that relation
- **THEN** the view is affected even without direct entity membership

#### Scenario: A dependency is removed or unknown

- **WHEN** changed meaning is unrepresented or dependency coverage is unknown
- **THEN** every conservatively affected Edition and view receives explicit obligations
- **AND** no prior acceptance is automatically transferred

### Requirement: Installed comparison and existing edition consumption

The installed CLI SHALL retain the exact digest-selected Claim Model v2
comparison path. Successor native-input Editions SHALL use the same generic
comparison and impact owner through admitted adapters, not a mandatory
intermediate editable Claim Model. Comparison SHALL remain offline and
repository-independent from locked inputs. An adapter that cannot compare a
selected field SHALL report unknown impact rather than assuming unchanged
meaning.

#### Scenario: Native inputs relocate

- **WHEN** exact locked native inputs and an admitted adapter move with the
  installed package
- **THEN** comparison returns the same supported semantic delta offline
- **AND** changed selected bytes fail the lock before impact calculation

#### Scenario: Selected inputs move to another directory

- **WHEN** a relative-path plan and its selected documents relocate with an
  installed package
- **THEN** comparison produces the same semantic result offline
- **AND** changed selected bytes fail instead of silently changing the result

#### Scenario: Meaning exceeds the current candidate renderer

- **WHEN** claim growth, removal, contradiction, or an unsupported relation
  cannot be represented by the current selected Edition and renderer
- **THEN** candidate preparation refuses rather than hiding meaning or altering
  accepted artwork

### Requirement: Native adapter meaning and unknowns

A derived index SHALL retain native format identity, exact selected bytes,
claimant,
typed relation kind, direction, plane, condition, scope, provenance, and
unknown state where those fields are selected. Opaque constructs SHALL remain
opaque; the compiler SHALL not claim to understand them merely because their
bytes were retained. An unsupported distinction required by an Edition SHALL
block or be explicitly excluded under the editor's reviewed scope, never be
silently flattened.

#### Scenario: Native LikeC4 sources are selected

- **WHEN** an Edition selects authored LikeC4 model and view files
- **THEN** Publisher imports their supported constructs and exact references
  without requiring a tracked duplicate Claim Model
- **AND** unsupported domain qualifiers are reported rather than inferred from
  graphic colors or labels

#### Scenario: A native construct is opaque

- **WHEN** a selected source contains a construct whose meaning the adapter
  cannot interpret
- **THEN** its exact source binding and unknown status are preserved
- **AND** a view that needs to reason about it fails or declares an explicit
  limitation instead of claiming complete semantic coverage

### Requirement: LikeC4 source locator identity

For the selected LikeC4 adapter, a source reference SHALL identify an explicit
`element:<native-id>`, `view:<native-id>`, or one-based
`relation:<line>:<column>` locator together with its selected source namespace
and digest; labels and engine-generated relation IDs SHALL NOT resolve durable
Edition identity. A relation SHALL retain its endpoints, kind, direction, and
source origin without inferred transitive or causal meaning.

#### Scenario: A generated relation ID changes

- **WHEN** a subsequent native parse changes only a parser-run relation ID but
  its selected source bytes, locator, and supported fields remain equal
- **THEN** the source-location reference resolves the same selected meaning
  without including the volatile ID in its semantic identity
- **AND** a changed source locator or meaning does not inherit prior acceptance

#### Scenario: Two native relations have the same endpoints

- **WHEN** an authored LikeC4 file contains two relations with equal endpoints
  at different source positions
- **THEN** their one-based source locators resolve two distinct selections
- **AND** a duplicate or ambiguous locator fails rather than choosing the
  first engine-generated relation ID

#### Scenario: Two sources use the same label

- **WHEN** two source namespaces each contain an item labeled `authority`
- **THEN** their identities remain distinct by namespace, native reference,
  and revision
- **AND** a cross-source relation requires a named proponent

### Requirement: LikeC4 structural view membership

A selected structural view SHALL retain its exact computed member identities
and an explicit qualification limit. A computed relation whose source
endpoints are absent from the selected view's visible element membership SHALL
block that structural selection rather than create a dangling or falsely
aggregated edge.

#### Scenario: An Edition selects an upstream-computed view

- **WHEN** an Edition names one authored LikeC4 structural view by source
  namespace and native view ID
- **THEN** the adapter resolves its finite selected element and relation set
  with source bindings
- **AND** it preserves the upstream-computed-membership limit rather than
  claiming that every visible assertion has been qualified

#### Scenario: Upstream geometry is reused without becoming semantic authority

- **WHEN** a selected authored structural LikeC4 view requests layout
- **THEN** a separately bounded geometry projection retains the exact selected
  view, node, and relation source bindings without parser-generated edge IDs
- **AND** omitted members, unselected relations, invalid routes, and
  uninterpreted dynamic views fail rather than becoming visible carriers
- **AND** geometry alone grants no semantic, medium, or reader-quality approval

### Requirement: Unadmitted LikeC4 views and queries

Generated or uninterpreted dynamic views SHALL NOT silently satisfy an
authored structural reference. Free-form LikeC4 queries SHALL fail until a
separately admitted interpretation is specified.

#### Scenario: A free-form native view is selected

- **WHEN** an Edition selects an uninterpreted dynamic view or free-form query
- **THEN** structural import fails until a separately admitted interpretation
  can preserve its selected meaning and visible membership

### Requirement: Correspondence is not semantic approval

Correspondence SHALL never imply semantic equivalence, source endorsement, or
reusable acceptance. Unknown native changes SHALL remain unknown and
conservatively affect dependent Editions.

#### Scenario: An engine regenerates relation IDs after relocation

- **WHEN** the same native model moves and the engine changes generated
  relation IDs
- **THEN** Publisher uses bound native references or reports correspondence
  uncertainty
- **AND** it does not claim every generated ID is a stable semantic identity

### Requirement: Disagreement differs from invalid transformation

A source conflict MAY remain a visible subject of an Edition; broken input or
an unadmitted authored transformation SHALL block the affected Candidate at
input validation. The compiler SHALL not silently resolve disagreement or
derive a transitive or universal claim from weaker source relations.

#### Scenario: Target and observed sources disagree

- **WHEN** exact attributed target and observed claims differ
- **THEN** a comparison Edition may display the difference with source,
  revision, and plane visibly distinguished
- **AND** disagreement alone does not erase either claim or prohibit the
  comparison

#### Scenario: An aggregate changes quantifier

- **WHEN** an editor groups several actors and labels a `some-member` flow as
  an `all-member` invariant without matching source evidence
- **THEN** the transformation fails declared semantic checks or remains an
  explicit unaccepted editorial assertion
- **AND** a carrier map or graph path does not make the stronger claim valid

### Requirement: Claim Model v2 selector identity

The Claim Model v2 selector format SHALL be `architecture.claim-model` version
`2`; the JSON payload schema remains `architecture.claim-model/v2`.

#### Scenario: A Claim Model selector names another version

- **WHEN** a selected Claim Model v2 payload has a selector with a different
  format or version
- **THEN** it fails input admission instead of being silently reinterpreted

### Requirement: Failed native parser produces no index

A failed parser, selected-byte drift, output overflow, timeout, or unproved
cleanup SHALL produce no successful native index or Candidate.

#### Scenario: Native parsing exceeds its execution bound

- **WHEN** parsing times out, overflows its declared reply bound, or owned-tree
  cleanup cannot be proved
- **THEN** Publisher returns a named failure without a successful native index
- **AND** a later Candidate cannot borrow the partial result

#### Scenario: A platform lacks an admitted native execution capability

- **WHEN** the selected installed host cannot provide a required native worker
  or containment capability
- **THEN** native import fails closed without changing the general Publisher
  package's non-native semantics

### Requirement: Native parser containment claims remain limited

Declared dependencies, no-filesystem parser options, process-tree cleanup, and
runtime permission flags SHALL not individually establish a complete
execution-read or sandbox claim; unknown reads remain explicit until
installed-platform evidence closes them.

#### Scenario: Runtime flags are mistaken for a sandbox

- **WHEN** native parsing uses process-tree cleanup or runtime permission flags
  without complete execution-read evidence
- **THEN** Publisher does not claim sandbox isolation or complete knowledge of
  execution reads

### Requirement: Claim Model import preserves typed claims

An admitted Claim Model v2 adapter SHALL accept exact native or derived bytes
without requiring an editable LikeC4 copy. Semantic selection SHALL retain
entity and relation identities and each selected claim's plane, condition,
scope, validity, maturity, dependencies, and provenance. Layout-only graph
geometry SHALL NOT discharge those semantics; unsupported expression SHALL
fail or remain an explicit reader-question limit.

#### Scenario: A claim has the same endpoints but a changed condition

- **WHEN** two Claim Model inputs retain entity and relation counts but change
  a selected claim's condition or plane
- **THEN** selected semantic identity changes and neither medium may reuse the
  previous complete-coverage or acceptance claim

### Requirement: Bounded admitted native parser execution

Publisher SHALL select an exact installed parser supply and locked native
source bytes before executing a native importer. A public native-import path
SHALL NOT accept an arbitrary parser callback or silently fall back to an
ambient tool. Execution SHALL have finite input, output, time, and
owned-process cleanup bounds. The returned index SHALL bind the consumed
supply and selected source identities.

#### Scenario: The installed parser supply changes after verification

- **WHEN** a selected parser file changes before the importer executes it
- **THEN** execution uses the exact verified bytes or fails without an index
- **AND** no changed installed file or ambient dependency is substituted
