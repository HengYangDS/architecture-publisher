# browser-evidence Specification

## Purpose
TBD - created by archiving change browser-evidence-compaction. Update Purpose after archive.

## Requirements

### Requirement: Bounded lossless report transport

The report transport SHALL preserve every measured value and SHALL enforce
compressed and expanded size limits before accepting decoded JSON. Historical
immutable JSON and new gzip reports SHALL use the same downstream validation.

#### Scenario: A compressed report is selected

- **WHEN** a byte-verified root report.json.gz is read
- **THEN** its complete decoded values reach existing identity and coverage checks
- **AND** invalid compression, invalid JSON or excessive expansion is rejected

#### Scenario: A historical report is selected

- **WHEN** a byte-verified root report.json is read
- **THEN** the same bounded JSON decoder and downstream checks apply

### Requirement: Non-authoritative progress

Progress checkpoints SHALL NOT qualify incomplete browser evidence. Completed or
failed runs SHALL retain a final report through the existing owned finalization.

#### Scenario: Execution stops before finalization

- **WHEN** only a progress checkpoint exists
- **THEN** browser acceptance remains unavailable
