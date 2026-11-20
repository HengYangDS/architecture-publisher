## 1. The pipeline

- [x] 1.1 In `.config/ci/pipeline.cue`, fetch the staged Mise release only where its checksum does not hold, resume a partial file, fetch it whole where a resumed file is still wrong, and allow fifteen minutes; write `.gitlab-ci.yml` from it. Done when `npm run check:ci` passes and `tests/ci-projection.test.mjs` states the new lines and passes. `npm run check:ci` and `tests/ci-projection.test.mjs` pass.

## 2. Documents

- [x] 2.1 Record the change under `Unreleased` in `CHANGELOG.md`. Done when `npm run check:static` passes. `npm run check:static` passes.
