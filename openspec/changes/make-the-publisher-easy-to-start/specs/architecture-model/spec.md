## MODIFIED Requirements

### Requirement: Complete validation before output

The publisher SHALL validate the model against its published schema and its
references before any output. It SHALL refuse unknown fields, unsupported
format versions, duplicate identifiers, empty labels, references to undeclared
components or groups, relations whose endpoints are absent and invalid file
paths, and it SHALL report every problem with its JSON path in one result.

#### Scenario: Several problems are reported together

- **WHEN** a model has a duplicate component id and a relation to an
  undeclared component
- **THEN** the build refuses with both problems and their JSON paths
- **AND** no output directory is created

#### Scenario: An unsupported format version

- **WHEN** a model declares a format version the installed publisher does not
  support
- **THEN** the build refuses and names the supported version

#### Scenario: A version 1 model

- **WHEN** a model declares version 1
- **THEN** the build refuses and names `archpub migrate`

## ADDED Requirements

### Requirement: Help for an author's editor

A model MAY carry `$schema`, a reference to the schema for its editor, which the
publisher does not read. An unknown field's message SHALL name the nearest field
that object has when one differs from it by at most a third of its letters.

#### Scenario: A misspelt field

- **WHEN** a model has a top-level field `vews`
- **THEN** the build refuses with `model_field_unknown` at `/vews`
- **AND** the message names `views`

#### Scenario: A schema reference

- **WHEN** a model's top level carries `$schema`
- **THEN** the model validates as it would without it
