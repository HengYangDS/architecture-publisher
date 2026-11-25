## MODIFIED Requirements

### Requirement: A guide's architecture diagram laid out by the publisher

A guide's architecture file SHALL be laid out by the publisher at the build's
quality: Archify's own layouts, ranked, repaired and pinned as the generated
page's diagrams are. The page SHALL draw the chosen layout with the file's
sources; the manifest SHALL record the author's file.

#### Scenario: An architecture file without places

- **WHEN** a guide's architecture file states parts and connections and no position, size, row, column or layout
- **THEN** the page is built with the diagram the publisher chose, and the manifest records the author's file

#### Scenario: An architecture file that places its parts

- **WHEN** a guide's architecture file gives each part a position and a size
- **THEN** the build refuses with `page_diagram_publisher_field`, naming each field

### Requirement: A guide's entity and class diagrams laid out by the publisher

A guide's entity-relationship or class file SHALL be laid out by the
publisher: each item a row and a column, a domain's members filling a solid
rectangle of cells, the first grid by Archify's route measures at the build's
quality, the fewest columns among equals. A domain no grid can hold SHALL be
refused with `page_diagram_unplaceable`, and a file with no grid that passes
with `page_diagram_refused`.

#### Scenario: An entity-relationship file without cells

- **WHEN** a guide's entity-relationship file states entities, a domain and relationships and no cell
- **THEN** the page draws each entity in the cell the publisher chose, the domain's members side by side

#### Scenario: A file that places its items

- **WHEN** a guide's class file gives each type a row and a column
- **THEN** the build refuses with `page_diagram_publisher_field`, naming each field

### Requirement: A guide's workflow laid out by the publisher

A guide's workflow file SHALL be laid out by the publisher: each node's column
the longest path to it along the edges, an edge within one lane one step and an
edge across lanes none, two nodes of one lane never in one column. A workflow
that needs more than six columns SHALL be refused with
`page_workflow_too_wide`.

#### Scenario: A workflow without columns

- **WHEN** a guide's workflow states lanes, nodes and edges and no column
- **THEN** the page draws each node in the column the publisher chose, a hand-off between lanes in one column

#### Scenario: A workflow too long

- **WHEN** a guide's workflow's edges run through seven steps in one lane
- **THEN** the build refuses with `page_workflow_too_wide`

## ADDED Requirements

### Requirement: A guide's diagram files leave placing and the repository to the publisher

A guide's diagram file SHALL state no field the publisher sets: a position, a
size, a cell, a column, a layout, the course of a line, a workflow's phase or
group, or a repository. A guide whose files state one SHALL be refused with
`page_diagram_publisher_field` when it is read, each field a problem. With a
checkout, every diagram file SHALL name the model's repository URL and
revision, with the Forge and link mode the draft names.

#### Scenario: A placed file

- **WHEN** a guide's architecture file gives a part a position
- **THEN** the build refuses with `page_diagram_publisher_field`, naming the field's path

#### Scenario: The repository from the model

- **WHEN** a build with a checkout reads a guide's diagram file and the model names its repository URL and revision
- **THEN** the page draws the file with the model's repository and revision
