## Why

The queue item `edition-map` reads the edition as one map: a plate's head names the part of the overview it
enlarges, as a link back. Today a plate names only its number, title and question.

## What Changes

- After the question, on its line, a plate's head sets the first overview element that names its view, linked to the
  overview's page; where that element bears the plate's title, it names the overview instead.
- A line back that would pass the margin is refused with `edition_text_wider`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: a plate's head carries a line back to the overview.

## Impact

Changed: `src/edition/record.mjs`, `src/overview/house.typ`, `docs/reference/operations.md` and `CHANGELOG.md`.
New: `tests/plate-link-back.test.mjs`. Every plate whose view the overview names gains a line.

Queue: `edition-map`.
