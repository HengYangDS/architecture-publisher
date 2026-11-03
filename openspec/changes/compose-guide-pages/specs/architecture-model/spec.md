## ADDED Requirements

### Requirement: Guide composition reference

A model SHALL be able to name `guide`, the path of its guide composition, an
Archify explainer draft, relative to the model file. The path SHALL be
relative, stay within the model's directory and end in `.archify.md`; any other
value SHALL be refused at `/guide`.

#### Scenario: A guide in its own directory

- **WHEN** a model names `guide/guide.archify.md`
- **THEN** the model validates and keeps the path

#### Scenario: A path that is not a draft

- **WHEN** a model names `guide.md`
- **THEN** validation refuses it at `/guide`
