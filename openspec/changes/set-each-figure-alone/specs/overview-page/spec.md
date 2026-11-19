## MODIFIED Requirements

### Requirement: Overview files

The overview SHALL be set in place in the print edition and delivered as one PNG of its page per `--png` width in
`images/`, `00-overview.png` at 3840 px and `00-overview-<width>.png` at any other. Equal statements, models,
classes, fonts and Typst versions SHALL give equal bytes.

#### Scenario: Two builds

- **WHEN** a model with an overview statement is built twice with `--png 3840,6000`
- **THEN** both deliveries hold byte-identical `images/00-overview.png` and `images/00-overview-6000.png`
