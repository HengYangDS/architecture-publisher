## ADDED Requirements

### Requirement: A guide's workflow laid out by the publisher

A guide's workflow file whose nodes name no column and that states no phase or
group SHALL be laid out by the publisher: each node's column the longest path to
it along the edges, an edge within one lane one step and an edge across lanes
none, two nodes of one lane never in one column. A workflow that needs more than
six columns SHALL be refused with `page_workflow_too_wide`; a file that names a
column, a phase or a group SHALL be drawn as written.

#### Scenario: A workflow without columns

- **WHEN** a guide's workflow states lanes, nodes and edges and no column
- **THEN** the page draws each node in the column the publisher chose, a hand-off between lanes in one column

#### Scenario: A workflow too long

- **WHEN** a guide's workflow's edges run through seven steps in one lane
- **THEN** the build refuses with `page_workflow_too_wide`
