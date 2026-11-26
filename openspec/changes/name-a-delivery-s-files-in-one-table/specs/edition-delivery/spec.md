## ADDED Requirements

### Requirement: A delivery's files in one table

Each file at the top of a delivery SHALL stand once in one table with its name or pattern, when it is written and
what it holds. The source SHALL take every name of a delivery's files from it, and the operations reference's table
of them SHALL be written from it by a command.

#### Scenario: A name the source forms

- **WHEN** the source forms the name of a delivery's file
- **THEN** the name is the table's row for that file, with the model's id or the plate filled in

#### Scenario: The reference differs from the table

- **WHEN** the operations reference's table of a delivery's files differs from what the command writes
- **THEN** the check of generated inputs fails and names the document
