## ADDED Requirements

### Requirement: Each mark is stroked at one width the house states

Every width the edition strokes outside the table of lines, a card's outline, a tier's ring and bracket, an icon's
strokes, the seal's rules and each mark of the pages, SHALL be a token of the house named by its mark, and no source
of the publisher SHALL give a stroke a width that holds a number of its own or leave a mark to Typst's own width. A
key's sample of a card or a line SHALL be drawn at the width the figure draws it.

#### Scenario: A width that holds a number

- **WHEN** a source of the publisher strokes a mark with a width that holds a number, in an SVG string, in a Typst
  stroke or in the weight a stroke primitive of the class takes
- **THEN** the tests fail and name its file and line

#### Scenario: A mark left to Typst's own width

- **WHEN** a source of the publisher draws a Typst line with no stroke, or a shape with neither a stroke nor a fill
- **THEN** the tests fail and name its file and line

#### Scenario: An outside part in the key

- **WHEN** a plate's key shows an outside part
- **THEN** its sample is stroked with the token the figure strokes a card with, at the plate's scale

#### Scenario: A planned or a retired status in the key

- **WHEN** a plate's key shows a planned or a retired status
- **THEN** its sample is a line at the weight of a relation's row of the table, at the plate's scale, in the dash
  the status's row names for the key
