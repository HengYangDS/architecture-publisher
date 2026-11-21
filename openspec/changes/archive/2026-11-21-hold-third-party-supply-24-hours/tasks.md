## 1. The declarations

- [x] 1.1 Declare `minimum_release_age = "24h"` in `.config/mise/config.toml`, `min-release-age=1` in the new `.config/npm/npmrc`, and the two environment lines that name it. Done when, in the lane, `mise settings get minimum_release_age` prints `24h`, `mise exec -- npm config get min-release-age` prints `1` and `mise exec -- npm config get userconfig` prints the repository's `.config/npm/npmrc`. The three readings stand in the step's output.
- [x] 1.2 Confirm that nothing generated moves. Done when `mise install --locked` and `mise run bootstrap` pass in the lane and `git status` names no lock. Both pass, and no lock is named.

## 2. Documents

- [x] 2.1 List `.config/npm/npmrc` with its consumer in `docs/reference/configuration.md` and record the age in the Changelog. Done when `npm run check:static` passes. `npm run check:static` passes.
