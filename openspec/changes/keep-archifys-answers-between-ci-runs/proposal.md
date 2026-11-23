## Why

The suite keeps Archify's answers on a machine, but a hosted GitHub job is a fresh machine and the Linux guest a
fresh container: CI asked Archify cold. In run 45125291928 `npm run check` took 26.1 min on Windows ARM64 and 14 to
20 on the others.

## What Changes

- The test fixture keeps its answers under `ARCHPUB_ARCHIFY_ANSWERS_ROOT` when set.
- The pipeline sets it to the tool cache, which a guest job's clean spares; GitHub's review jobs restore and save it
  with `actions/cache` (v6.1.0, pinned). Protected jobs run without it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None: CI's cache changes, not the product.

## Impact

Changed: `tests/fixtures/archify-answers.mjs`, `.config/ci/pipeline.cue` and its two projections,
`tests/ci-projection.test.mjs`, the development guide, the record and `CHANGELOG.md`.

Queue: `maintenance`.
