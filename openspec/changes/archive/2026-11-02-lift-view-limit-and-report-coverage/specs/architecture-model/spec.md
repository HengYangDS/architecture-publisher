## ADDED Requirements

### Requirement: Coverage scope

A model SHALL be able to declare `coverage` with `include`, the repository
paths it describes, and `exclude`, the paths it leaves out, each with a
non-blank reason. A path ending in a slash SHALL name a directory and any other
path a file. Without `include`, the scope SHALL be the whole repository. An
invalid or repeated path and an exclusion without a reason SHALL be refused
with their JSON paths.

#### Scenario: A declared scope

- **WHEN** a model includes `src/` and excludes `src/vendor/` with a reason
- **THEN** the model validates and keeps both paths and the reason

#### Scenario: An exclusion without a reason

- **WHEN** an exclusion declares a path but no reason
- **THEN** validation refuses it at `/coverage/exclude/0/reason`
