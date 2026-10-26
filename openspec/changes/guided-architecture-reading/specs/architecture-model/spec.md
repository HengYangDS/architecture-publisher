## Purpose

Accept one explicit, portable Architecture Model of any repository, authored by
an agent or a person or imported from LikeC4, and preserve its identities and
meaning in every output.

## ADDED Requirements

### Requirement: One explicit model input

The publisher SHALL accept one Architecture Model file as its only input. The
model SHALL declare components and relations and MAY declare a repository,
sources, kinds, groups, views, scope, limits and attribution. The publisher
SHALL NOT infer components or relations from repository contents.

#### Scenario: A minimal model builds

- **WHEN** a model declares only an id, a title, a question, components with an
  id and a label, and relations with an id, endpoints and a label
- **THEN** the build succeeds with default kinds, statuses and views
- **AND** every declared component and relation appears in the poster and the
  map

#### Scenario: No model is supplied

- **WHEN** a build names a repository but no model
- **THEN** the command refuses as a usage error without reading the repository

### Requirement: Complete validation before output

The publisher SHALL validate the model against its published schema and its
references before any output. It SHALL refuse unknown fields, unsupported
format versions, duplicate identifiers, empty labels, references to undeclared
components, groups or sources, and relations whose endpoints are absent, and
it SHALL report every problem with its JSON path in one result.

#### Scenario: Several problems are reported together

- **WHEN** a model has a duplicate component id and a relation to an
  undeclared component
- **THEN** the build refuses with both problems and their JSON paths
- **AND** no output directory is created

#### Scenario: An unsupported format version

- **WHEN** a model declares a format version the installed publisher does not
  support
- **THEN** the build refuses and names the supported version

### Requirement: Identity and meaning are preserved

The publisher SHALL carry every component, relation, group, view and source
identifier, every label, kind, detail and status, and the scope, limits and
attribution into the manifest unchanged. Presentation SHALL NOT rename, merge,
reorder the details of or invent model elements; sharing one label among
relations with the same source, label and details SHALL keep each relation
and its own route.

#### Scenario: Details survive into every medium

- **WHEN** a relation declares the detail `state: desired client bindings`
- **THEN** the poster prints it beside that relation
- **AND** the map's evidence card and the manifest record it for that
  relation id

#### Scenario: Fan-out relations share a label

- **WHEN** four relations from one component have the same label and no
  details
- **THEN** the poster prints that label once on their shared route
- **AND** the manifest still lists four relations with their own ids

### Requirement: Editorial decisions are optional

Kinds, statuses, groups and views SHALL be optional. When kind labels,
legend order or interactive categories are absent, the publisher SHALL derive
them deterministically from the order in which kinds first appear.

#### Scenario: Kinds without declarations

- **WHEN** components use three kinds that the model does not declare
- **THEN** the legend lists them in first-appearance order with their kind
  names as labels
- **AND** a rebuild assigns the same glyphs and color families

### Requirement: LikeC4 import

`archpub import likec4` SHALL convert a LikeC4 workspace into a valid model:
elements become components, relationships become relations, element kinds
become kinds, parent elements become groups and views become flow views. It
SHALL report each construct without a model equivalent with its LikeC4
location and SHALL NOT drop one silently.

#### Scenario: An imported workspace builds

- **WHEN** a LikeC4 workspace with nested elements, relationships and one view
  is imported and then built
- **THEN** the model validates and the build produces that view's poster and
  map

#### Scenario: An unsupported construct

- **WHEN** the workspace contains a construct the model cannot represent
- **THEN** the import result lists it with its file and line
- **AND** the written model contains no substitute for it
