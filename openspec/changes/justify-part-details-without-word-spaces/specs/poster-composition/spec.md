## MODIFIED Requirements

### Requirement: Plate drawing

The engine SHALL draw a plate as an SVG of its shapes, with any icons as inline
paths and no text, paper, head, key or notes, and SHALL report its text as runs:
each run's text, position, size, weight, colour and the width it measured, the
component whose title it is and, for a line to be spread, its measure. In an
edition written without spaces between words a strip part's counts SHALL end at
its box's edge, and they and each line of details SHALL report the width Typst
sets them in. Its colours SHALL come from the edition's resolved palette only,
and on a strip plate relation labels SHALL be set in the regular weight, so they
read under the parts they join.

#### Scenario: Shapes without text

- **WHEN** a plate is drawn
- **THEN** its SVG holds no text and no glyph outlines
- **AND** every card label, detail and relation label is one of its runs

#### Scenario: A line to be spread

- **WHEN** a plate of a language written without spaces between words holds a
  detail line, not its detail's last, whose slack is no more than a tenth of an
  em for each place it opens
- **THEN** that line's run names the measure, and the part's text block is
  measured at it

#### Scenario: A detail's last line

- **WHEN** a plate of a language written without spaces between words holds a
  detail's last line of Han and letters
- **THEN** its run names no measure and reports the width Typst sets it in,
  narrower than the CJK face alone measures it

### Requirement: Faces of figure text

Figure text SHALL be measured in the house faces, each run in the first face of
its weight's chain that draws it whole: Source Sans 3, then Noto Sans CJK SC.
Each house face SHALL be measured with the pair kerning of its own `kern`
feature, so a run of letters is as wide as Typst sets it. A text in a
right-to-left or shaped script, or with a character no face draws, SHALL be
refused.

#### Scenario: Letters the CJK face lacks

- **WHEN** a component label is `Łódź`
- **THEN** the label is measured in Source Sans 3 and the build is not refused

#### Scenario: An Arabic title

- **WHEN** a model's title is written in Arabic
- **THEN** the build refuses with `glyphs_missing` and the problem
  `script_unsupported` at `/title`

#### Scenario: Pairs kerned apart

- **WHEN** a part's detail reads `format: (json)`
- **THEN** its run is measured as wide as Typst sets it, with the bracket and
  the j apart, and the build is not refused
