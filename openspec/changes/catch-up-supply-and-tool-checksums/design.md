## Context

See proposal.md for why. The npm version is pinned three times:
`devEngines.packageManager` refuses any other npm, `packageManager` names it for
Corepack, and `.config/mise/config.toml` installs it as `npm:npm`. `mise lock`
writes `.config/mise/mise.lock` and, for `npm:npm`, a lock of npm's own package
under `.config/mise/locks/npm-npm/<version>/`. The CI installs every tool with
mise 2026.10.25, `MISE_ENV=ci` and `MISE_LOCKED=1`.

## Goals / Non-Goals

**Goals:**

- npm and the npm lock at the newest releases public for 24 hours.
- A mise lock from which every tool installs in mise's safe and locked modes,
  with the pinned mise and with the next release.

**Non-Goals:**

- Moving the CI's mise, which follows the workstation's.
- Changing anything a build, a check or a delivery produces.

## Decisions

- **Regenerate the mise lock with the pinned mise.** `mise lock` 2026.10.25
  records the checksum of each of Taplo's archives and drops pixi's entries for
  macOS and Windows, where the configuration does not install pixi. Writing the
  three checksums by hand was rejected: the lock is generated, and a hand edit
  would keep the stale pixi entries.
- **Remove the orphaned CI lock.** `locks/mise.ci/npm-npm/12.2.0/` served
  `.config/mise.ci.toml`, removed on 22 October with `.config/mise.ci.lock`. With
  `MISE_ENV=ci`, as in the CI, mise reads only `.config/mise/config.toml` and the
  npm lock that `mise.lock` names, and no tracked file names the directory.
- **Move the npm lock with npm's own update.** `npm update --package-lock-only`
  at a cutoff 24 hours back moves only `@napi-rs/wasm-runtime`.
- **Two advisories in npm's own bundle stay.** npm 12.2.1 and 12.2.2 both bundle
  glob 13.0.6 and minimatch 10.2.5, which GHSA-3g3m-2fjr-6pw4 and
  GHSA-g3hv-75wg-m249 name at medium severity. No npm release fixes them yet, and
  this move adds none.

## Risks / Trade-offs

- [mise 2026.11.2, or the CI's environment, reads the lock differently from what
  was tried] → On fresh stores, both releases install every locked tool from this
  lock with `MISE_SAFE=1` and `MISE_LOCKED=1`, the pinned one also with
  `MISE_ENV=ci`, and each tool runs.
