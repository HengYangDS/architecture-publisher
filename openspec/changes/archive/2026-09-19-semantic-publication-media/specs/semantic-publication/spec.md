# Spec Delta

## MODIFIED Requirements

### Requirement: Explicit finite composition

The selected authoring document SHALL bind one semantic digest and contain one
complete static overview plus one or more interactive views. Each projection
SHALL select semantic entity and relation identities, grouping, order, endpoint
sides and supported route style explicitly. Labels and relation endpoints SHALL
remain owned by the semantic document. Static and interactive composition MAY
differ and SHALL NOT be treated as interchangeable layout data.

#### Scenario: Two media need different composition

- **WHEN** the same complete semantic graph requires a poster composition and an interactive reading composition
- **THEN** the authoring document may give the static overview and interactive overview different grouping, order, ports or routes
- **AND** both projections still resolve every selected identity and endpoint from the same semantic document

#### Scenario: Structural meaning is omitted or contradictory

- **WHEN** an overview omits meaning, membership is duplicated, an endpoint is absent, or the semantic document contains contradictory propositions
- **THEN** publication fails with the prior output untouched

#### Scenario: The constrained layout is infeasible

- **WHEN** selected cardinality or renderer geometry exceeds the finite composition contract
- **THEN** publication fails rather than shrinking text, dropping meaning or editing generated output

### Requirement: Complete dual-medium output

Successful publication SHALL emit one deterministic SVG and PNG from the static
overview and one checked standalone HTML diagram per interactive view. Static
artifacts SHALL be composed directly from semantic and static authoring input;
they SHALL NOT be screenshots, extracted HTML SVG, DOM serialization or another
interactive-renderer derivative. A single manifest SHALL bind source,
authoring, semantic, static and interactive artifact identities.

#### Scenario: A real structural revision is published

- **WHEN** an added entity and its relations are present in the selected source and both complete authored projections
- **THEN** the static SVG/PNG and applicable HTML views visibly carry those identities and directed relations

#### Scenario: One medium changes presentation

- **WHEN** only interactive authoring or renderer-template presentation changes
- **THEN** the static SVG and PNG identities remain unchanged
- **AND** when only static authoring changes, every HTML identity remains unchanged

#### Scenario: Static rendering cannot represent the authored overview

- **WHEN** the complete static overview cannot pass the declared SVG, geometry or raster contract
- **THEN** publication fails before exposing a successful output directory

## ADDED Requirements

### Requirement: Cross-medium semantic identity

For complete overview coverage, the static and interactive projections SHALL
contain the same entity IDs, relation IDs, directed relation endpoints and
source identities. The verifier SHALL compare those semantic carriers directly
and SHALL NOT infer equality from similar labels or pixels.

#### Scenario: A medium omits or redirects a semantic relation

- **WHEN** one complete projection omits a relation, changes its endpoints or references an unknown identity
- **THEN** publication fails closed before artifact promotion

### Requirement: Domain-visible presentation ownership

Visible diagram labels SHALL be attributable to authored title, view, group,
entity or relation vocabulary. Interactive controls and required legal notices
MAY remain in the HTML reader, but renderer branding, template plate labels and
demonstration placeholders SHALL NOT appear on the diagram surface or in static
output.

#### Scenario: A renderer template has its own surface badge

- **WHEN** semantic publication uses that renderer
- **THEN** the HTML diagram surface omits the badge carrier while preserving authored labels and useful reader controls

### Requirement: Self-hosted publication remains distinct from adoption proof

ETHOS Architecture SHALL be able to publish a source-bound architecture of its
own product through the same public semantic contract. Its self-hosted edition
SHALL use selected repository bytes and SHALL NOT require a project-specific
branch in generic composition code. Self-hosting SHALL be recorded separately
from independent non-ETHOS adopter evidence.

#### Scenario: The product publishes its own architecture

- **WHEN** selected ETHOS Architecture source bytes and authored projections are compiled
- **THEN** the normal public command emits complete independent static and interactive media
- **AND** the result proves self-use but does not satisfy the independent-adopter claim
