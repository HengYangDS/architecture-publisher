## 1. Runtime

- [x] 1.1 Replace the 0.2.0-beta.9 declaration in `.config/mise/config.toml` with the one published
      with 0.2.0-beta.10, checked against the release's `SHA256SUMS` and asset digests, and lock it
      again with native `mise lock`; done when the lock holds 0.2.0-beta.10 for every platform it
      held 0.2.0-beta.9 for, no 0.2.0-beta.9 entry remains and it keeps `lockfile_version = 3`. The
      declaration is the release's own file (`sha256:2163ceaa…`), read back against `SHA256SUMS` and
      the asset digests; the lock holds 0.2.0-beta.10 for the platforms it held 0.2.0-beta.9 for,
      holds no 0.2.0-beta.9 entry and keeps `lockfile_version = 3`.
- [x] 1.2 Bind the repository family to the 0.2.0-beta.10 runtime with the locked console's
      `hook install`, keeping 0.2.0-beta.9 as the rollback; done when `ethos status` reports pass in
      the lane under the 0.2.0-beta.10 runtime. CURRENT names the 0.2.0-beta.10 runtime
      `526c2ebafeba` and ROLLBACK the 0.2.0-beta.9 runtime `9427601ab2b1`; `ethos status` reports
      pass in the lane.
- [x] 1.3 Record the move under Changed in the Changelog's Unreleased section; done when the
      repository check passes. The Unreleased Changed list records the move and the carrier row;
      `mise run check` passes with 336 tests and the packed-package check.

## 2. Received licenses

- [x] 2.1 Declare the two house-font licenses as immutable carriers validated by `node-behavior`;
      done when `ethos lane format --check --json` passes and a copy of the supply with one changed
      license byte is refused by `verifySupply("house")`. With the row,
      `ethos lane format --check --json` passes; on a disposable clone of `dev`,
      `verifySupply("house")` refused the supply after one bit of a license copy changed and
      accepted it after restore.
