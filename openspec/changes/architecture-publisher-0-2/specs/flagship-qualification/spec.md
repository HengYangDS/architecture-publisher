# Spec Delta

## Purpose

Define non-compensating semantic, communication, visual, accessibility, runtime,
and human acceptance gates for flagship architecture publications.

## ADDED Requirements

### Requirement: Flagship acceptance is conjunctive

A flagship Edition SHALL pass semantic fidelity, coverage, geometry, browser,
accessibility, installed-use, recovery, and human visual acceptance. No weighted
score or success in one dimension SHALL compensate for failure in another.

#### Scenario: Automated geometry passes but the composition is poor

- **WHEN** overlap, clipping, glyph, route, and endpoint checks pass but the
  designated human reviewer rejects hierarchy, rhythm, density, or character
- **THEN** flagship acceptance fails
- **AND** the rejection records the Edition and artifact identities without
  changing source meaning

#### Scenario: A beautiful artifact omits required meaning

- **WHEN** the artifact is visually approved but fails semantic coverage
- **THEN** flagship acceptance fails before publication

### Requirement: Faithful, intelligible, and restrained review

Flagship review SHALL separately judge `faithful`, `intelligible`, and
`restrained` qualities. Faithfulness covers source truth and explicit limits;
intelligibility covers immediate purpose, hierarchy, routes, and mechanism
completeness; restraint covers proportion, typography, whitespace, rhythm,
color, and absence of ornamental noise.

#### Scenario: A flagship overview is evaluated by a reader

- **WHEN** the selected overview is reviewed at its intended display size
- **THEN** the reader can identify the product purpose and causal spine within
  three seconds, locate authority, media, qualification, publication, and
  feedback within thirty seconds, and trace an important claim to its source
  and limits within five minutes

### Requirement: Visible geometry is measured from painted output

Qualification SHALL inspect actual glyph, stroke, arrowhead, node, viewport, and
canvas envelopes for every declared delivery size. It SHALL reject unintended
overlap, clipping, overflow, ambiguous crossings, detached endpoints, template
badges, debug counters, and unbalanced terminal whitespace.

#### Scenario: Source geometry differs from browser paint

- **WHEN** a source-space check passes but the painted browser or raster output
  overlaps, clips, overflows, or disconnects a relationship
- **THEN** the medium fails qualification

### Requirement: Human acceptance is bounded evidence

A human visual decision SHALL bind the exact artifact digest, Edition digest,
review rubric, viewport or physical size, reviewer identity, verdict, and notes.
It SHALL NOT become a generic approval of future artifacts or another semantic
truth source.

#### Scenario: An accepted Edition is regenerated

- **WHEN** regenerated artifact bytes differ from the accepted bytes
- **THEN** the previous human decision is inapplicable
- **AND** a new flagship release requires fresh review
