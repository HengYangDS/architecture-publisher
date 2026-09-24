# Spec Delta

## MODIFIED Requirements

### Requirement: Explicit finite composition

The selected Edition SHALL bind one semantic digest and contain a complete
static overview plus one complete interactive overview and any declared
mechanism views. Each projection SHALL select claims, semantic identities,
grouping, reading order, endpoint contracts, and supported composition
constraints by explicit identities or declared predicates over the exact
Claim Model. The compiler SHALL materialize and record the finite selected
identity set before layout. A qualified layout or rendering foundation MAY
choose geometry within the Edition's constraints but SHALL NOT select new
meaning, silently omit required claims, or add visible product assertions.
Static and interactive scenes MAY differ and SHALL NOT be treated as
interchangeable layout data.

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

#### Scenario: A mature engine suggests an undeclared element

- **WHEN** a selected model, layout, or rendering foundation yields an element
  or relationship outside the materialized Edition selection
- **THEN** the Candidate rejects that element as unowned meaning
- **AND** the backend cannot promote its inferred view into source authority

### Requirement: Complete dual-medium output

Successful publication SHALL emit one deterministic SVG and one PNG from the
static scene, and one checked standalone HTML atlas from the interactive scene
set. The PNG SHALL use an admitted Edition-selected bounded width; absent such
a selection, the existing 6000-pixel-wide semantic-publication requirement
remains in force. A different implementation default SHALL NOT be reported as
conforming to that requirement. Static artifacts SHALL
be composed directly from semantic and static Edition input; they SHALL NOT
be screenshots, extracted HTML SVG, DOM serialization, or another
interactive-renderer derivative. The HTML overview SHALL remain a complete
diagram, while additional pages expand complete named mechanisms. One manifest
SHALL bind source, semantic, Edition, scene, renderer, qualification, selected
dimensions, and artifact identities.

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

#### Scenario: Different Editions select different raster widths

- **WHEN** an ETHOS flagship Edition selects 6000 pixels and a different
  source-owned Edition selects another supported width
- **THEN** each static PNG has exactly its selected width and independent
  artifact identity
- **AND** the generic compiler does not infer width from the source-product name

### Requirement: Domain-visible presentation ownership

Every visible diagram label SHALL be attributable to Edition-authored title,
view, group, entity, relation, claim, annotation, or required legal notice.
Selected typography, palette, spacing, and visual treatment SHALL come from
the Edition or its explicitly chosen neutral structural profile, not a hidden
vendor or adopter default. Renderer branding, template plate labels, debug
counters, version badges, demonstration placeholders, and generic generated
slogans SHALL NOT appear in flagship diagram surfaces.

#### Scenario: A renderer template has its own surface badge

- **WHEN** a flagship Edition uses that backend
- **THEN** the delivered diagram omits the badge carrier while preserving useful
  reader controls outside the diagram surface

#### Scenario: A backend supplies an undeclared house style

- **WHEN** a selected backend would change required typography, palette,
  spacing, or visual hierarchy without an Edition choice
- **THEN** qualification rejects the altered medium or compilation reports an
  unsupported policy
- **AND** the backend's default is not presented as source-authored art direction

## ADDED Requirements

### Requirement: Qualified foundations preserve selected semantics

A model, view, layout, or rendering foundation SHALL be a derived implementation
of the selected Source Bundle, Claim Model, and Edition, not another editable
authority. Before Candidate emission, Publisher SHALL account for each required
claim and relation identity, directed endpoint, plane, qualifier, provenance,
selected view membership, explicit omission, and unknown state in the emitted
semantic carriers or a separately checked exact-bound carrier. An engine that
cannot represent one of these distinctions SHALL reject that selected input or
use such a checked carrier; it SHALL NOT merge, infer, or discard meaning to
produce an apparently complete medium.

#### Scenario: A framework loses a selected qualifier

- **WHEN** a selected relation's direction, plane, condition, provenance, or
  unknown state cannot be recovered from the proposed Candidate carriers
- **THEN** Candidate emission fails with the exact unmapped identity and field
- **AND** a visually similar link is not counted as semantic coverage

#### Scenario: An engine view includes inferred meaning

- **WHEN** a framework-computed view contains an identity or assertion absent
  from the exact materialized Edition selection
- **THEN** Candidate emission rejects the extra meaning
- **AND** no framework representation is promoted to source authority
