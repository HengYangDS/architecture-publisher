## 1. The launcher

- [x] 1.1 Add `tools/test/suite.mjs` and `tests/suite-width.test.mjs`, point `npm test` at the launcher and name the preload in knip. Done when the new test passes and `npm run check:static` passes. `tests/suite-width.test.mjs` and `npm run check:static` pass in the lane.
- [x] 1.2 Take the share of the host's queue (`ETHOS_HOST_CPU_CAP`) as the cores where a run is admitted. Done when the width test holds it and `npm run check:static` passes. `tests/suite-width.test.mjs` holds the queue's share; `npm run check:static` passes.

## 2. The record

- [x] 2.1 Add the measurement of the suite's width to `docs/research/build-and-suite-time.md` and record the change under `Unreleased` in `CHANGELOG.md`. Done when `npm run check:static` passes. `npm run check:static` passes.
