## ADDED Requirements

### Requirement: Overview statement

A model MAY state `overview` as an object of blocks: `claim`, `lead`, `course`,
`courses` and `facts`, with no property that states a position, a size or a
type. A string in `overview`, the path of a retired composition, SHALL be
refused at `/overview` with `model_overview_composition_retired`.

#### Scenario: A statement

- **WHEN** a model states an overview with a claim, a lead and a course of three steps
- **THEN** the model validates and keeps the statement

#### Scenario: A composition named

- **WHEN** a model names `overview.typ` in `overview`
- **THEN** validation refuses it at `/overview` with `model_overview_composition_retired`

## REMOVED Requirements

### Requirement: Overview composition reference

**Reason**: The overview is stated in the model; a composition file is retired.

**Migration**: Replace the path with the overview's statement.
