## Why

Architecture Publisher 0.10.2 sets a plate's summary alone when its summary and paths are taller than the body,
but the operations reference still says such a reading is refused: the plate-reading paragraph and the
`edition_reading_too_long` row of the refusal table describe 0.10.1's behavior.

## What Changes

- The operations reference describes the reading as 0.10.2 sets it: the summary and then the paths when both fit,
  the summary alone when they do not, and a refusal only when the summary alone, or paths beside no summary, are
  taller than the body.
- It states that `check` and the manifest, which plan plates without typesetting them, record such a plate's
  reading as set.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None: the `edition-delivery` specification already states this behavior.

## Impact

`docs/reference/operations.md` only. No code, package or edition changes; the docs ship with the repository, not the
package, so the fix reaches readers when it lands on `dev`.
