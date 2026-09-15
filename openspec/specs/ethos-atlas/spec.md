# ethos-atlas Specification

## Purpose
Reproduce the complete source-bound ETHOS HTML atlas from explicit portable
inputs, keeping project meaning separate from generic rendering.

## Requirements

### Requirement: Explicit source-bound atlas

The ETHOS edition SHALL consume selected source and authoring bundle identities,
validate every selected page binding, preserve all declared pages and render
without requiring the ETHOS checkout or old architecture repository.

#### Scenario: Complete accepted atlas is selected

- **WHEN** exact accepted source and edition inputs are supplied through an installed package
- **THEN** every declared page is rendered and its HTML matches the selected expected identity
- **AND** browser and semantic acceptance remain explicitly unperformed

#### Scenario: Page identity or declared binding is missing

- **WHEN** a page, source binding, required detail or catalog member is absent or inconsistent
- **THEN** the edition rejects input before publishing a completed atlas manifest

### Requirement: Non-overwriting atlas output

The edition SHALL require an absent explicit output root and write its final
manifest only after all rendering and exact-byte checks succeed.

#### Scenario: Output already exists

- **WHEN** any file or directory occupies the output root
- **THEN** its contents remain unchanged and the operation fails

#### Scenario: A later page fails

- **WHEN** a page fails binding, native rendering or exact-output verification
- **THEN** partial new output is retained without a successful final manifest

#### Scenario: An earlier page changes during rendering

- **WHEN** a completed page changes before final atlas completion
- **THEN** the final file-set and hash scan rejects the atlas
- **AND** altered and partial files are retained without a completion manifest
