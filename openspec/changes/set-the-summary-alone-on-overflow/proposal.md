## Why

The view summaries drafted for the six published works do not fit their plates. Built with 0.10.1, 18 of 82 plates
are refused with `edition_reading_too_long`: beside a narrowed figure the plate sets the summary and then every path
its shown components claim, and the paths alone fill most of the column. Shorter summaries barely help, since 13 of
41 English plates are still refused with summaries of 120 to 220 characters, while every summary alone fits.

## What Changes

- A plate whose summary and paths are taller than the body sets its summary alone, without the heading for where each
  part lives or the paths below it. A summary alone taller than the body is still refused with
  `edition_reading_too_long`, since text is never shrunk.
- A plate whose summary and paths fit is typeset as in 0.10.1.
- The release is 0.10.2.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: a plate's reading sets its paths only when they fit beside its summary.

## Impact

`src/overview/house.typ`, its tests, `CHANGELOG.md`, `VERSION`, `package.json` and `package-lock.json`. Editions whose
readings fit are typeset as in 0.10.1; an edition 0.10.1 refused for a reading whose summary alone fits now builds.
