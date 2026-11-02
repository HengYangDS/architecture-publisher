## Why

The owner asked to move every supply to its latest stable release. resvg 0.49.0
and `wasm-bindgen` 0.2.130 are the latest releases and stay pinned exactly, but
within those pins the raster crate's lock holds crc32fast 1.5.3 and
unicode-script 0.5.8, while 1.5.4 and 0.5.9 are out. The renderer is compiled
from a pinned source closure, so its lock moves only with a new closure, a new
canonical pair and new native witnesses.

## What Changes

- The raster crate's lock moves to crc32fast 1.5.4 and unicode-script 0.5.9;
  nothing else in it moves.
- A new source closure, `0.49.0-f55157d60abd`, packed as the current one was,
  in the GitLab generic package registry and as a GitHub prerelease.
- The canonical pair rebuilt from it on macOS ARM64 and held in a new custody
  commit; the generated glue is unchanged.
- Native witnesses for macOS, Linux and Windows ARM64, each from two agreeing
  relocated builds; the hosted ones come from the proposal's CI.
- Third-party notices regenerated from the new closure.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None; the renderer's inputs move and its behavior does not.

## Impact

`tools/raster/resvg/Cargo.lock`, the raster supply under
`renderers/resvg/supply/`, the custody revision in `.config/mise/config.toml`
and the changelog. The published package's raster renderer changes, and every
corpus poster and page stays byte-identical.
