## ADDED Requirements

### Requirement: Source-bound candidate poster

The poster SHALL compile explicitly selected source, authored semantic carriers
and verified measurement inputs without requiring frozen output hashes, while
enforcing the existing semantic and geometry gates.

#### Scenario: New meaning requires new labels

- **WHEN** an authored candidate represents the selected changed meaning
- **THEN** all required labels use verified selected measurements and visible carriers
- **AND** missing metrics, omitted meaning or failed geometry prevent a completed output

#### Scenario: Frozen baseline reconstruction

- **WHEN** the historical accepted poster input is selected
- **THEN** its exact scene and SVG identities remain mandatory
