## 1. The pipeline

- [x] 1.1 Add the two rules to `.config/ci/pipeline.cue`, drop tags from the rule for protected references, and generate `.gitlab-ci.yml`. Done when `npm run check:ci` passes. `npm run check:ci` passes; `.gitlab-ci.yml` is generated.
- [x] 1.2 Add the test of which jobs each event starts to `tests/ci-projection.test.mjs`. Done when the file's tests pass. `tests/ci-projection.test.mjs` passes in the lane.

## 2. The record

- [x] 2.1 Say so in `docs/reference/development.md`, the performance record and `CHANGELOG.md`. Done when `npm run check:static` passes. `npm run check:static` passes.

## 3. Chromium between the Linux jobs

- [x] 3.1 Drop the Linux job's own path for Playwright's browsers in `.config/ci/pipeline.cue`, generate `.gitlab-ci.yml`, hold it in `tests/ci-projection.test.mjs`, and say so in the guide, the record and `CHANGELOG.md`. Done when the projection's tests and `npm run check:static` pass. The projection's tests and `npm run check:static` pass; `.gitlab-ci.yml` names no path of its own for the Linux job's browsers.
