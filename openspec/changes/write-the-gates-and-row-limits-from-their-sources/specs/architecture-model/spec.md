## MODIFIED Requirements

### Requirement: The references' measures written from their sources

The model reference's strip lengths, age bands, colours of a palette of a model's own and most cards a plate's row
holds, the lines reference's measured widths and the operations reference's balance gates SHALL be written by a
command from the modules and the schema that state them, and the agent Skill's row limits likewise. The model
reference's smallest model and the tutorial's model SHALL load as valid models.

#### Scenario: A measure that differs from its source

- **WHEN** the model reference's sentence of the strip's lengths differs from what the command writes
- **THEN** the check of generated inputs fails and names the document

#### Scenario: A gate that differs from its source

- **WHEN** the operations reference's sentence of the balance gates differs from what the command writes
- **THEN** the check of generated inputs fails and names the document

#### Scenario: A row limit that differs from its source

- **WHEN** the Skill's sentence of the cards a plate's row holds differs from what the command writes
- **THEN** the check of generated inputs fails and names the Skill

#### Scenario: An example of an earlier version

- **WHEN** the model reference's smallest model states a version the schema does not accept
- **THEN** the test suite fails
