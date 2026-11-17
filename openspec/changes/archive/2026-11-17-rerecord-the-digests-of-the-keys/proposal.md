## Why

The proof of this lane's first Change, `name-a-measure-by-its-fact`, failed on one test of 520:
`a drawing that reports what it drew draws the same bytes: shapes, runs and keys`
(`tests/pinned-face-bytes.test.mjs`). The test pins the digest of every key its fixtures draw, and the Change
words two entries of a strip plate's key anew, so the digests of the three keys that hold those entries differ.
The test did what it is for; its recorded digests are those of the old words.

## What Changes

- The three digests of keys in `tests/pinned-face-bytes.test.mjs` are recorded again from the keys the Change
  draws. No shape and no run of text of a figure changes, and their digests stand as they were.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

## Impact

`tests/pinned-face-bytes.test.mjs`. No source, no document and no delivered byte beyond the first Change's.

Queue: `composable-parts`.
