## ADDED Requirements

### Requirement: A gap in a line

The engine SHALL fill nothing with the colour of the page. A line and the boundary's edge SHALL be broken where a
relation's label or the boundary's name stands on them, by a clip path that leaves those boxes out, so that a
figure reads on any light ground.

#### Scenario: A line under a label

- **WHEN** a relation's line passes where its label stands
- **THEN** the line is drawn on both sides of the label's box and not within it
- **AND** the plate's SVG holds no shape filled with the paper's colour

## MODIFIED Requirements

### Requirement: Age bands

Every edition SHALL divide the files its parts own into three age bands counted back from the pin's commit: changed
within a week, over a week and within three months, and earlier. A file's age SHALL be the pin's commit time minus
that of its last change at or before the pin. The key SHALL say what the bands count from and name each band by its
bounds and a unit and no more, the middle band by both its bounds, so that no file's age fits the names of two
bands.

#### Scenario: Recent and older files

- **WHEN** an edition's files changed one, thirty and four hundred days before the pin
- **THEN** the three files fall in three different bands, the same bands every edition uses

#### Scenario: A file a relation cites and no part owns

- **WHEN** a relation cites a file that no part owns
- **THEN** the file falls in no band, and no strip shows it

#### Scenario: The middle band's name

- **WHEN** a plate's key names the band of files changed over 7 and within 90 days before the pin
- **THEN** its words hold both numbers, in every language the publisher speaks

#### Scenario: A band's words

- **WHEN** a plate's key names its three bands in English
- **THEN** it reads `≤ 7 d`, `7–90 d` and `> 90 d` after the entry that says they count back from the commit
