## Context

See proposal.md for why the layout changes. The package `architecture-publisher`
is published from `packages/publisher/` with `files` limited to `src/`,
`renderers/`, `supplies/` and its README, and with no runtime dependencies. The
private workspace root holds only development dependencies and scripts. The
canonical raster pair is not tracked: `raster-supply` restores it from the
custody commit `6eb45c8`, which holds it at its current path.

## Goals / Non-Goals

**Goals:**

- One package at the repository root whose published files are byte-identical
  to 0.7.0 apart from `package.json`.
- Publication inputs live outside the repository; samples and corpus copies
  have one home each.

**Non-Goals:**

- Changing any rendered output, model content or published file list.
- Rewriting history or moving the existing custody commit.

## Decisions

- **A root package instead of a one-member workspace.** `files` already selects
  what is published, and development dependencies are never installed for a
  consumer. A workspace adds a second manifest, README and license and a
  `--workspace` flag on every command without a second member to justify them.
  Keeping `packages/` for a future second package was rejected: no second
  package is planned, and moving one in later costs the same as now.
- **A new custody commit at the new path.** `git restore --source` restores a
  path as it is in the source commit and cannot relocate it. A commit holding
  the same two files at the new path reuses their blobs, so history grows only
  by tree objects, and the task keeps the native `git restore`. Writing the pair
  with `git show … >` was rejected because shell redirection is not
  byte-safe on every Windows shell.
- **`examples/` owns the samples, `tests/fixtures/models/` owns the corpus.** A
  sample is general and documented, and the tests read it from `examples/`, so
  the documented commands are tested. A corpus copy is a frozen snapshot of a
  real model kept only to test generality. It stays a fixture, and a README
  records its origin. Copies are not kept in step with their works.
- **References move, recorded history does not.** Archived Changes and the
  source paths inside models describe pinned revisions where those paths
  existed, so they keep `packages/publisher/`.

## Risks / Trade-offs

- [Refreshing the lock could change resolved versions] → Refresh the lock
  without installing new versions, and compare every resolved version and
  integrity hash with the current lock before committing.
- [A path reference is missed] → Search the tree for the old prefix outside the
  two recorded-history exceptions, and run the full check and both CI forges.
- [The packed package differs] → Compare the packed tarball with the 0.7.0
  package file by file.

## Migration Plan

The custody commit lands first, then the move. Rollback is a revert of the
move; the custody commit is harmless on its own.
