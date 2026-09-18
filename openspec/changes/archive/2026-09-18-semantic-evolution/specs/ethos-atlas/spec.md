## ADDED Requirements

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
