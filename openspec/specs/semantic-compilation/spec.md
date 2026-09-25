# semantic-compilation Specification

## Purpose

Compile explicit source-bound architectural meaning into deterministic changes
and conservative view obligations without inventing equivalence or acceptance.

## Requirements

### Requirement: Explicit portable semantic contract

The publisher SHALL validate a versioned, source-bound claim model with stable
identities, typed entities and relations, explicit claims, complete qualifiers,
source-bound provenance, and dependency coverage. Each claim SHALL bind subject,
predicate, object or value, plane, condition, scope, maturity, source-bound
provenance, and validity.
Planes SHALL distinguish `intended`, `implemented`, `observed`, `governed`, and
`published`.

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

- **WHEN** claims with the same semantic key and applicable condition assert
  incompatible values or validity
- **THEN** validation reports their identities and source bindings
- **AND** no effect, acceptance, or publication predicate treats the model as consistent

#### Scenario: Target and current architecture differ

- **WHEN** intended and implemented or observed claims differ
- **THEN** both planes remain representable and visibly distinguishable
- **AND** the compiler does not collapse the target into a current-state claim

### Requirement: Deterministic change with declared correspondence

The compiler SHALL compare complete claim values and report sorted additions,
removals, and changes. Identity correspondence SHALL require explicit
source-digest and location evidence and valid rename, split, or merge cardinality.

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

The compiler SHALL propagate changes through both source versions, claim
references, Edition coverage, and declared view dependencies. It SHALL report
rebuild, semantic verification, medium verification, human review, acceptance,
and publication as distinct obligations and broaden impact when dependencies are
unknown or changed meaning lacks representation.

#### Scenario: An entity affects a relation and an assertion-only view

- **WHEN** the entity changes and a view depends on a claim involving that relation
- **THEN** the view is affected even without direct entity membership

#### Scenario: A dependency is removed or unknown

- **WHEN** changed meaning is unrepresented or dependency coverage is unknown
- **THEN** every conservatively affected Edition and view receives explicit obligations
- **AND** no prior acceptance is automatically transferred

### Requirement: Installed comparison and existing edition consumption

The publisher SHALL expose digest-selected comparison through its installed
`archpub` CLI without Git, ETHOS, credentials, network, or adjacent checkouts.
Every Edition SHALL consume this same comparison owner and retain its bounded
rendering scope.

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
