## 1. The pipeline

- [x] 1.1 In `.config/ci/pipeline.cue`, stage the Mise release under its own name, let Curl resume it with fifteen minutes, and name the release in `.config/ci/linux/mise.sha256`; write `.gitlab-ci.yml` from the definition. Done when `npm run check:ci` passes, `tests/ci-projection.test.mjs` states the new lines and passes, and the repository paradigm reports the pipeline conforming. `npm run check:ci` and `tests/ci-projection.test.mjs` pass, and the paradigm reports the pipeline conforming.

## 2. Documents

- [x] 2.1 Say in `docs/reference/configuration.md` that the staged release is kept and resumed, and record the change under `Unreleased` in `CHANGELOG.md`. Done when `npm run check:static` passes. `npm run check:static` passes.
