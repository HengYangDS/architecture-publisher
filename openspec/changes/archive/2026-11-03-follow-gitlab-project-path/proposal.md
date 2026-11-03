## Why

On 2026-11-03 the GitLab project moved from `dig/research/human-agent-stewardship`
to `dig/misc/tools/architecture`, beside the group's other tools. The Raster
source record still names the package registry by the old project path, CI
downloads the source closure through that path, and the changelog links the
early tags there. GitLab keeps the old path only as a redirect, which ends when
another project takes the path.

## What Changes

- The Raster source record names the registry project
  `dig/misc/tools/architecture/architecture-publisher`; the supply manifest and
  the third-party notices are regenerated from it.
- The supply generator derives the closure's archive and integrity in the
  supply manifest from the source record. Until now it derived only the
  notices, and the manifest's hand-kept copy of the location kept the old path.
- The changelog links the tags of 0.1.0-alpha.0 to 0.3.0-alpha.15 at the
  project's new path and records the move.
- Research records dated before the move keep the path they recorded.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None; the registry location is supply data.

## Impact

`renderers/resvg/supply/resvg/source.json`, `renderers/resvg/supply/supply.json`,
`renderers/resvg/supply/resvg/THIRD-PARTY-NOTICES.txt`, `tools/supply/resvg.mjs`
and `CHANGELOG.md`. The
closure's bytes, its digest, the renderer pair and the native witnesses do not
change.
