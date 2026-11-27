## ADDED Requirements

### Requirement: The release's and the runtime's sets stated once

The release's platforms SHALL be read from the repository's lock, the archive's members from a table that the assembly
and the declaration read, the runtime dependencies from the package's manifest, and the variables a child process
receives from a table that the program reads. The operations reference SHALL state each of these sets, and the README
and the how-to the platforms, in a block a command writes from its source.

#### Scenario: A member moved in the table

- **WHEN** the table of the archive's members gives the launcher another place
- **THEN** an archive built from it holds the launcher there and its declaration names that directory

#### Scenario: A reference that differs from its source

- **WHEN** the operations reference's platforms differ from what the command writes from the lock
- **THEN** the check of generated inputs fails and names the document
