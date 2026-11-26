## ADDED Requirements

### Requirement: The help as data

With `--json`, a help SHALL print `commands` beside `usage`: the program as data, each command with its name,
usage, group, description, arguments, options and the commands it holds. The operations reference's list of
commands SHALL be written from it by a command.

#### Scenario: An agent reads the commands

- **WHEN** `archpub --help --json` runs
- **THEN** its `commands` lists every command the help lists, with the options its own help lists
- **AND** the exit status is 0

#### Scenario: The reference differs from the program

- **WHEN** the operations reference's list of commands differs from what the command writes
- **THEN** the check of generated inputs fails and names the document
