## ADDED Requirements

### Requirement: A line back to the overview

Where an element of the overview names one of a plate's views, the plate's head
SHALL carry a line back on the question's line, after the question: the words of
the first such element in the statement's order, or the edition's word for the
overview where those words are the plate's title, linked to the overview's page.
A line back that would pass the margin SHALL be refused with `edition_text_wider`.

#### Scenario: A block that names a view

- **WHEN** a block titled Terms is the first element that names a plate's view
- **THEN** the plate's head reads "↖ Terms" after its question, linked to the overview's page

#### Scenario: An element bearing the plate's title

- **WHEN** the first element that names a plate's view bears the plate's title
- **THEN** the line back reads "↖" and the edition's word for the overview

#### Scenario: A view the overview does not name

- **WHEN** no element of the overview names a plate's views
- **THEN** the plate's head has no line back

## MODIFIED Requirements

### Requirement: Plate head and key

A plate's head SHALL be its number, its view's title, its question and its line back. Its key SHALL list what its figure shows and
cannot say where it stands, and no more, on one line where the body holds it, its baseline at 850 points on every
plate and each mark centred on its label's mid-line: what the age bands count from and the bands, the scale bar,
the citation count, the hub, the boundary, the statuses and the ground of a part outside the repository. It SHALL
list no kind.

#### Scenario: A plate's key

- **WHEN** a plate's figure shows commands and checks inside the boundary
- **THEN** its key lists the boundary on one line above the foot and neither kind, and each card names its kind
  beside the kind's icon

#### Scenario: A strip plate's key

- **WHEN** a plate shows files in all three bands and relations that cite files and no hub
- **THEN** its key says that the bands count back from the commit and names the three bands, the scale bar and the
  citation count, and no hub

#### Scenario: A part outside the repository

- **WHEN** a plate shows a part outside the repository
- **THEN** its key holds the ground of such a part with the edition's word for outside

#### Scenario: Marks of different heights

- **WHEN** a plate's key holds a band, a sample strip, a citation count, a hub's line and a boundary's outline
- **THEN** each is centred on the same line as the labels' text
