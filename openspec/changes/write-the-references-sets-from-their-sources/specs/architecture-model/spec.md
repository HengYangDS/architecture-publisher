## MODIFIED Requirements

### Requirement: The model's top-level fields described once

Each top-level field of the model SHALL be described once, in the model's schema, which an author's editor shows. The
model reference's table of top-level fields SHALL be written from the schema by a command: each field, whether it is
required, its description and the values it takes.

#### Scenario: A reference that differs from the schema

- **WHEN** the model reference's table of top-level fields differs from what the command writes
- **THEN** the check of generated inputs fails and names the document

#### Scenario: A field the schema does not describe

- **WHEN** a top-level field of the schema has no description
- **THEN** the command stops and names the field

## ADDED Requirements

### Requirement: The references' measures written from their sources

The model reference's strip lengths, age bands and colours of a palette of a model's own, and the lines reference's
measured widths, SHALL be written by a command from the modules and the schema that state them. The model reference's
smallest model and the tutorial's model SHALL load as valid models.

#### Scenario: A measure that differs from its source

- **WHEN** the model reference's sentence of the strip's lengths differs from what the command writes
- **THEN** the check of generated inputs fails and names the document

#### Scenario: An example of an earlier version

- **WHEN** the model reference's smallest model states a version the schema does not accept
- **THEN** the test suite fails
