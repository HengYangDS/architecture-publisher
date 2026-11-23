## Why

The queue item `performance` asks for a build's two media made side by side where a measurement shows a gain. In
the build of ETHOS's Chinese edition on 2026-11-23 the page's Archify run (36.9 to 46.5 s) and the edition's Typst
runs (46.6 to 50.9 s) came one after the other, though the page needs only the planned views.

## What Changes

- A build starts its page where it prepares it and awaits it to write it, after the edition is typeset.
- A page that fails fails there; a check still awaits its page where it prepares it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None: the delivery is the same; only the order of work changes.

## Impact

Changed: `src/build.mjs`, the record `docs/research/build-and-suite-time.md` and `CHANGELOG.md`. New:
`tests/media-side-by-side.test.mjs`. Measured by four builds, base and head twice each, in one ticket.

Queue: `performance`.
