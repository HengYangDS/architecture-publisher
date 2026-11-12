## ADDED Requirements

### Requirement: House class palette

The house class SHALL take its colours from the edition's resolved palette:
`paper` its ground, `ink` its ink, `green` its oldest dye and `ochre` its
accent, so a composition is set in the palette the model chooses.

#### Scenario: A composition in another palette

- **WHEN** a composition draws a rule in `green` and the edition's palette is
  `persimmon`
- **THEN** the rule is drawn in persimmon's oldest dye
