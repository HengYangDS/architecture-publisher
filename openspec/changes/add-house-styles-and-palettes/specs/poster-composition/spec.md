## ADDED Requirements

### Requirement: Parts woven from their files

In the `bolts` style, each part SHALL be drawn as its label, a strip and a
caption: one strip segment per owned file in path order, as wide as its share of
the part's bytes and in the dye step of its age band; the strip as thick as
`4 + 16 · √(bytes / most)` px over the edition's largest part; under it the
part's kind, its file count and size, then its leading detail. A part that owns
no files SHALL be an empty dashed strip.

#### Scenario: Shares of a strip

- **WHEN** a part owns two files of 3 KB and 1 KB
- **THEN** its strip has two segments whose widths are three quarters and one
  quarter of its length

#### Scenario: A part without files

- **WHEN** a part owns no files
- **THEN** its strip is a dashed outline at the thinnest thickness and its
  caption says it owns no files

### Requirement: Age bands

An edition SHALL divide its cited files into three age bands by two boundaries
from the spans 1 day, 3 days, 1 week, 1 month, 3 months, 1 year and 3 years,
chosen so the bands hold the counts closest to thirds, ties to the shorter span.
A file's age SHALL be the pin's commit time minus that of its last change at or
before the pin. Every plate of the edition SHALL use the same bands.

#### Scenario: Recent and older files

- **WHEN** an edition's files changed one, ten and four hundred days before the pin
- **THEN** the three files fall in three different bands

### Requirement: Line weights and the hub

In the `bolts` style, a relation's line SHALL be 1.2, 1.8 or 2.4 px for one,
two, or three or more citing files, and 1.2 px when it cites none. The part
with the most incoming relations of a view, when it has at least three and more
than any other part, SHALL be the hub, and the relations into it SHALL be drawn
in the oldest dye.

#### Scenario: A hub

- **WHEN** four relations of a view end at the supplies and at most two at any
  other part
- **THEN** those four lines are in the oldest dye and the key names the supplies

### Requirement: Styles keep the gates

A plate in either style SHALL pass the same containment, balance, type floor,
whole-word text and routing gates, and a view either style cannot fit SHALL be
refused as before.

#### Scenario: The same view in both styles

- **WHEN** one view is composed in `cards` and in `bolts`
- **THEN** both plates pass every gate or the view is refused with the gate's reason

## MODIFIED Requirements

### Requirement: Plate drawing

The engine SHALL draw a plate as an SVG of its shapes, with any icons as inline
paths and no text, paper, head, key or notes, and SHALL report its text as runs:
each run's text, position, size, weight, colour and the width it measured, and
the component whose title it is. Its colours SHALL come from the edition's
resolved palette only.

#### Scenario: Shapes without text

- **WHEN** a plate is drawn
- **THEN** its SVG holds no text and no glyph outlines
- **AND** every card label, detail and relation label is one of its runs

#### Scenario: The 0.12 look

- **WHEN** a model sets `"edition": {"style": "cards", "palette": "forest"}`
- **THEN** its plates are byte for byte those Architecture Publisher 0.12.0 draws
