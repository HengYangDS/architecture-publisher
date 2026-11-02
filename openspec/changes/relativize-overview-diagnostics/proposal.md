## Why

GitLab's Windows CI refused one of the overview's own refusal tests. Typst on
Windows reports the staged files by their absolute verbatim path,
`\\?\C:\…\overview.typ`, so a refusal named the temporary file instead of the
composition's line. Linux and macOS report paths relative to Typst's working
directory. The overview's SVG and PNG were byte-identical on all three
platforms.

## What Changes

- Every path in Typst's diagnostics is made relative to the staged root, on
  every platform, so a refusal names `overview.typ:<line>`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None; the overview's requirements already say that a refusal names the
composition's line.

## Impact

`src/overview/typeset.mjs`, its test and the changelog.
