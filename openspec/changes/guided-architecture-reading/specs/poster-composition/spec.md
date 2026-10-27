## Purpose

Compose each view as a graph-first poster with readable typography and portable,
deterministic SVG and PNG outputs.

## ADDED Requirements

### Requirement: Graph-first content

Cards SHALL show their category color, kind icon, label and details;
relations SHALL show their label and details on their own wire. Posters SHALL
NOT print claim records, digest lists, status tables or reading indexes.

#### Scenario: A component with details

- **WHEN** a component declares `owns: account tokens`
- **THEN** its card shows its icon, its label and that detail

### Requirement: Header, legend and footnote

Each poster SHALL contain a header with the title, the view question, an
optional summary of at most three lines and the repository, revision and view
number; one legend line for the kinds, the system boundary and the statuses
present; and a footnote with the scope, limits, attribution, repository
revision and source verification state.

#### Scenario: Evidence stays off the poster

- **WHEN** a model declares source digests for every component
- **THEN** the poster shows the revision and verification state in its
  footnote and no digest

### Requirement: Grid composition

The poster SHALL draw the grid layout computed with the poster's metrics:
equal cards, tiers as tinted row bands with numbered row labels, the system
boundary as one dashed rectangle with the repository name, orthogonal wires
with arrowheads and relation labels inside the channels. A view smaller than
its stage SHALL be enlarged by at most 1.4 times and centered; a view SHALL
never be reduced.

#### Scenario: A tiered view

- **WHEN** a view names five tiers
- **THEN** the poster shows five bands numbered 1 to 5 with their labels and
  every card of a band at one height

#### Scenario: A small view

- **WHEN** a view of two rows occupies a third of the stage
- **THEN** it is drawn at no more than 1.4 times its natural size, centered

### Requirement: Readable typography and geometry

The poster SHALL use the bundled fonts at a fixed type scale in which no text
is smaller than 14 px, and SHALL refuse a view whose layout fails the measured
neatness rules.

#### Scenario: Text floor

- **WHEN** any poster is built
- **THEN** every text run in its SVG is at least 14 px

#### Scenario: A composition defect

- **WHEN** a label box would intersect a card
- **THEN** the build fails with the label's relation id and the card id

### Requirement: Status styles

Relations and components with status `planned` SHALL be drawn dashed, and
those with status `retired` SHALL be drawn dotted and muted. The legend SHALL
explain each style present.

#### Scenario: A planned relation

- **WHEN** a relation has status `planned`
- **THEN** its wire is dashed and the legend explains the dashed style

### Requirement: Portable deterministic output

Each poster SHALL be written as SVG whose text is converted to glyph outlines
and whose icons are inline paths, and as PNG at 1800 and 6000 px wide rendered
from that SVG by the vendored renderer. The publisher SHALL NOT discover host
fonts. Building the same model with the same publisher version SHALL reproduce
identical bytes.

#### Scenario: Rendering without fonts

- **WHEN** a poster SVG is opened on a machine without the bundled fonts
- **THEN** it renders the same glyphs because it contains no font references

#### Scenario: Rebuild

- **WHEN** a model is built twice into two directories
- **THEN** every SVG and PNG in one equals the corresponding file in the other
