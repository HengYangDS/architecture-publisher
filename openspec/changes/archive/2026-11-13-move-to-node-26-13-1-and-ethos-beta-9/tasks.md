## 1. Runtime

- [x] 1.1 Move Node.js to 26.13.1 in `.config/mise/config.toml` and `devEngines`, and lock it with native `mise lock`; done when the lock holds 26.13.1 for all five platforms, keeps `lockfile_version = 3`, and no other tool's entries change; it does, and Taplo's five entries keep their content in another order.
- [x] 1.2 Declare the ETHOS 0.2.0-beta.9 release declaration in `.config/mise/config.toml`, lock it and bind the repository family with the locked console's `hook install`, keeping 0.2.0-beta.6 as the rollback; done when `ethos status` reports the lane ready under the 0.2.0-beta.9 runtime; it does, with 0.2.0-beta.6 in `ROLLBACK` and the paradigm conforming.
- [x] 1.3 Check the repository's own pipelines, which `tools/ci/projection.mjs` writes from `.config/ci/pipeline.cue` and which declare no ETHOS projection; done when `npm run check:ci` passes under 0.2.0-beta.9; it does.

## 2. Release

- [x] 2.1 Record 0.13.1 in `CHANGELOG.md`, `VERSION`, `package.json` and `package-lock.json`; done when `npm run check` passes under Node.js 26.13.1 with the browser tests run; it does, 311 of 311 tests with the browser tests run.
