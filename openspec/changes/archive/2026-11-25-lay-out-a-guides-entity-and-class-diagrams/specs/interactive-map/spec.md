## ADDED Requirements

### Requirement: A guide's entity and class diagrams laid out by the publisher

A guide's entity-relationship or class file that sets no layout and gives no
item a cell, position or width SHALL be laid out by the publisher: each item a
row and a column, a domain's members filling a solid rectangle of cells, the
first grid by Archify's route measures at the build's quality, the fewest
columns among equals. A domain no grid can hold SHALL be refused with
`page_diagram_unplaceable`, and a file with no grid that passes with
`page_diagram_refused`.

#### Scenario: An entity-relationship file without cells

- **WHEN** a guide's entity-relationship file states entities, a domain and relationships and no cell
- **THEN** the page draws each entity in the cell the publisher chose, the domain's members side by side

#### Scenario: A file that places its items

- **WHEN** a guide's class file gives each type a row and a column
- **THEN** the page draws the file as written
