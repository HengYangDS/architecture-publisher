## 1. The trigger

- [x] 1.1 Set GitHub's push filter in `.config/ci/pipeline.cue` and generate `.github/workflows/verify.yml`. Done when `npm run check:ci` passes. `npm run check:ci` passes.
- [x] 1.2 Hold the filter in `tests/ci-projection.test.mjs`. Done when the test fails without the filter and passes with it. Red without the filter on 2026-11-23 (the work directory's rehearsal), green in the lane.

## 2. The record

- [x] 2.1 Say so in the development guide, the record and `CHANGELOG.md`. Done when `npm run check:static` passes. `npm run check:static` passes.
