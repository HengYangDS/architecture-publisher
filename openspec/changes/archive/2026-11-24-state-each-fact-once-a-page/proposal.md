## Why

The queue item `edition-map` asks that a fact be stated once a page. A census of the twelve editions of 0.17.0 found
two repeats in every edition, both the house's: the cover states the date at its top right and in its byline, and the
overview states the commit and its date in its head and in its foot.

## What Changes

- The cover states the date in its byline only; the overview in an edition states its commit and date in its foot
  only. The overview checked alone, which has no foot, keeps its build line.
- The edition's words for the build line, now unused, are dropped.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: one date a page holds for the cover and the overview too.

## Impact

Changed: `src/overview/house.typ`, `src/edition/record.mjs`, `src/edition/words.mjs`, three test files and
`CHANGELOG.md`. New: `tests/page-facts-once.test.mjs`. Every edition's cover and overview change.

Queue: `edition-map`.
