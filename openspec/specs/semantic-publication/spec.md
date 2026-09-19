# semantic-publication Specification

## Purpose
Publish explicit source-bound architecture through complete static and
interactive views without inferring intent or creating another product authority.

## Requirements

### Requirement: Source-bound structural publication

The publisher SHALL consume an exact source bundle, a validated semantic
document and explicit authored views. Every declared semantic source SHALL bind
to a byte-identical bundle member. It SHALL NOT infer product intent from code.

#### Scenario: A selected source member changed

- **WHEN** a semantic source digest does not match its selected bundle member
- **THEN** publication fails before creating a successful output manifest

### Requirement: Explicit finite composition

Every view SHALL declare complete grouping and order for its selected entities,
and explicit endpoint sides and route style for every selected relation. The
overview SHALL select every semantic entity and relation.

#### Scenario: Structural meaning is omitted or contradictory

- **WHEN** an overview omits meaning, membership is duplicated, an endpoint is absent, or the semantic document contains contradictory propositions
- **THEN** publication fails with the prior output untouched

#### Scenario: The constrained layout is infeasible

- **WHEN** selected cardinality or renderer geometry exceeds the finite composition contract
- **THEN** publication fails rather than shrinking text, dropping meaning or editing generated output

### Requirement: Complete dual-medium output

Successful publication SHALL emit one checked HTML diagram per declared view and
one static SVG extracted from the complete overview. A manifest SHALL bind the
source, authoring, semantic and artifact identities.

#### Scenario: A real structural revision is published

- **WHEN** an added entity and its relations are present in the selected source and authored views
- **THEN** both the overview SVG and applicable HTML views visibly carry those identities and directed relations

### Requirement: Relocated installed replay

The packaged CLI SHALL reproduce both selected revisions offline from portable
inputs without a source checkout, Git, credentials or developer dependencies.

#### Scenario: AIGW registry evolution is replayed

- **WHEN** the exact parent and registry-introduction inputs are published from a relocated installed package
- **THEN** both publications pass and only the evolved artifacts contain the registry entity and its declared relationships
