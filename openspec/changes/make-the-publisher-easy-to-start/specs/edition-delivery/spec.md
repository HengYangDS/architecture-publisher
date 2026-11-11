## MODIFIED Requirements

### Requirement: Machine-readable results

Every command SHALL accept `--json` and then print exactly one JSON object with
`ok` and either its outputs or its diagnostics. The exit status SHALL be 0 on
success, 1 for a refused input, 2 for a usage error and 3 for any other
failure, whose JSON object SHALL carry the code `internal_error` and a message.
`archpub --help` SHALL print the usage, `archpub <command> --help` that command's
usage and `archpub --version` the package version, each with status 0. A result
MAY carry `warnings`, each with a code and a message, which text output prints
one to a line.

#### Scenario: A refused build with JSON output

- **WHEN** a build with `--json` refuses an invalid model
- **THEN** standard output holds one JSON object with `ok: false` and the
  diagnostics
- **AND** the exit status is 1

#### Scenario: A manifest that cannot be read

- **WHEN** `archpub accept --json` meets a `manifest.json` that is a directory
- **THEN** standard output holds one JSON object with `ok: false` and the code
  `internal_error`
- **AND** the exit status is 3

#### Scenario: The version

- **WHEN** `archpub --version --json` runs
- **THEN** standard output holds one JSON object with `ok: true` and the
  package version

#### Scenario: One command's usage

- **WHEN** `archpub build --help` runs
- **THEN** standard output holds the usage of `archpub build` and its options
- **AND** the exit status is 0
