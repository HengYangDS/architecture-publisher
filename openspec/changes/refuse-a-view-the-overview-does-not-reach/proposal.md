## Why

The queue item `edition-map` reads the landscape edition as one map: every view is reached from the overview. The
publisher only warned of a view that nothing on a stated overview names (`overview_view_unreached`), so an edition
could still hold a plate a reader finds only in the contents. The publications' input check has refused one for the
published works since 2026-11-22, after their overviews named the four views that census found unreached; the
clause belongs to the product, for every work.

## What Changes

- **BREAKING**: an edition that sets a stated overview refuses with `overview_view_unreached` a view that nothing on
  the overview names, before any view is planned, naming each such view's path. A check of the page alone is
  unchanged.
- The model reference, the code table of the operations reference, the test and the changelog say so.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `overview-page`: a view the stated overview does not reach is refused, where it was reported.

## Impact

Changed: `src/build.mjs`, `tests/overview-plates.test.mjs`, `docs/reference/model.md`, `docs/reference/operations.md`
and `CHANGELOG.md`. A model another release accepted with an unreached view is refused: a breaking release under the
contract's Evolution. The twelve published works build as before; their deliveries do not change.

Queue: `edition-map`.
