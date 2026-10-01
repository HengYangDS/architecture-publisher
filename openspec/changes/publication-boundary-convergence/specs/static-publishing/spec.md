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

### Requirement: Raster process failure remains distinct from malformed replies

The raster owner SHALL distinguish a nonzero process exit without a reply from
malformed reply bytes. It SHALL retain explicit worker error replies, reject
successful-looking replies from nonzero exits and emit no raster artifact after
process failure.

#### Scenario: Windows worker terminates without a reply

- **WHEN** the native worker exits nonzero without emitting reply bytes
- **THEN** the raster owner reports process failure rather than malformed JSON
- **AND** no output artifact is emitted

#### Scenario: Worker emits malformed reply bytes

- **WHEN** the worker emits bytes that do not satisfy the response contract
- **THEN** the raster owner reports the existing invalid-response failure
- **AND** explicit valid error replies retain their selected error code
