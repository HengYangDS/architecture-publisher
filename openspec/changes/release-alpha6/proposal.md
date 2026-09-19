## Why

The accepted product-contract integration changes shipped publisher behavior
and package contents after `v0.1.0-alpha.5`. Reusing that immutable version
would make installed identity and recovery evidence ambiguous.

## What Changes

- Advance the package version to `0.1.0-alpha.6` in its existing source and lock
  projection.
- Admit only the matching signed tag in the repository release policy.
- Document that the new publisher release reuses the unchanged, previously
  qualified ETHOS reader bytes rather than claiming a new visual edition.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is release metadata for already accepted behavior; `skip_specs: true`
applies.

## Impact

Only package identity, the exact tag allowlist, publication documentation and
this Change's artifacts are authored. Existing releases, Documents delivery,
reader assets, rendering semantics and runtime dependencies remain unchanged.
