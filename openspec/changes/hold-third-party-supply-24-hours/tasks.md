## 1. The declarations

- [ ] 1.1 Declare `minimum_release_age = "24h"` in `.config/mise/config.toml`, `min-release-age=1` in the new `.config/npm/npmrc`, and the two environment lines that name it. Done when, in the lane, `mise settings get minimum_release_age` prints `24h`, `mise exec -- npm config get min-release-age` prints `1` and `mise exec -- npm config get userconfig` prints the repository's `.config/npm/npmrc`.
- [ ] 1.2 Confirm that nothing generated moves. Done when `mise install --locked` and `mise run bootstrap` pass in the lane and `git status` names no lock.

## 2. Documents

- [ ] 2.1 List `.config/npm/npmrc` with its consumer in `docs/reference/configuration.md` and record the age in the Changelog. Done when `npm run check:static` passes.
