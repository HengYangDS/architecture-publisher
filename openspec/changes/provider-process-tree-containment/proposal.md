# Provider Process-Tree Containment

## Why

The published executable Provider uses `spawnSync` with a timeout that kills only
its direct worker. A bounded local reproduction on Node 26.9.0 returned
`ETIMEDOUT` while a worker-spawned descendant remained alive. A failed Provider
run must not leave an owned process behind or be described as bounded execution.

## What Changes

- Supervise the selected executable Provider's ordinary process tree for the
  entire materialization lifetime, including reply handling and cleanup.
- Refuse a passing materialization when required cleanup is unavailable,
  incomplete, or unobserved; preserve a bounded diagnostic on failure.
- Retain the existing Provider manifest, standard-value reply, Candidate
  identities, CLI surface, and source-product authorization boundary.
- Add native counterexamples for success, timeout, invalid output, unrelated
  processes, and cleanup failure. Qualify each claimed host platform before
  declaring process-tree containment there.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-provider`: executable materialization reclaims its owned ordinary
  process tree before admitting a result and fails closed when containment is
  unavailable or cannot be verified.

## Impact

- The executable Provider worker and its internal process supervisor.
- Provider execution, package, relocation, and native platform tests.
- Release qualification and a future SemVer successor; signed historical tags
  and assets remain immutable.

No renderer or source-product lifecycle is moved into the Provider boundary.
