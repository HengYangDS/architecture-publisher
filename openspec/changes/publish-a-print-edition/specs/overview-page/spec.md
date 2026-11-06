## MODIFIED Requirements

### Requirement: Overview files

The overview SHALL be delivered as one PNG per `--png` width,
`00-overview.png` at 2400 px and `00-overview-<width>.png` at any other, and set
in place in the print edition. Equal compositions, models, classes, fonts and
Typst versions SHALL give equal bytes.

#### Scenario: Two builds

- **WHEN** a model with a composition is built twice with `--png 2400,6000`
- **THEN** both deliveries hold byte-identical `00-overview.png` and
  `00-overview-6000.png`

## ADDED Requirements

### Requirement: Overview in the print edition

In the print edition the overview SHALL be compiled from its composition in
place, so its text is text, and its imprint SHALL be the edition's foot.

#### Scenario: Searchable overview text

- **WHEN** the print edition of a model with a composition is built
- **THEN** the overview's masthead claim can be extracted as text from its page
