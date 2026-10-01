## ADDED Requirements

### Requirement: CoreText stage reclamation precedes scratch cleanup

CoreText SHALL run the selected compiler and measurement in separately bounded
owned process groups. Each group SHALL be reclaimed before the next stage or
scratch removal. Compiler and measurement deadlines remain 120 and 30 seconds;
no retry, broader input, inferred acceptance, or sandbox claim is introduced.

#### Scenario: The selected compiler leaves a descendant

- **WHEN** the selected compiler fails or times out with a live owned descendant
- **THEN** the parent reclaims the stage group before removing private scratch
- **AND** no measurement stage starts and no successful metrics are published

#### Scenario: The selected measurement completes

- **WHEN** the selected compiler succeeds within its deadline
- **THEN** its group closes before measurement starts under its own deadline
- **AND** selected compiler, SDK, font and helper identities remain checked

### Requirement: CoreText failures preserve primary and cleanup causes

A failed CoreText stage SHALL report its bounded primary process diagnostics.
Unproved group or scratch reclamation SHALL retain that primary cause and a
separate cleanup cause rather than imply successful cleanup or hide the failure.

#### Scenario: Cleanup also fails after compiler rejection

- **WHEN** a failed compile and a cleanup failure occur in one invocation
- **THEN** its failure retains the compile identity and bounded diagnostic tail
- **AND** it separately reports cleanup uncertainty without claiming no residue

#### Scenario: Diagnostic checkpoint cannot be observed

- **WHEN** reading the bounded checkpoint fails after a stage timeout
- **THEN** the failure retains its typed stage timeout as the primary cause
- **AND** unavailable diagnostics are a separate bounded observation
