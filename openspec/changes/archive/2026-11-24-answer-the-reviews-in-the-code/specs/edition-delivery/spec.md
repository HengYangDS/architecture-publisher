## MODIFIED Requirements

### Requirement: A line back to the overview

Where an element of the overview names one of a plate's views, the plate's head
SHALL carry a line back on the question's line, after the question: the words of
the first such element in the statement's order, or the edition's word for the
overview where those words are the plate's title, linked to the overview's page.

#### Scenario: A block that names a view

- **WHEN** a block titled Terms is the first element that names a plate's view
- **THEN** the plate's head reads "↖ Terms" after its question, linked to the overview's page

#### Scenario: An element bearing the plate's title

- **WHEN** the first element that names a plate's view bears the plate's title
- **THEN** the line back reads "↖" and the edition's word for the overview

#### Scenario: A view the overview does not name

- **WHEN** no element of the overview names a plate's views
- **THEN** the plate's head has no line back

### Requirement: An answer in the head band

Where a plate's figure keeps the full body and sets no summary above it, the
plate's head SHALL set its view's summary right of the title and of the
question's line with its line back as shown, 48 points clear of the wider, from
the title's baseline at 17 points on a 24-point pitch, in three lines at most
above the body. A longer one SHALL be refused with `edition_reading_too_long`.

#### Scenario: A silent plate's answer

- **WHEN** a view's figure can neither narrow nor shorten below its summary
- **THEN** the summary begins on the title's baseline, clear of the question, and ends above the body

#### Scenario: An answer too long for the head

- **WHEN** the summary would take more than three lines there
- **THEN** the build refuses with `edition_reading_too_long`

#### Scenario: An answer beside a line back that gave way

- **WHEN** a plate's line back gave way to the edition's word for the overview
- **THEN** the answer stands 48 points clear of that word, not of the words that gave way

## ADDED Requirements

### Requirement: A line back that gives way

A line back whose words would pass the margin SHALL give way to the edition's
word for the overview, and where that would pass the margin too, the plate's
head SHALL carry no line back. A plate SHALL NOT be refused for its line back.

#### Scenario: An element's words too long for the room

- **WHEN** the question leaves too little room for the words of the element that names the plate's view
- **THEN** the line back reads "↖" and the edition's word for the overview

#### Scenario: A question too long for any line back

- **WHEN** the question leaves too little room even for the edition's word for the overview
- **THEN** the plate is built, and its head has no line back
