## Why

Repeated production-boundary tests intermittently time out in different cases.
The forced-termination repair bounds duration but does not identify where progress
stopped. P0 requires a causal diagnosis rather than another successful rerun.

## What Changes

- Reproduce the same renderer inputs with bounded stage observation.
- Distinguish module initialization, input consumption, validation, rendering,
  response emission and exit.
- Repair only the demonstrated boundary and retain failure evidence.
- Measure test cost without retries, longer deadlines or weaker supply checks.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `static-publishing`: bounded raster failure diagnostics and deterministic input
  delivery with unchanged output and deadline contracts.

## Impact

First independent closure of the approved A-E productization campaign.
Evidence-cost reduction, real structural evolution, one non-ETHOS adopter,
shared interfaces and minimal Skills/CI integration remain required subsequent
closures. Preserve accepted artwork, prior releases and predecessor repositories.
