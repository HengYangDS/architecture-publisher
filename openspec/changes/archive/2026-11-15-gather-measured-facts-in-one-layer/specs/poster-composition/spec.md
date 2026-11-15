## MODIFIED Requirements

### Requirement: Age bands

Every edition SHALL divide the files its parts own into three age bands counted back from the pin's commit: changed
within a week, within three months, and earlier. A file's age SHALL be the pin's commit time minus that of its last
change at or before the pin. The key SHALL name the bands and the pin's date.

#### Scenario: Recent and older files

- **WHEN** an edition's files changed one, thirty and four hundred days before the pin
- **THEN** the three files fall in three different bands, the same bands every edition uses

#### Scenario: A file a relation cites and no part owns

- **WHEN** a relation cites a file that no part owns
- **THEN** the file falls in no band, and no strip shows it
