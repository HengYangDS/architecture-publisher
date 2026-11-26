## ADDED Requirements

### Requirement: What the publisher needs, stated once

The package SHALL state the Typst release and the Node.js floor it needs in its `engines`, and the publisher SHALL
read the Typst release from there. The operations reference's table of what the publisher needs SHALL be written by
a command from those and from the bundled supplies' manifests, and the other documents SHALL point to it.

#### Scenario: Another Typst release

- **WHEN** a build runs with a Typst release other than `engines.typst`
- **THEN** it refuses with the code of the medium's Typst version

#### Scenario: The reference differs from the owners

- **WHEN** the table of what the publisher needs differs from what the command writes
- **THEN** the check of generated inputs fails and names the document
