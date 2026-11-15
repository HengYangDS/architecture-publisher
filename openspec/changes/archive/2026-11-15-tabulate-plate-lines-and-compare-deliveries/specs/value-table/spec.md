## Purpose

Hold in one table the weights, patterns and marks a plate draws its lines with, each row admitted by a trial or
reported as untested, so that the figure, the key, the documents and the tests read one source and one value of a
channel has one meaning.

## ADDED Requirements

### Requirement: One table of line values

The product SHALL hold the weights, patterns and marks of a plate's lines in one table inside the product, keyed by
what each row means. A row SHALL state its meaning, its channel, its value in the plate's drawing space, the
figure-reading question it answers, whether a work has tested it, and what the page does for it. The figure, the
key, the documents' reference table and the tests SHALL take every such value from the table, and a model SHALL NOT
name, add or change a row.

#### Scenario: A value changed in the table

- **WHEN** the table gives the system boundary another gap
- **THEN** a plate's boundary and the key's sample of it are drawn with that gap
- **AND** the test of the documents' reference table fails until the document shows that gap

#### Scenario: A model names a line value

- **WHEN** a model's `edition` names a line weight or pattern
- **THEN** the check refuses the model at that field

#### Scenario: A row the page cannot express

- **WHEN** the table's row for emphasis says the page has no expression of it
- **THEN** the reference table says so, and no check refuses a model or a build for it

### Requirement: Rows admitted by trial

The table SHALL hold these rows and no other: a relation, a continuous line of one weight; emphasis, twice that
weight with an arrowhead 1.45 times as large, for a relation into the view's hub; the system boundary, dashed as the
trial measured it; the number of files a relation cites; and the patterns of a planned and of a retired part or
relation, each marked as not yet tested by a work. The documents' reference table SHALL show every row and print
that mark.

#### Scenario: The reference table

- **WHEN** the reference table in the documents is compared with the table
- **THEN** it holds one line for each row, with the row's meaning, value, question and what the page does for it

#### Scenario: A row no work has tested

- **WHEN** the reference table lists the pattern of a planned relation
- **THEN** the line says that no work has tested it

### Requirement: Untested rows are reported

A build or a check whose plates draw a row that no work has tested SHALL carry the warning `line_row_untested`,
naming the row's meaning and the plates that draw it, and SHALL refuse nothing for it. A plate that draws no such
row SHALL raise no such warning.

#### Scenario: A plate with a planned relation

- **WHEN** a work whose second plate shows a planned relation is checked
- **THEN** the result carries `line_row_untested` and names plate 02

### Requirement: One meaning for each value of a channel

No two rows of the table SHALL give one value of one channel to two meanings, and a channel SHALL hold no more
levels than the trial told apart: line weight holds two. On a plate the weight of a relation's line SHALL carry
emphasis and nothing else.

#### Scenario: Two weights on a plate

- **WHEN** a strip plate with a hub is built
- **THEN** its relations' lines have two weights, and every line of the heavier weight ends at the hub

### Requirement: Lines told apart without colour

Every two tested rows that are drawn as lines SHALL be distinguishable on a plate's image 1920 px wide, and on that
image reduced to grey: by effective widths at least 1.0 px apart and core widths at least 1 px apart, or by a pattern
whose median dash and median gap are each at least 2 px. No two rows SHALL differ in colour alone. The rows not yet
tested by a work are outside this requirement.

#### Scenario: Emphasis at the base condition

- **WHEN** a strip plate with a hub is rendered 1920 px wide
- **THEN** the lines into the hub and the other lines differ by at least 1.0 px of effective width and 1 px of core
  width, in colour and in grey

#### Scenario: The boundary at the base condition

- **WHEN** a plate with a boundary is rendered 1920 px wide
- **THEN** the boundary's median dash and median gap are each at least 2 px

### Requirement: A bound channel follows its fact

When one fact of a model changes and the layout is held, exactly the matching channel of the matching marks SHALL
change on the plate: a change of the hub SHALL change the weight of the lines into the old and the new hub and of no
other line, and a change of the files a relation cites SHALL change that relation's number and no other mark.

#### Scenario: The hub moves

- **WHEN** one relation's target is changed so that another part becomes the view's hub, and the layout is held
- **THEN** only the lines into the two parts change weight

#### Scenario: One more cited file

- **WHEN** a relation cites one more file
- **THEN** only that relation's number changes on the plate

### Requirement: Plates draw only the table's values

On a built plate every relation's line, every status's pattern and the boundary SHALL be drawn with a weight and a
pattern of the table, and the drawing code SHALL hold no weight or pattern of its own for them. Widths that are not a
relation's line or the boundary, such as the outline of a part that owns no files, a tier's ring, a card's outline
and an icon's strokes, are outside the table.

#### Scenario: Every weight of the table scaled

- **WHEN** a plate is built from a copy of the table in which every weight is one quarter heavier
- **THEN** every relation's line and the boundary on the plate are one quarter heavier

### Requirement: One weight for every piece of a row

On a plate's page picture every straight piece of one row of the table SHALL have one weight, wherever on the
figure it stands: no piece draws less than three quarters of the ink of its row's median piece, and none is absent.
This SHALL hold at the delivered widths and at any width a caller names, because the figure is placed so that the
picture keeps every column and row of it.

#### Scenario: A piece on the figure's middle column

- **WHEN** a relation's line has an upright piece on the figure's middle column
- **THEN** on the pictures 2400, 1920 and 960 px wide that piece has the weight of the row's other pieces

#### Scenario: A width a caller names

- **WHEN** an edition's pictures are asked for at 1012 px
- **THEN** the picture leaves out no column and no row of the figure

### Requirement: Each invariant's test fails on a broken table

For each invariant above and for the key's rule that it holds exactly the rows its figure draws, the tests SHALL
hold a deliberately broken table and SHALL show that the invariant's test fails on it, with a message that names
the row.

#### Scenario: A second meaning on one weight

- **WHEN** the table gives a second row the weight of emphasis
- **THEN** the test of one meaning for each value fails and names both rows

#### Scenario: Emphasis too light to tell apart

- **WHEN** the table gives emphasis one and a half times the weight of a relation
- **THEN** the test of lines told apart fails on the 1920 px image

#### Scenario: Emphasis that does not follow its fact

- **WHEN** the table gives emphasis the weight of a relation
- **THEN** the test that moves the hub fails, because no line changes weight

#### Scenario: A row without a key entry

- **WHEN** the table's row for emphasis has no sample for the key
- **THEN** the test of the key fails on a plate with a hub, whose figure draws a row its key does not hold

#### Scenario: A weight outside the table

- **WHEN** the table lacks the boundary's row
- **THEN** the build of a plate with a boundary fails, and the error names the missing row
