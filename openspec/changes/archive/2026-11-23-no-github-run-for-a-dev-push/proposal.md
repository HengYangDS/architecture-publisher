## Why

A landing waits for GitHub to verify, on `dev`, a commit its proposal branch has already passed: 38 minutes for the
width Change on 2026-11-23. The owner widened the trial of 2026-11-22 to GitHub on 2026-11-23: each Forge verifies a
commit once.

## What Changes

- GitHub runs no workflow for a push of `dev`. Every other branch and every tag still runs.
- A test holds the filter; the guide, the record and the changelog say so.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None: the pipeline's triggers change, not the product.

## Impact

Changed: `.config/ci/pipeline.cue`, `.github/workflows/verify.yml` (generated), `tests/ci-projection.test.mjs`,
`docs/reference/development.md`, `docs/research/build-and-suite-time.md` and `CHANGELOG.md`.

Queue: `maintenance`.
