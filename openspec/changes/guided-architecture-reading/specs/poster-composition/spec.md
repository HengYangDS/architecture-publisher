## Purpose

Compose each view as a graph-first poster with readable typography and portable,
deterministic SVG and PNG outputs.

## ADDED Requirements

### Requirement: Graph-first content

Each poster SHALL contain a header with the title, the view question and an
optional summary of at most three lines; the graph; one legend line for the
kinds and statuses present; and a footnote with the scope, limits,
attribution, repository revision and source verification state. Components
SHALL show their kind glyph, label and details; relations SHALL show their
label and details beside their own route. Posters SHALL NOT print claim
records, digest lists, status tables or reading indexes.

#### Scenario: A component with details

- **WHEN** a component declares `owns: account tokens`
- **THEN** its poster node shows its glyph, its label and that detail

#### Scenario: Evidence stays off the poster

- **WHEN** a model declares source digests for every component
- **THEN** the poster shows the revision and verification state in its
  footnote and no digest

### Requirement: Readable typography and geometry

The poster SHALL use the bundled fonts at a fixed type scale in which no text
is smaller than 14 px. Labels SHALL NOT overlap nodes, other labels or the
frame edge, and every relation label SHALL sit beside its own route. A
composition that violates these rules SHALL fail the build as a defect.

#### Scenario: Text floor

- **WHEN** any poster is built
- **THEN** every text run in its SVG is at least 14 px

#### Scenario: A composition defect

- **WHEN** a laid-out label box intersects a node box
- **THEN** the build fails with the label's relation id and the node id

### Requirement: Status styles

Relations and components with status `planned` SHALL be drawn dashed, and
those with status `retired` SHALL be drawn dotted and muted. The legend SHALL
explain each style present.

#### Scenario: A planned relation

- **WHEN** a relation has status `planned`
- **THEN** its route is dashed and the legend explains the dashed style

### Requirement: Portable deterministic output

Each poster SHALL be written as SVG whose text is converted to glyph outlines,
and as PNG at 1800 and 6000 px wide rendered from that SVG by the vendored
renderer. The publisher SHALL NOT discover host fonts. Building the same model
with the same publisher version SHALL reproduce identical bytes.

#### Scenario: Rendering without fonts

- **WHEN** a poster SVG is opened on a machine without the bundled fonts
- **THEN** it renders the same glyphs because it contains no font references

#### Scenario: Rebuild

- **WHEN** a model is built twice into two directories
- **THEN** every SVG and PNG in one equals the corresponding file in the other
