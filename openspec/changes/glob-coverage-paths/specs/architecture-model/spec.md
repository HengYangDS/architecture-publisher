## MODIFIED Requirements

### Requirement: Coverage scope

A model SHALL be able to declare `coverage` with `include`, the repository
paths it describes, and `exclude`, the paths it leaves out, each with a
non-blank reason. A path holding `*`, `?` or `[` SHALL be a glob, any other
path ending in a slash SHALL name a directory and any other path a file.
Without `include`, the scope SHALL be the whole repository. An invalid or
repeated path and an exclusion without a reason SHALL be refused with their
JSON paths.

#### Scenario: A declared scope

- **WHEN** a model includes `src/` and excludes `src/vendor/` with a reason
- **THEN** the model validates and keeps both paths and the reason

#### Scenario: An exclusion without a reason

- **WHEN** an exclusion declares a path but no reason
- **THEN** validation refuses it at `/coverage/exclude/0/reason`

#### Scenario: A glob exclusion

- **WHEN** a model includes `internal/` and excludes `**/*_test.go` with a
  reason
- **THEN** the model validates and keeps the glob and the reason

## ADDED Requirements

### Requirement: Coverage glob syntax

In a coverage glob, `*` SHALL match within one path segment, `**` any number
of segments, and `?` and `[…]` one character, and a glob ending in a slash
SHALL name the directories it matches. A glob SHALL stay within the
repository, as every coverage path does.

#### Scenario: Character globs

- **WHEN** a model excludes `src/gen-?/[ab]*` with a reason
- **THEN** the model validates and keeps the glob

#### Scenario: A glob that leaves the repository

- **WHEN** a model includes `../*.go` or `a/**/../b/*`
- **THEN** validation refuses each at its JSON path
