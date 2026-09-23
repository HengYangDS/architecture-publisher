# Provider Relocation Dependency Closure

## Why

The executable Edition Provider conformance journey relocates the selected
Provider package without its permitted Architecture Publisher dependency. A
valid source-owned Provider can therefore pass normal installed execution and
fail the relocation predicate with `ERR_MODULE_NOT_FOUND`.

## What Changes

- Reproduce relocation with an executable Provider that imports an allowed
  public Architecture Publisher contract.
- Relocate the exact Publisher package used by the conformance runner alongside
  the Provider, preserving normal Node package resolution without copying an
  adopter checkout or admitting arbitrary dependencies.
- Retain dependency-direction rejection, empty configuration, adjacent-checkout
  immunity, deterministic output, and resource ceilings.
- Record the bug fix under the unreleased changelog without changing any
  historical release artifact.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-provider`: executable Provider relocation preserves the one allowed
  Publisher dependency closure while remaining isolated from source-product and
  ambient dependencies.

## Impact

- `conformance/journeys/provider/run.mjs`
- `tests/edition-provider-conformance.test.mjs`
- `openspec/specs/edition-provider/spec.md` after archive
- `CHANGELOG.md`

The public Provider wire format and command surface do not change. Published
`v0.3.0-alpha.1` tags and assets remain byte-for-byte immutable.
