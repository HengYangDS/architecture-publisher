## MODIFIED Requirements

### Requirement: One meaning for each value of a channel

No two rows of the table SHALL give one value of one channel to two meanings, and a channel SHALL hold no more
levels than the trial told apart: line weight holds two. On a plate the weight of a relation's line SHALL carry
emphasis and nothing else.

#### Scenario: Two weights on a plate

- **WHEN** a plate with a hub is built
- **THEN** its relations' lines have two weights, and every line of the heavier weight ends at the hub

### Requirement: Lines told apart without colour

Every two tested rows that are drawn as lines SHALL be distinguishable on a plate's image 1920 px wide, and on that
image reduced to grey: by effective widths at least 1.0 px apart and core widths at least 1 px apart, or by a pattern
whose median dash and median gap are each at least 2 px. No two rows SHALL differ in colour alone. The rows not yet
tested by a work are outside this requirement.

#### Scenario: Emphasis at the base condition

- **WHEN** a plate with a hub is rendered 1920 px wide
- **THEN** the lines into the hub and the other lines differ by at least 1.0 px of effective width and 1 px of core
  width, in colour and in grey

#### Scenario: The boundary at the base condition

- **WHEN** a plate with a boundary is rendered 1920 px wide
- **THEN** the boundary's median dash and median gap are each at least 2 px

### Requirement: Plates draw only the table's values

On a built plate every relation's line, every status's pattern and the boundary SHALL be drawn with a weight and a
pattern of the table, and the drawing code SHALL hold no weight or pattern of its own for them. Widths that are not a
relation's line or the boundary, such as a tier's ring, a card's outline and an icon's strokes, are outside the
table.

#### Scenario: Every weight of the table scaled

- **WHEN** a plate is built from a copy of the table in which every weight is one quarter heavier
- **THEN** every relation's line and the boundary on the plate are one quarter heavier
