## ADDED Requirements

### Requirement: Native editorial input remains readable and non-invasive

The public build SHALL admit selected native material and declarative editorial
choices through one authoring owner, without requiring a duplicate Claim Model.
Editorial preparation and optional Providers SHALL remain outside source
products; publication SHALL add no files, code, dependencies, configuration,
tests or CI obligations there. Deterministic rebuilds SHALL require no Agent.

#### Scenario: An editor supplies reader questions

- **WHEN** the brief names audience, questions, scope, omissions and media
- **THEN** those choices are ordinary editable data, not executable queries
- **AND** actionable diagnostics identify the affected choice without inventing source meaning

#### Scenario: A source product has no publication integration

- **WHEN** an external editor selects existing source material read-only
- **THEN** preparation, compilation and output stay outside the source product
- **AND** source files, dependencies and quality obligations remain unchanged

### Requirement: Native source facts and view occurrences remain distinct

The disposable native index SHALL preserve source entities, explicit source
parentage and directed relationships independently from each authored view's
nodes and edges. Source identity SHALL come from the native model binding, not
the occurrence ID or its wording. View wording SHALL NOT replace source wording.

#### Scenario: A collapsed view resembles a path that the source does not contain

- **WHEN** a view draws `a -> b -> c` for source relations `a -> b.b1` and `b.b2 -> c`
- **THEN** the index retains both exact source relationships and their individual view-edge bindings
- **AND** source ancestry comes from native parent references, never inferred name prefixes
- **AND** the view does not establish source reachability from `a` to `c`

#### Scenario: A view repeats or groups source elements

- **WHEN** native occurrences have different IDs, share a source binding or belong to a view-only group
- **THEN** the index preserves each occurrence, its parent and its native label
- **AND** a view-only group has no source entity binding
- **AND** several view edges may refer to the same source relationship without duplicating the source fact

### Requirement: Native projection boundaries are checked before consumption

The parent SHALL admit only `architecture.native-index/v2`, with complete
source and occurrence references, unique IDs and acyclic explicit parentage.
Each view edge SHALL retain nonempty, unique contributing source references.
Membership summaries SHALL be derived from the projection, not stored twice.

#### Scenario: An index reply is malformed or misbound

- **WHEN** a reply contains a dangling reference, parent cycle, duplicate occurrence or unrelated edge contributor
- **THEN** the parent rejects it before compilation
- **AND** a legacy index is not silently adapted

#### Scenario: A consumer cannot faithfully express the native projection

- **WHEN** the current structural selection or layout cannot express hidden endpoints, groups, repeated occurrences or view wording
- **THEN** that consumer explicitly refuses the unsupported projection without altering it
- **AND** it does not add hidden entities to the visible membership or clear known source relationships
- **AND** supported parallel relations with exact endpoints retain their existing layout behavior

#### Scenario: Only view wording changes

- **WHEN** selected native view bytes change a node or edge label without changing source wording
- **THEN** the index retains both meanings separately and existing input identity binds the new bytes
- **AND** disposable occurrence IDs are not added to the semantic selection digest
