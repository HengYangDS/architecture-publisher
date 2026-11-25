## ADDED Requirements

### Requirement: A guide's dataflow and sequence laid out by the publisher

A guide's dataflow file SHALL be laid out on the publisher's rows: each
stage's nodes ordered by their neighbours, each stage in a row pattern of
Archify's own examples, the first candidate Archify passes with every route
measure zero drawn, else the first it passes. A stage of more than five nodes SHALL be refused with
`page_dataflow_too_tall`. A guide's sequence file SHALL take messages 48 apart
from 160 down.

#### Scenario: A dataflow without rows

- **WHEN** a guide's dataflow file states stages, nodes and flows and no row
- **THEN** the page draws each node in the row the publisher chose

#### Scenario: A dataflow that sets a row

- **WHEN** a guide's dataflow file gives a node a row
- **THEN** the build refuses with `page_diagram_publisher_field`, naming the field

#### Scenario: A stage too tall

- **WHEN** a guide's dataflow file has a stage of six nodes
- **THEN** the build refuses with `page_dataflow_too_tall`

#### Scenario: A sequence without heights

- **WHEN** a guide's sequence file states participants and messages and no height
- **THEN** the page draws each message at the publisher's height
