## 1. The trigger

- [ ] 1.1 Set GitHub's push filter in `.config/ci/pipeline.cue` and generate `.github/workflows/verify.yml`. Done when `npm run check:ci` passes.
- [ ] 1.2 Hold the filter in `tests/ci-projection.test.mjs`. Done when the test fails without the filter and passes with it.

## 2. The record

- [ ] 2.1 Say so in the development guide, the record and `CHANGELOG.md`. Done when `npm run check:static` passes.
