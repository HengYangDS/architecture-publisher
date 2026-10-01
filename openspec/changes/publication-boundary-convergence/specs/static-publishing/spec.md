## ADDED Requirements

### Requirement: CoreText worker retains bounded reclamation lifetime

A selected CoreText worker SHALL remain live after its reply until parent
reclamation, bounded by the selected stage deadline plus the existing cleanup
allowance and one second. It SHALL flush enabled V8 coverage before replying
and reject invalid lifetime bounds before parsing input or launching a child.
Stage ceilings and fail-closed group reclamation SHALL remain unchanged.

#### Scenario: The reply precedes owner reclamation

- **WHEN** the selected stage worker replies and the parent has not reclaimed it
- **THEN** the worker remains live within its validated finite lifetime
- **AND** enabled coverage is flushed before the reply
- **AND** the parent still reclaims its group before admitting stage success

#### Scenario: The stage supervisor disappears

- **WHEN** the stage owner disappears before reclaiming the replying worker
- **THEN** the worker expires after the selected stage bound plus the existing
  cleanup allowance and one second
- **AND** descendant reclamation and passing stage acceptance remain unproved

#### Scenario: The worker lifetime is malformed

- **WHEN** the selected worker lifetime is absent or outside its admitted bound
- **THEN** the worker exits unsuccessfully before parsing input or launching a child
