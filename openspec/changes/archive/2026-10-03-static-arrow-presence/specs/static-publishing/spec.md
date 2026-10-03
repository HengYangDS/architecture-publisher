## ADDED Requirements

### Requirement: Raster source notices bind the selected closure

Raster supply notices SHALL identify the same source archive, registry location
and Cargo.lock digest as the selected raster-source manifest. Required license
text SHALL remain complete. Supply integrity checks SHALL reject changed notice
bytes unless their exact selected supply binding is refreshed.

#### Scenario: A source closure advances

- **WHEN** the selected source archive or lock changes
- **THEN** current notices identify the new exact closure and lock
- **AND** historical release bytes remain unchanged

#### Scenario: A stale source-notice header survives

- **WHEN** a notice location or digest disagrees with the selected manifest
- **THEN** source-supply qualification rejects the disagreement
