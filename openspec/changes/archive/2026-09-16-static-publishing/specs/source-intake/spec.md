## ADDED Requirements

### Requirement: Explicit installed file packaging

The publisher SHALL expose file packaging through its installed CLI, consuming
a caller-selected plan digest, opaque source identity and explicit input files
with selected sizes, SHA-256 values and portable destination paths. It SHALL
reuse the bounded file reader and source-bundle writer, resolve paths relative
to the plan and create only an absent output directory. It SHALL NOT execute
input content or imply semantic, visual or publication acceptance.

#### Scenario: Independent author packages input and rendered output

- **WHEN** an installed consumer without ETHOS, a Git checkout or agent credentials supplies a matching explicit file plan
- **THEN** the command creates a closed source bundle and returns its manifest identity through the public CLI
- **AND** relocating the bundle preserves its content identity and verification behavior

#### Scenario: Unsafe or changed selected content

- **WHEN** the plan or file identity differs, a path is unsafe or symlinked, a declared limit is exceeded, or output already exists
- **THEN** packaging fails without overwriting prior content or publishing a successful manifest

#### Scenario: Packaging does not grant installation authority

- **WHEN** valid rendered files are packaged successfully
- **THEN** the result reports selected-file packaging only
- **AND** installing or replacing an accepted edition still requires its independent qualification and authorization
