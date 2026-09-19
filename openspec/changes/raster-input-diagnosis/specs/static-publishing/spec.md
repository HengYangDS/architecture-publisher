## ADDED Requirements

### Requirement: Completed raster input

The raster parent SHALL complete the selected JSON request in private scratch
before starting its worker and SHALL supply a read-only regular descriptor as
stdin with a deterministic EOF. It SHALL close the descriptor and remove scratch
on success or failure without changing supply validation or output acceptance.

#### Scenario: Selected input is consumed

- **WHEN** the worker reads its selected request
- **THEN** stdin is a completed regular file containing the exact JSON request
- **AND** a read after the request reaches EOF without a parent pipe writer

#### Scenario: The worker does not complete

- **WHEN** selected worker execution reaches its existing deadline
- **THEN** the parent forcibly terminates its owned worker and returns a bounded failure
- **AND** scratch and the input descriptor are released without replacing existing output

#### Scenario: Normal rendering completes

- **WHEN** the selected request completes successfully
- **THEN** output identity, supply validation and non-overwrite guarantees remain intact
