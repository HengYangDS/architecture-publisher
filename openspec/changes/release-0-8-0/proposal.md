## Why

`dev` holds thirteen Changes since v0.7.0, in 68 commits that include the 0.7.0
Change's own record and archive. They bring guide pages, file claims (model
version 2), the re-pin worklist, typeset overview pages, coverage reports with
glob paths and the lifted view limit. The package moved to the repository root,
the GitLab project moved, the supplies were refreshed, and two overview
refusals were fixed. The npm package and both Forges' Releases still deliver
0.7.0, and two of these changes are incompatible with it: model version 2 and
the removed four-view limit.

## What Changes

- `VERSION` becomes 0.8.0, with its projections in `package.json` and
  `package-lock.json`.
- The changelog's Unreleased notes are dated as 0.8.0, with the release link.
- After landing, `ethos land --release` moves `main` to the landed head and
  signs `v0.8.0`, and each Forge publishes its Release with the package and its
  `SHA256SUMS`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

## Impact

`VERSION`, `package.json`, `package-lock.json` and `CHANGELOG.md`. Code,
models and supplies do not change; a build's manifest names publisher version
0.8.0.
