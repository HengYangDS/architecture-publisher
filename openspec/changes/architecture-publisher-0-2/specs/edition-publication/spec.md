# Spec Delta

## Purpose

Define an Edition as the audience-specific, source-bound unit that compiles one
semantic authority into independently composed and qualified publications.

## ADDED Requirements

### Requirement: Edition is a complete authored contract

An Edition SHALL bind a semantic model, audience, reader questions, required
claims, omission policy, reading order, visual grammar, static scene,
interactive scene set, and qualification obligations. An Edition SHALL NOT own
or silently alter source truth.

#### Scenario: An Edition omits a source claim

- **WHEN** a claim is absent from a view
- **THEN** the omission is admitted only when the Edition policy classifies it
  as out of scope or represented by another declared view
- **AND** an unclassified omission fails coverage validation

#### Scenario: An Edition changes source meaning

- **WHEN** authored wording, grouping, or decoration contradicts a bound claim
- **THEN** compilation fails before either medium is accepted

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

The compiler SHALL compare exact semantic inputs, determine affected Editions
and views through declared dependencies, and distinguish rebuild,
requalification, review, acceptance, and publication. Unknown dependencies SHALL
broaden obligations; regeneration SHALL NOT transfer prior approval.

#### Scenario: A claim changes without changing graph cardinality

- **WHEN** a claim changes plane, condition, scope, maturity, value, or provenance
- **THEN** every dependent view is marked affected
- **AND** previous semantic, visual, browser, and human approval is not reused

#### Scenario: Generated output is edited

- **WHEN** a generated SVG, PNG, or HTML file differs without a selected Edition
  source change
- **THEN** qualification rejects the artifact as an unowned projection
