## Why

The queue item `edition-map` asks that every plate print the answer to its question in one place. A plate whose
figure keeps the full body and can set no summary above it printed none: 4 plates of the 0.17.0 works.

## What Changes

- Such a plate sets its view's summary in its head, right of the title and the question's line, from the title's
  baseline, three lines at most above the body.
- A longer summary is refused with `edition_reading_too_long`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: an answer in the head band; a figure that can neither narrow nor shorten keeps the full body
  and its summary stands in the head.

## Impact

Changed: `src/edition/record.mjs`, `src/overview/house.typ`, `docs/reference/operations.md` and `CHANGELOG.md`. New:
`tests/plate-answer.test.mjs`. The four silent plates of the published works gain their answer.

Queue: `edition-map`.
