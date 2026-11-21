## 1. Runtime

- [x] 1.1 Replace the 0.2.0-beta.10 declaration in `.config/mise/config.toml` with the one published
      with 0.2.0-beta.11, checked against the release's `SHA256SUMS` and asset digests, and lock it
      again with native `mise lock`; done when the lock holds 0.2.0-beta.11 for every platform it
      held 0.2.0-beta.10 for, no 0.2.0-beta.10 entry remains and it keeps `lockfile_version = 3`.
      The release's declaration (sha256 `af619718…`) replaced the table and its comment; `mise lock`
      kept `lockfile_version = 3`, changed only `http:ethos`, and holds 0.2.0-beta.11 for the same
      platform entries, each checksum equal to `SHA256SUMS`.
- [x] 1.2 Bind the repository family to the 0.2.0-beta.11 runtime with the locked console's
      `hook install`, keeping 0.2.0-beta.10 as the rollback; done when `ethos status` reports the
      lane ready under the 0.2.0-beta.11 runtime. CURRENT names the 0.2.0-beta.11 runtime
      `8c663b10…` and ROLLBACK the 0.2.0-beta.10 runtime `526c2eba…`; with this Change named,
      `ethos status` reports the lane ready.
- [x] 1.3 Write `.gitlab-ci.yml` from `.config/ci/pipeline.cue` with
      `node tools/ci/projection.mjs --write`, and read `ethos lane repair-paradigm` before the
      commit; done when `npm run check:ci` passes and the paradigm report holds no gap for the
      pipeline. `node tools/ci/projection.mjs --write` regenerated `.gitlab-ci.yml` unchanged;
      `npm run check:ci` reports the projections verified, and `ethos lane repair-paradigm` reports
      the tree conforming with no edit and no report-only item.
- [x] 1.4 Record the move under Changed in the Changelog's Unreleased section; done when the
      repository check passes. The Unreleased section records the move under Changed;
      `npm run check:static` passes (14 items), and the other two parts of `npm run check`, the
      tests with coverage and the package check, run as the proof's gates `node-behavior` and
      `node-package`.

## Workflow follow-up

- Archive this Change and prove the archived head once.
- Publish the proposal, wait for both forges' review jobs, land, publish `dev` and `main`, and read
  the protected jobs back; then retire the lane.
