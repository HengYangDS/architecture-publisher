# archify-renderer Specification

## Purpose
Render explicit typed diagram inputs through a pinned offline native backend,
independent of ETHOS, developer checkouts and undeclared host tooling.

## Requirements

### Requirement: Source-selected offline rendering

The renderer SHALL verify the selected input digest and bundled native runtime,
execute native schema and showcase artifact checks, and produce HTML without
requiring Git, ETHOS, Python, remote credentials or a developer checkout.

#### Scenario: Installed renderer receives portable typed input

- **WHEN** a valid selected diagram is rendered from an installed package in a relocated directory
- **THEN** native checks execute and a digest-bound self-contained HTML is produced
- **AND** the result reports browser and semantic acceptance as not performed

#### Scenario: Input requests undeclared source or network effects

- **WHEN** repository-source metadata or remote brand retrieval is requested
- **THEN** the offline renderer rejects it before executing upstream code

#### Scenario: Native quality check rejects a diagram

- **WHEN** native schema or showcase geometry checks fail
- **THEN** no final output file is published and the native diagnostic remains observable

### Requirement: Bounded non-overwriting file effects

The renderer SHALL write only a new explicit target after successful checks,
preserve existing content, and require caller-selected immutable input bytes.

#### Scenario: Output is occupied

- **WHEN** the target exists at preflight or arrives before final file creation
- **THEN** the operation fails without overwriting its contents

#### Scenario: Selected input or bundled supply has changed

- **WHEN** input or dependency bytes differ from their selected identities
- **THEN** rendering fails without creating the final HTML
