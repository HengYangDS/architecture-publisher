## ADDED Requirements

### Requirement: Strips sized by their code

With `strip` marks, each part SHALL be drawn as its label, a strip and a
caption. The strip's length SHALL be proportional to the part's bytes on one
scale for the whole edition, at least 2 px for a part with any bytes; every
strip has one thickness. Each owned file is one segment in path order, as wide
as its share of the strip, in the dye of its age band. A part that owns no files
SHALL be a short dashed outline. The key SHALL show a scale bar.

#### Scenario: Shares of a strip

- **WHEN** a part owns two files of 3 KB and 1 KB
- **THEN** its strip has two segments of three quarters and one quarter of its
  length

#### Scenario: One scale

- **WHEN** one part owns 200 KB and another 20 KB in the same edition
- **THEN** the first strip is ten times as long as the second, on every plate

### Requirement: Strips keep to their boxes

A strip SHALL never be shortened to fit a column: no column of a view is
narrower than its longest strip. When a view cannot hold the edition's strips,
the edition SHALL draw every strip shorter, 360 px and then 240 px for its
largest part, on one scale still, and plan its views again.

#### Scenario: A strip keeps to its box

- **WHEN** a view's columns would be narrower than its longest strip
- **THEN** that layout is refused and the plate tries another wrapping, so no
  strip runs past its box or the boundary

#### Scenario: A shorter scale for the edition

- **WHEN** a view cannot be laid out with strips of 360 px for the largest part
- **THEN** every plate of the edition draws its strips at 240 px for the largest
  part, and each key's sample strip shows that scale

### Requirement: Age bands

Every edition SHALL divide its cited files into three age bands counted back
from the pin's commit: changed within a week, within three months, and earlier.
A file's age SHALL be the pin's commit time minus that of its last change at or
before the pin. The key SHALL name the bands and the pin's date.

#### Scenario: Recent and older files

- **WHEN** an edition's files changed one, thirty and four hundred days before
  the pin
- **THEN** the three files fall in three different bands, the same bands every
  edition uses

### Requirement: Citation ticks and the hub

With `strip` marks, every relation's line SHALL be drawn at one weight with one
tick across it near its source for each file the relation cites, up to five
ticks and the count written beside more. The part with the most incoming
relations of a view, when it has at least three and more than any other part,
SHALL be the hub, and the relations into it SHALL be drawn in the oldest dye.

#### Scenario: A hub and its citations

- **WHEN** four relations of a view end at the supplies and one of them cites two
  files
- **THEN** those four lines are in the oldest dye, that line carries two ticks,
  and the key names the supplies

### Requirement: Marks keep the gates

A plate with either marks SHALL pass the same containment, balance, type floor,
whole-word text and routing gates, and a view neither marks can fit SHALL be
refused as before.

#### Scenario: The same view with both marks

- **WHEN** one view is composed with `card` and with `strip` marks
- **THEN** both plates pass every gate or the view is refused with the gate's reason

## MODIFIED Requirements

### Requirement: Plate drawing

The engine SHALL draw a plate as an SVG of its shapes, with any icons as inline
paths and no text, paper, head, key or notes, and SHALL report its text as runs:
each run's text, position, size, weight, colour and the width it measured, and
the component whose title it is. Its colours SHALL come from the edition's
resolved palette only, and on a strip plate relation labels SHALL be set in
the regular weight, so they read under the parts they join.

#### Scenario: Shapes without text

- **WHEN** a plate is drawn
- **THEN** its SVG holds no text and no glyph outlines
- **AND** every card label, detail and relation label is one of its runs
