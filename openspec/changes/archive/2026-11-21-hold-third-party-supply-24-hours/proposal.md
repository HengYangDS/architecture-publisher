## Why

The owner decided on 2026-11-19 that third-party supply is held 24 hours before a governed repository takes it,
and that each repository writes the age in its own configuration; the steward of the governed repositories
relayed both decisions and the form the other governed repositories hold. The publisher's own configuration
declares no age: read in its checkout on 2026-11-20, Mise states `24h` and npm `1`, and both come from the
maintainer's own settings, which a CI machine and a contributor do not have.

## What Changes

- `.config/mise/config.toml` declares `minimum_release_age = "24h"` under `[settings]`: Mise takes a tool it
  resolves only when its release is a day old.
- A new file, `.config/npm/npmrc`, the carrier the ETHOS paradigm names for npm's policy, declares
  `min-release-age=1`, npm's unit being days. The Mise environment names it as npm's user configuration and
  removes the lower-case alias of that name, since npm reads environment names without regard to case.
- The configuration reference lists the new file with its consumer, and the Changelog records the age.

No lock moves and nothing generated changes: the age filters a fresh resolution, and `npm ci` and
`mise install --locked` install what the locks already hold.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement of the publisher names a release age, so `.openspec.yaml` sets `skip_specs: true`.

## Impact

`.config/mise/config.toml`, `.config/npm/npmrc` (new), `docs/reference/configuration.md` and the Changelog. Under
Mise, npm in this repository no longer reads a person's own `~/.npmrc`. No source file and no test changes: every
test run removes npm's environment variables and names its own configuration files. The CI's Linux image is tied
to the digest of the Mise download, not to the configuration, and is not rebuilt.

Queue: `maintenance`.
