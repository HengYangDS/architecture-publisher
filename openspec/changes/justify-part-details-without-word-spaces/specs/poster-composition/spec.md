## MODIFIED Requirements

### Requirement: Plate drawing

The engine SHALL draw a plate as an SVG of its shapes, with any icons as inline
paths and no text, paper, head, key or notes, and SHALL report its text as runs:
each run's text, position, size, weight, colour and the width it measured, the
component whose title it is and, for a line to be spread, its measure. Its
colours SHALL come from the edition's resolved palette only, and on a strip
plate relation labels SHALL be set in the regular weight, so they read under the
parts they join.

#### Scenario: Shapes without text

- **WHEN** a plate is drawn
- **THEN** its SVG holds no text and no glyph outlines
- **AND** every card label, detail and relation label is one of its runs

#### Scenario: A line to be spread

- **WHEN** a plate of a language written without spaces between words holds a
  detail line that fills its measure
- **THEN** that line's run names the measure, and the part's text block is
  measured at it
