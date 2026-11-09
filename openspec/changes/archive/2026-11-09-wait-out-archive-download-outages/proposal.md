## Why

On 9 November the v0.10.2 release stopped while assembling its archives: GitHub's release downloads answered
`504 Gateway Timeout` for about half an hour, and `tools/release/archive.mjs assemble --official` gave up on
Typst's Windows archive after three attempts 5 and 10 seconds apart. The release then waited for a person for about
two and a half hours, though every download answered again well within that time.

## What Changes

- Downloading a platform's official Node.js or Typst archive retries a server error, a `429` or a dropped connection
  at a doubling interval, from 10 seconds up to 2 minutes, and gives up after 30 minutes; any other refusal stops at
  once, as before.
- `CONTRIBUTING.md` states how long `--official` waits.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None: release assembly is contributor tooling, not packaged and not specified.

## Impact

`tools/release/archive/sources.mjs`, its test in `tests/release-archive.test.mjs` and `CONTRIBUTING.md`. The package,
the archives' bytes and the published editions do not change; an archive already in the tool cache is not
downloaded again.
