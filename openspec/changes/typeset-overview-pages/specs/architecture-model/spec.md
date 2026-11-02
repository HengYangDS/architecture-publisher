## ADDED Requirements

### Requirement: Overview composition reference

A model SHALL be able to name `overview`, the path of its overview composition
relative to the model file. The path SHALL be relative, stay within the model's
directory and end in `.typ`; any other value SHALL be refused at `/overview`.

#### Scenario: A composition beside the model

- **WHEN** a model names `overview.typ`
- **THEN** the model validates and keeps the path

#### Scenario: A path that leaves the model's directory

- **WHEN** a model names `../overview.typ`
- **THEN** validation refuses it at `/overview`
