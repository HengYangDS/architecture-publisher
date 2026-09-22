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

The selected Edition SHALL bind one semantic digest and contain a complete
static overview plus one complete interactive overview and any declared
mechanism views. Each projection SHALL select claims, semantic identities,
grouping, reading order, endpoint contracts, and supported composition
constraints explicitly. Static and interactive scenes MAY differ and SHALL NOT
be treated as interchangeable layout data. Renderer defaults SHALL NOT add
visible product meaning.

#### Scenario: Two media need different composition

- **WHEN** the same complete semantic model requires a poster composition and an
  interactive reading composition
- **THEN** the Edition may assign different hierarchy, grouping, order, geometry,
  text density, interaction, ports, and routes to each medium
- **AND** both projections retain their declared claim coverage and source identities

#### Scenario: Structural meaning is omitted or contradictory

- **WHEN** an overview omits a required claim, membership is duplicated, an
  endpoint is absent, or selected claims contradict each other
- **THEN** publication fails with the prior output untouched

#### Scenario: The constrained layout is infeasible

- **WHEN** selected content cannot satisfy the Edition's legibility and geometry obligations
- **THEN** publication fails for explicit regrouping or additional views
- **AND** it does not shrink text below limits, drop meaning, or edit generated output

### Requirement: Complete dual-medium output

Successful publication SHALL emit one deterministic SVG and 6000-pixel-wide PNG
from the static scene and one checked standalone HTML atlas from the interactive
scene set. Static artifacts SHALL be composed directly from semantic and static
Edition input; they SHALL NOT be screenshots, extracted HTML SVG, DOM
serialization, or another interactive-renderer derivative. The HTML overview
SHALL remain a complete diagram, while additional pages expand complete named
mechanisms. One manifest SHALL bind source, semantic, Edition, scene, renderer,
qualification, and artifact identities.

#### Scenario: A real structural revision is published

- **WHEN** an added claim and its dependencies are present in selected source and
  both applicable scenes
- **THEN** the static SVG/PNG and applicable HTML views visibly carry that meaning

#### Scenario: One medium changes presentation

- **WHEN** only interactive composition or presentation changes
- **THEN** static artifact identities remain unchanged
- **AND** the changed interactive output requires fresh applicable qualification

#### Scenario: Static rendering cannot represent the authored overview

- **WHEN** the complete static overview cannot pass semantic, SVG, geometry,
  raster, or flagship obligations
- **THEN** publication fails before exposing a successful output directory

### Requirement: Relocated installed replay

The packaged CLI SHALL reproduce both selected revisions offline from portable
inputs without a source checkout, Git, credentials or developer dependencies.

#### Scenario: AIGW registry evolution is replayed

- **WHEN** the exact parent and registry-introduction inputs are published from a relocated installed package
- **THEN** both publications pass and only the evolved artifacts contain the registry entity and its declared relationships

### Requirement: Cross-medium semantic identity

Static and interactive complete overviews SHALL satisfy their Edition coverage
policies over the same semantic model. The verifier SHALL compare semantic
carriers and explicit omission decisions directly and SHALL NOT infer equality
from labels, coordinates, DOM, or pixels.

#### Scenario: A medium omits or redirects a semantic relation

- **WHEN** one complete overview omits a required claim, changes its endpoints,
  changes its plane, or references an unknown identity
- **THEN** publication fails closed before artifact promotion

### Requirement: Domain-visible presentation ownership

Every visible diagram label SHALL be attributable to Edition-authored title,
view, group, entity, relation, claim, annotation, or required legal notice.
Renderer branding, template plate labels, debug counters, version badges,
demonstration placeholders, and generic generated slogans SHALL NOT appear in
flagship diagram surfaces.

#### Scenario: A renderer template has its own surface badge

- **WHEN** a flagship Edition uses that backend
- **THEN** the delivered diagram omits the badge carrier while preserving useful
  reader controls outside the diagram surface

### Requirement: Self-hosted publication remains distinct from adoption proof

Architecture Publisher SHALL publish a source-bound, complete first-party
Edition of its product through the same public contracts used by other Editions.
Self-publication SHALL bind selected product contract, implementation,
qualification, publication, adoption, and evolution sources; it SHALL NOT infer
meaning solely from selected code modules or treat self-use as independent proof.

#### Scenario: The product publishes its own architecture

- **WHEN** selected product sources and complete Edition inputs are compiled
- **THEN** independent static and interactive compositions depict the complete
  declared product chain, authority boundaries, consumers, and feedback loop
- **AND** the result records self-use separately from independent adoption and
  human acceptance

#### Scenario: The selected self-host path uses a filesystem alias

- **WHEN** an absolute absent self-publication output path has an existing
  parent that resolves through a filesystem alias
- **THEN** the self-publication entry creates the output and emits source,
  authoring, and plan paths under its canonical physical directory
- **AND** the generic bundle writer remains strict for non-canonical parents
  supplied directly to its public contract
