## Why

The owner asked to move every supply to its latest stable release. Since the
refresh landed on 3 November, two have moved: `semver` 7.8.6 improves range
parsing performance, and `jdx/mise-action` 5.2.6 ends a step that hung for up
to ten minutes when a cache restore failed. Every other supply is at its latest
stable release, and the lock and the raster crate have nothing to move within
their ranges.

## What Changes

- `semver` 7.8.6.
- `jdx/mise-action` 5.2.6, pinned by its commit, in every GitHub job.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None; the supply moves and no behavior changes.

## Impact

`package.json`, `package-lock.json`, `.config/ci/pipeline.cue` and its GitHub
projection, and the changelog. The published package declares no dependency,
and every corpus poster and page stays byte-identical.
