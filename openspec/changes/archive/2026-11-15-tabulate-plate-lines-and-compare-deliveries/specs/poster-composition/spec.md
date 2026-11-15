## REMOVED Requirements

### Requirement: Citation ticks and the hub

**Reason**: the first step's reading check found ticks unreadable for one of two holders at every image size (88
right of 162, against 54 of 54 for a number), and found that a hub's lines differ from other lines by colour alone.

**Migration**: none for a model. A plate built from an unchanged model shows each relation's cited files as a
number and the hub's lines at twice the weight; see `Citation counts and the hub`.

## ADDED Requirements

### Requirement: Citation counts and the hub

With `strip` marks, a relation that cites files SHALL carry their number once near its source, in the smallest
figure type and its line's colour, and no tick. The part with the most incoming relations of a view, when it has at
least three and more than any other, SHALL be the hub. A relation into the hub, unless retired, SHALL be drawn with
the value table's emphasis, in the oldest dye, ending inside its arrowhead. A count with no clear place SHALL raise
`citation_count_touches`.

#### Scenario: A hub and its citations

- **WHEN** four relations of a view end at the supplies and one of them cites two files
- **THEN** those four lines are drawn at twice the weight of the view's other lines, in the oldest dye, each ending
  inside an arrowhead 1.45 times as large as the other lines'
- **AND** that line carries the number 2 near its source and no tick
- **AND** the key names the supplies

#### Scenario: A relation that cites one file

- **WHEN** a relation cites one file
- **THEN** its line carries the number 1

#### Scenario: A relation that cites no file

- **WHEN** a relation cites no file
- **THEN** its line carries no number

#### Scenario: A planned relation into the hub

- **WHEN** a planned relation ends at the hub
- **THEN** it is drawn at twice the weight, in the oldest dye and in the pattern of a planned relation

#### Scenario: A retired relation into the hub

- **WHEN** a retired relation ends at the hub
- **THEN** it is drawn at the weight, in the colour and in the pattern of a retired relation

#### Scenario: A count with no clear place

- **WHEN** no place along a relation's own line holds its figures clear of every part, relation label, line, the
  boundary and every other count
- **THEN** the count stands at the first place from the source end and the plate is still built
- **AND** the result carries the warning `citation_count_touches` with the plate's number and the relation's id
