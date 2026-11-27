## ADDED Requirements

### Requirement: A command's outcomes stated once

Each outcome of a command, its exit status, whether it succeeded and the keys of the JSON object it prints, SHALL be
stated once, in a table the program reads for its exit statuses, its help and its results. The command line and
refusals references' statements of the outcomes SHALL be written from that table by a command.

#### Scenario: A status moved in the table

- **WHEN** the table gives a refused input another exit status
- **THEN** a refused command ends with that status and the help's line names it

#### Scenario: A reference that differs from the table

- **WHEN** the command line reference's table of outcomes differs from what the command writes
- **THEN** the check of generated inputs fails and names the document
