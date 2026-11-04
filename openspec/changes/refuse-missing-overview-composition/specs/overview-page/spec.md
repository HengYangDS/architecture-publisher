## MODIFIED Requirements

### Requirement: Overview composition

A model MAY name an overview composition: a Typst file, relative to the model,
that states its work's page with the house class. The publisher SHALL typeset
it with the composition's Typst files, the house class and the model staged in
one root that Typst cannot leave, with system and embedded fonts ignored and
only the house faces and the bundled CJK face available. When no file is at the
named path, the publisher SHALL refuse with `overview_composition_missing`,
naming the model's value and the path it looked at, before it stages anything
or runs Typst.

#### Scenario: A composition beside its model

- **WHEN** a model names `overview.typ` and that file imports the house class
- **THEN** the build typesets the page from that file, the class and the model
  alone

#### Scenario: A composition that is not there

- **WHEN** a model names `overview.typ` and no such file is beside it
- **THEN** `archpub check` and the build refuse with
  `overview_composition_missing`, naming `overview.typ` and the path looked at
- **AND** the build writes nothing
