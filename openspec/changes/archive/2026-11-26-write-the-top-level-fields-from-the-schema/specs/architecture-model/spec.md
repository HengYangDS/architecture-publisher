## ADDED Requirements

### Requirement: The model's top-level fields described once

Each top-level field of the model SHALL be described once, in the model's schema, which an author's editor shows. The
model reference's table of top-level fields SHALL be written from the schema by a command: each field, whether it is
required, its description and what the schema states of its value.

#### Scenario: A reference that differs from the schema

- **WHEN** the model reference's table of top-level fields differs from what the command writes
- **THEN** the check of generated inputs fails and names the document

#### Scenario: A field the schema does not describe

- **WHEN** a top-level field of the schema has neither a description nor a constant
- **THEN** the command stops and names the field
