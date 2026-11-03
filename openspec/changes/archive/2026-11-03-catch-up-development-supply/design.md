## Context

See proposal.md for why. Development dependencies are pinned exactly, and the
GitHub jobs pin each action by its full commit; `.config/ci/pipeline.cue` owns
the pins and `tools/ci/projection.mjs` writes the workflows from it.

## Goals / Non-Goals

**Goals:**

- `semver` and `jdx/mise-action` at their latest stable releases.

**Non-Goals:**

- Changing anything that a build, a check or a delivery produces.

## Decisions

- **Pin the action by the commit its release tag names.** `v5.2.6` and the
  moving `v5` both name `f5be966e`, so the pin moves to that commit, as the
  previous one named `v5.2.5`. A tag pin was rejected: a tag can move.
- **Install `semver` with the locked npm.** `npm install --save-exact` changes
  the one entry and its lock record; the rest of the lock stays as it is, which
  a comparison with the current lock shows.

## Risks / Trade-offs

- [`semver`'s faster range parsing changes a result] → `tools/release/version.mjs`
  is its only consumer and runs in `check:generated`; the full check and both
  Forges' CI run before dev is published.
