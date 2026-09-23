# Design

## Context

See [proposal.md](proposal.md). The conformance journey validates that an
executable Provider imports only Node built-ins, local modules, and selected
public Architecture Publisher contracts. Its primary run executes in the
provider's installed context. Its relocation run currently copies only the
Provider package to a temporary directory, so Node cannot resolve a declared
`architecture-publisher` dependency even though that dependency direction is
explicitly permitted.

## Goals / Non-Goals

**Goals:**

- Make relocation model an isolated installed package closure rather than a
  source-less package copy.
- Preserve the exact Publisher implementation already executing conformance.
- Keep dependency-direction checks and all existing negative cases fail-closed.

**Non-Goals:**

- Installing packages from a registry during conformance.
- Allowing arbitrary third-party Provider dependencies.
- Changing Provider wire schemas, public commands, or historical release bytes.
- Claiming source-product acceptance or publication from conformance success.

## Decisions

### Stage the executing Publisher package as the permitted dependency

Resolve `architecture-publisher/package.json` from the conformance journey's own
module context, dereference that exact package root, and copy it below the
relocation root's `node_modules/architecture-publisher`. Node then applies its
ordinary upward package resolution from the relocated Provider.

This is preferable to a symlink, `NODE_PATH`, or an ambient checkout because
those alternatives would make the relocation predicate depend on original host
paths. It is preferable to `npm install` because conformance must remain offline
and deterministic.

### Require imported Publisher contracts to be declared

The dependency inspection already rejects every external package except
`architecture-publisher`. It will additionally reject a Provider that imports a
Publisher public export without declaring the package dependency. This prevents
the primary run from passing accidentally through a parent workspace while the
relocated run fails.

### Keep the repair inside the conformance harness

The executable materializer already works for a normally installed Provider.
The defect belongs to the relocation fixture, not the Provider protocol or
materialization runtime. The repair therefore changes only the conformance
journey, its regression, and release notes.

## Risks / Trade-offs

- **The copied Publisher tree could include development-only files.** Resolve
  the same package root as the imported public contract and copy only that
  package directory; package-boundary tests continue to govern its contents.
- **An undeclared dependency could still resolve in the primary workspace.**
  Reject imported Publisher specifiers unless `architecture-publisher` is
  declared by the Provider package.
- **A future permitted dependency may require another closure rule.** Keep the
  current fix specific to the sole allowed external package; extend the contract
  only after a real provider demonstrates another need.

## Migration Plan

1. Add a regression Provider that declares and executes an allowed Publisher
   public export; confirm relocation fails with `ERR_MODULE_NOT_FOUND`.
2. Stage the exact executing Publisher package in the isolated relocation and
   require the declaration/import relationship.
3. Run focused conformance tests, then the repository's complete declared
   quality graph under `npm@11.19.1`.
4. Record the fix, prove the exact signed candidate, land through the governed
   lane, and leave every published tag and release artifact unchanged.
