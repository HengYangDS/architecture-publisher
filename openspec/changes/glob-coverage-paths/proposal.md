## Why

A coverage scope names directories and exact files, so a model cannot leave out
a kind of file that lives beside the code it describes. Go keeps every test in
a `_test.go` file next to its package: measured at v0.6.0, the AIGW work cites
all 210 production files in its scope, and `archpub check` still reports 314
uncovered files, every one of them a test.

## What Changes

- A coverage path may be a glob: `*` matches within one path segment, `**`
  matches any number of segments, `?` and `[…]` match one character. A path
  without such a character keeps its meaning, a directory when it ends in a
  slash and one file otherwise.
- `archpub check` matches a glob with Git's own pathspec matching at the
  model's revision, case-sensitively on every platform.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: a coverage path may be a glob.
- `source-binding`: the coverage report counts the files a glob matches.

## Impact

`src/model/paths.mjs`, `src/sources/coverage.mjs`, `src/model/schema.json`,
their tests, the model reference, the product skill and the changelog. A model whose paths hold no glob character reports the same
coverage as before.
