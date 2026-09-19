## Why

Full browser acceptance preserves about 116 MB of measured JSON across four
viewports and repeatedly rewrites growing partial reports. The measurements must
remain complete, but their storage and checkpoint encoding need not be redundant.

## What Changes

- Store new completed reports as bounded lossless gzip JSON.
- Read immutable historical JSON reports and new compressed reports through one decoder.
- Retain small progress checkpoints and final partial evidence on failure, without
  rewriting the entire accumulated measurement set after every page.
- Measure unchanged report values, coverage verdicts, bytes and encoding work.

## Capabilities

### New Capabilities

- `browser-evidence`: bounded lossless browser report transport.

### Modified Capabilities

None.

## Impact

Browser execution, natural story clocks, viewport coverage, screenshots, exports,
source identity and checker identity remain unchanged. No prior release is edited.
This is one P0 increment, not completion of structural evolution or other campaign phases.
