# semantic-compilation Specification

## Purpose
Compile explicit source-bound architectural meaning into deterministic changes
and conservative view obligations without inventing equivalence or acceptance.

## Requirements

### Requirement: Explicit portable semantic contract

The publisher SHALL validate a versioned semantic document containing stable
identities, typed entities and relations, assertions, complete qualifiers,
source-bound provenance and explicit dependency coverage. Unknown schema fields,
unsupported relation types, dangling references and invalid provenance SHALL fail.

#### Scenario: A source supplies prose without formal dependencies

- **WHEN** an assertion has no supported formal proposition
- **THEN** its original value is retained with unknown dependency coverage
- **AND** validation does not claim to understand or prove the prose

#### Scenario: Explicit propositions contradict each other

- **WHEN** identical subject, predicate, object and qualifiers occur with opposite polarity
- **THEN** validation reports the conflicting assertion identities
- **AND** this does not imply detection of arbitrary natural-language contradictions

### Requirement: Deterministic change with declared correspondence

The compiler SHALL compare complete values and report sorted additions, removals
and changes. Identity correspondence SHALL require explicit source-digest and
location evidence and valid rename, split or merge cardinality.

#### Scenario: A label changes without identity change

- **WHEN** an entity retains its identity but changes its label or qualifiers
- **THEN** it is reported as changed, never inferred as removed or renamed

#### Scenario: A source declares a split

- **WHEN** one removed identity is explicitly mapped to multiple added identities with bound provenance
- **THEN** the split is retained alongside the additions and removal
- **AND** neither equivalent meaning nor reusable approval is inferred

### Requirement: Conservative impact and separate obligations

The compiler SHALL propagate changes through both source versions and declared
view dependencies, distinguish rebuild, verification and review, and broaden
impact when dependencies are unknown or changes lack representation.

#### Scenario: An entity affects a relation and an assertion-only view

- **WHEN** the entity changes and the view references an assertion depending on that relation
- **THEN** the view is affected even without direct entity membership

#### Scenario: A dependency is removed or unknown

- **WHEN** changed meaning is unrepresented or dependency coverage is unknown
- **THEN** all selected views receive explicit conservative obligations
- **AND** no prior acceptance is automatically transferred

### Requirement: Installed comparison and existing edition consumption

The publisher SHALL expose digest-selected comparison through its installed CLI
without Git, ETHOS, credentials, network or adjacent checkouts. The ETHOS edition
SHALL consume this same comparison owner and retain its bounded rendering scope.

#### Scenario: Selected inputs move to another directory

- **WHEN** a relative-path plan and its selected documents relocate with an installed package
- **THEN** comparison produces the same semantic result offline
- **AND** changed selected bytes fail instead of silently changing the result

#### Scenario: Meaning exceeds the current candidate renderer

- **WHEN** entity growth, removal or an unsupported relationship cannot be authored by the refresh adapter
- **THEN** candidate preparation refuses rather than hiding meaning or altering accepted artwork
