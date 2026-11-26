## ADDED Requirements

### Requirement: Every code stands in one registry

Every code the publisher raises or reports SHALL stand once in one registry with its meaning, and every raise
SHALL name a registered code. The refusals reference's tables SHALL be written from the registry by a command.

#### Scenario: A raise names an unregistered code

- **WHEN** the source raises a code the registry does not hold
- **THEN** the type check or the test suite fails and names it

#### Scenario: A registered code that nothing raises

- **WHEN** the registry holds a code no source raises
- **THEN** the test suite fails and names it

#### Scenario: The reference differs from the registry

- **WHEN** a table of the refusals reference differs from what the command writes
- **THEN** the check of generated inputs fails and names the document
