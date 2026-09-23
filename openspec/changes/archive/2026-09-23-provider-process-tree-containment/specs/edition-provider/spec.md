# Edition Provider Delta

## ADDED Requirements

### Requirement: Executable Provider execution reclaims its owned process tree

Architecture Publisher SHALL supervise an executable Provider's selected
worker and ordinary descendants within one bounded materialization lifetime.
An ordinary descendant remains in that worker's native process group or tree;
deliberate detachment or reparenting is not an ordinary descendant.
It SHALL NOT admit a Provider reply or materialization receipt until the owned
worker tree has been reclaimed. A timeout, rejected reply, process failure,
output-limit violation, or unavailable or unobserved cleanup SHALL prevent a
passing result. Cleanup SHALL target only the selected invocation's owned
processes. This requirement does not claim an adversarial OS sandbox or
containment of a process that deliberately escapes the native worker group or
tree.

#### Scenario: A valid reply leaves an ordinary descendant running

- **WHEN** a selected executable Provider emits a valid standard-value reply
  while an ordinary worker descendant remains alive
- **THEN** materialization reclaims the worker and descendant before returning
  a passing receipt
- **AND** the Claim Model, Edition, and Candidate identities are unchanged

#### Scenario: A Provider times out with a running descendant

- **WHEN** the selected worker exceeds its reply deadline after starting an
  ordinary descendant
- **THEN** the supervisor reclaims both before returning a timeout failure
- **AND** no passing materialization receipt or Candidate is emitted

#### Scenario: Output is rejected after a descendant starts

- **WHEN** the worker emits an error, malformed reply, stderr, or output beyond
  the selected limit while an ordinary descendant is running
- **THEN** the supervisor reclaims the owned tree before returning failure
- **AND** the original output or reply defect remains distinguishable from a
  cleanup defect

#### Scenario: Native containment or cleanup is unavailable

- **WHEN** the selected host cannot establish or confirm bounded cleanup for
  the executable worker
- **THEN** materialization blocks with an explicit cleanup diagnostic
- **AND** it does not silently degrade to direct-child-only termination or
  report a passing Provider result

#### Scenario: An unrelated process is present

- **WHEN** an unrelated process runs beside the selected Provider invocation
- **THEN** cleanup leaves that process unchanged while reclaiming only the
  selected worker tree

#### Scenario: The supervisor disappears

- **WHEN** the owner of a selected executable Provider worker is lost before
  reclaiming the worker tree
- **THEN** the worker's own bounded deadline ends its lifetime
- **AND** no passing Provider result is asserted from that attempt
- **AND** descendant cleanup after supervisor loss remains unproved
