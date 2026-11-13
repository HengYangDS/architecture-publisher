## Why

Node.js 26.13.1 is a security release of the Node.js 26 line, published on 11 November 2026, and the
owner asked every governed repository to run it. The release archives carry the Node.js runtime the
lock names, so the patched runtime reaches readers only through a new release. The repository also
runs ETHOS 0.2.0-beta.6, while the other governed repositories run 0.2.0-beta.9, which upgrades
directly from 0.2.0-beta.6 and keeps result schema 3.

## What Changes

- Development, CI and the release archives run Node.js 26.13.1: the Mise declaration and
  `devEngines` name it, and the lock holds its five platform archives.
- The repository declares the ETHOS 0.2.0-beta.9 release declaration in its Mise configuration,
  locks it, and binds its family to the 0.2.0-beta.9 runtime, keeping 0.2.0-beta.6 as the rollback.
- Both pipelines are checked against the 0.2.0-beta.9 common model.
- Version 0.13.1 is recorded.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-identity`: a release's archives hold the Node.js and Typst releases the lock pins.

## Impact

`.config/mise/config.toml`, `.config/mise/mise.lock`, `package.json`, `package-lock.json`,
`VERSION`, `CHANGELOG.md` and the Git-common ETHOS runtime binding. The publisher's behaviour,
model format and manifest do not change.
