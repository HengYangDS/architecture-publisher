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

### Requirement: Explicit semantic candidate

The edition SHALL distinguish candidate input from accepted replay, bind complete
source and authoring identities, compare changed semantic attributes and preserve
all selected views without inheriting acceptance of prior output bytes.

#### Scenario: Meaning changes without graph-count changes

- **WHEN** the selected source changes a condition, direction, scope or other semantic attribute without adding or removing identities
- **THEN** the change is reported and its affected visible carriers require new review
- **AND** absent or stale carriers cannot pass merely because graph counts match

#### Scenario: Candidate differs from accepted output

- **WHEN** valid candidate source and authoring produce new HTML identities
- **THEN** generation emits the new identities without requiring prior accepted hashes
- **AND** accepted-edition replay continues to enforce its original hashes

#### Scenario: Standalone complete atlas

- **WHEN** the selected candidate atlas is packaged for single-file delivery
- **THEN** the complete overview and all mechanism pages remain navigable offline
- **AND** native page behavior and meaning remain intact without external file loading
