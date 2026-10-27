## Purpose

Compose each view as a graph-first poster in one fixed landscape format, with
the page, the figure and the text set together on one grid, and with portable,
deterministic SVG and PNG outputs.

## ADDED Requirements

### Requirement: Fixed presentation format

Every poster SHALL be 2400 × 1350 px, a 16:9 landscape page. The format SHALL
NOT depend on the content: a view that cannot be composed in it is refused,
never drawn on a longer, wider or narrower page.

#### Scenario: Every poster has one shape

- **WHEN** a model with a two-card view and a twenty-card view is built
- **THEN** both posters are 2400 × 1350 px

### Requirement: Page grid

The page SHALL be set on one grid owned by the design tokens: an 8 px unit,
twelve columns between fixed margins, a baseline and a type scale whose
smallest size is 14 px. Every text block, rule, legend and figure field SHALL
start on a column line and a baseline, and text SHALL keep a measure of at
most 80 characters per line.

#### Scenario: A summary keeps its measure

- **WHEN** a view has a summary of 300 characters
- **THEN** no summary line is longer than 80 characters
- **AND** every line starts at the same column line

### Requirement: Page archetypes

The page SHALL use one of two archetypes. The masthead sets the title,
question and summary in a header band, the legend in the band's right columns
and the figure field across all twelve columns below. The sidebar sets the
title, question, summary, legend and notes in the left columns and the figure
field over the full height of the remaining columns.

#### Scenario: A tall view

- **WHEN** a view's figure is taller than it is wide
- **THEN** a sidebar composition is among its candidates

### Requirement: Graph-first content

Cards SHALL show their category color, kind icon, label and details;
relations SHALL show their label and details on their own wire. Posters SHALL
NOT print claim records, digest lists, status tables or reading indexes.

#### Scenario: A component with details

- **WHEN** a component declares `owns: account tokens`
- **THEN** its card shows its icon, its label and that detail

### Requirement: Header, legend and notes

Each poster SHALL show the title, the view question, an optional summary of at
most three lines and the repository, revision and view number; one legend of
the kinds, the system boundary and the statuses present; and notes with the
scope, limits, attribution, repository revision and source verification
state.

#### Scenario: Evidence stays off the poster

- **WHEN** a model declares source digests for every component
- **THEN** the poster shows the revision and verification state in its notes
  and no digest

### Requirement: Candidate compositions

The publisher SHALL derive for each view a finite, ordered set of candidate
compositions: each an archetype, a row wrapping that splits a wide row into
consecutive rows of one band, and a figure type step of at most 1.4 times
whose sizes stay on the type scale. Every candidate SHALL be laid out with the
grid layout and the poster's metrics.

#### Scenario: A wide tier wraps

- **WHEN** a view's only tier holds six cards
- **THEN** a candidate draws them as two rows of three in one band

### Requirement: Justified figure

Each candidate's figure SHALL be justified to its field: the remaining width
widens column gaps and the remaining height deepens row channels, each within
its token bound, instead of the figure being scaled.

#### Scenario: A small view fills its field

- **WHEN** a view of two rows of three cards is composed
- **THEN** its figure spans the field within the justification bounds
- **AND** no blank band crosses the page between the header and the notes

### Requirement: Chosen composition

The publisher SHALL choose, among the candidates that pass every composition
gate, the one with the smallest empty-rectangle share, then the smallest
centroid offset, then the type step closest to 1.0. A view without a passing
candidate SHALL be refused with its id, every failing gate's measured value
and limit, and a remedy for the author. The manifest SHALL record the chosen
archetype, wrapping, type step and gate measurements.

#### Scenario: The same choice every time

- **WHEN** the same view is composed twice
- **THEN** both posters are byte-identical

#### Scenario: A composition with a blank band

- **WHEN** every candidate of a view leaves an empty rectangle above the limit
- **THEN** the build refuses with that view, the measured share and the limit

### Requirement: Balance gate

A composition SHALL pass when the largest empty rectangle in the live area
covers at most 12 percent of it, every cell of a three-by-three division of
the figure field holds ink, and the figure's ink centroid lies within
6 percent of the field's width and height of its center. The rendered 2400 px
raster SHALL pass the same gate.

#### Scenario: A strip in the middle of the page

- **WHEN** a figure of one row is centered in an otherwise empty field
- **THEN** the balance gate fails with the measured empty share

### Requirement: Type gate

A composition SHALL pass when every text uses a size of the type scale, none
is smaller than 14 px, every text block keeps its measure and no card label
breaks inside a word.

#### Scenario: Text floor

- **WHEN** any poster is built
- **THEN** every text run in its SVG is at least 14 px

### Requirement: Line gate

A composition SHALL pass when every relation has at most two bends, or four
when it skips rows, no segment is shorter than 16 px and no wire crosses a
card or a label.

#### Scenario: A route with three bends

- **WHEN** a relation between adjacent rows needs three bends
- **THEN** the line gate fails with that relation and its bends

### Requirement: Status styles

Relations and components with status `planned` SHALL be drawn dashed, and
those with status `retired` SHALL be drawn dotted and muted. The legend SHALL
explain each style present.

#### Scenario: A planned relation

- **WHEN** a relation has status `planned`
- **THEN** its wire is dashed and the legend explains the dashed style

### Requirement: Portable deterministic output

Each poster SHALL be written as SVG whose text is converted to glyph outlines
and whose icons are inline paths, and as PNG at 2400 and 6000 px wide rendered
from that SVG by the vendored renderer. The publisher SHALL NOT discover host
fonts. Building the same model with the same publisher version SHALL reproduce
identical bytes.

#### Scenario: Rendering without fonts

- **WHEN** a poster SVG is opened on a machine without the bundled fonts
- **THEN** it renders the same glyphs because it contains no font references

#### Scenario: Rebuild

- **WHEN** a model is built twice into two directories
- **THEN** every SVG and PNG in one equals the corresponding file in the other
