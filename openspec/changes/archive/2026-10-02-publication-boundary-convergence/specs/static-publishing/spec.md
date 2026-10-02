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

### Requirement: CoreText execution has one stage deadline owner

The parent stage supervisor SHALL own the compiler or measurement deadline and
native process-tree reclamation. The worker SHALL NOT start a second execution
timer or receive a duplicate stage timeout. Its finite owner-loss lifetime
SHALL remain separate and unchanged. Stage ceilings, output bounds and
fail-closed cleanup semantics SHALL remain unchanged.

#### Scenario: Execution reaches its selected deadline

- **WHEN** a live selected compiler or measurement exceeds its stage deadline
- **THEN** the parent reclaims the selected tree before reporting the timeout
- **AND** an inaccessible diagnostic checkpoint annotates the timeout without
  replacing it or relaxing cleanup evidence

#### Scenario: Only the parent selects the execution deadline

- **WHEN** the worker receives exact executable, arguments, environment, input,
  scratch and output bounds without a second timeout value
- **THEN** selected finite execution may complete before the parent deadline
- **AND** the worker remains available for owner reclamation or finite self-expiry

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
