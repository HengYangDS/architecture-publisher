## Why

A release is finished when every channel carries it, and the plate in the README is built by the released version
from the publisher's own work (`CONTRIBUTING.md`). Architecture Publisher 0.16.0 is on both Forges, on npm and in the
Homebrew tap; the README still shows the plate 0.15.0 built.

Its changelog also says what 0.16.0 does not. A supply Change of 2026-11-18 put its entries under bullets that had
become the 0.15.0 section on `dev`, so the 0.15.0 section says it shipped `lucide-static` 1.74.0, the `minimatch`
override 11.0.9, npm 12.2.3 and OpenSpec 2.1.0. The release v0.15.0 holds 1.73.0, 11.0.8 and OpenSpec 2.0.0; v0.16.0
is the first release that holds the new ones.

## What Changes

- The README shows plate 01 of the publisher's own edition built by 0.16.0, at 2400 px as before, and its caption
  says so.
- The 0.15.0 section of `CHANGELOG.md` is set back to the text released with its tag, and the 0.16.0 section records
  the icons, the `minimatch` override and the npm, OpenSpec and mise moves.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No behaviour of the product changes.

## Impact

`README.md`, `docs/images/architecture-publisher-plate-01.png` and `CHANGELOG.md`. No source and no test.

Queue: `maintenance`.
