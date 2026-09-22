# Proposal

## Why

The completed 0.2 archive exposed two stale tests that still treat the former
active Change as current product authority. Exact-head proof must instead verify
current behavior against canonical contracts while preserving the archived
Change only as historical evidence.

## What Changes

- Make current topology assertions consume the canonical product, Edition, and
  ecosystem-adoption contracts.
- Exclude archived Change material from the live-reference corpus while checking
  separately that immutable history remains intact.
- Prove the former active Change is absent and retain fail-closed governance.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This repair aligns tests with already accepted requirements and does not
change product behavior.

## Impact

Only two repository tests and this bounded Change are affected. Runtime,
packages, release artifacts, canonical specifications, and the immutable
`v0.2.0-alpha.0` tag remain unchanged.
