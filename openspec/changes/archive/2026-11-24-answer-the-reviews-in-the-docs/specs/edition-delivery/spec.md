## MODIFIED Requirements

### Requirement: Plate fit in check

`archpub check` SHALL report, for each plate, its figure's share of the body,
the balance gates it misses and whether its view's reading is set beside the
figure, set above it or set in the plate's head.

#### Scenario: A plate that left its reading out

- **WHEN** a view with a summary cannot give up width or height without more
  crossings or route defects
- **THEN** the edition sets the reading in the plate's head, in at most three lines, and `archpub check` names
  that plate so
- **AND** a reading that needs more lines, or a head too narrow for it, is refused with
  `edition_reading_too_long`

#### Scenario: A plate with its reading above the figure

- **WHEN** a view's summary is set above its figure
- **THEN** `archpub check` names that plate as setting its reading above the
  figure
