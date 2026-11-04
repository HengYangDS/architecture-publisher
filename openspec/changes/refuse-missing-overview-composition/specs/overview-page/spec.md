## ADDED Requirements

### Requirement: Missing composition

When a model names an overview composition and no file is at that path, the
publisher SHALL refuse with `overview_composition_missing`, naming the model's
value and the path it looked at, before it stages anything or runs Typst.

#### Scenario: A composition that is not there

- **WHEN** a model names `overview.typ` and no such file is beside it
- **THEN** `archpub check` and the build refuse with
  `overview_composition_missing`, naming `overview.typ` and the path looked at
- **AND** the build writes nothing

#### Scenario: A composition in a directory that is not there

- **WHEN** a model names `art/overview.typ` and no `art/` is beside it
- **THEN** `archpub check` and the build refuse with
  `overview_composition_missing` instead of failing on the directory
