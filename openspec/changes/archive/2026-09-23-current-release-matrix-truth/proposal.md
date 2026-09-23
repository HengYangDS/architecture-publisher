# Proposal

## Why

The current first-party contract matrix still describes v0.3.0-alpha.1 as
unpublished after its signed release, hosted pipelines, package publication,
remote readback, and exact human review completed. It also expresses mutable
adopter progress from the Publisher repository, although ETHOS and AIGW
exclusively own those acceptance decisions.

## What Changes

- Advance the matrix schema and bind the exact published Publisher release,
  package identities, qualification set, and human-review record.
- Replace Publisher-owned adopter progress labels with explicit source-owned
  acceptance boundaries.
- Clarify that the older package and consumer observations are an immutable
  interoperability baseline rather than current release state.
- Preserve all 0.2.0-alpha.0, v0.3.0-alpha.1, and historical release bytes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- ecosystem-adoption: Require the current cross-product matrix to distinguish
  immutable observed baselines, Publisher-owned release evidence, and
  source-owned adopter acceptance.

## Impact

The conformance matrix, its focused test, and the operational reference change.
Runtime/package bytes and published release objects do not change.
