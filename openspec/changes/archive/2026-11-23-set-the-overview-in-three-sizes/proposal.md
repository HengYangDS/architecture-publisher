## Why

The queue item `edition-map` reads the overview as the edition's map, set in three sizes with fixed roles: one to read
across a room, one on a screen and one when zoomed. The drawn page held those roles except when it ran long: the
closer spacing then set notes and texts a size smaller, beside names at the text's size, so a long overview used four
sizes and its notes lost their role. A trial drawing of the twelve overviews (six works, each in two languages) on
2026-11-23 showed that, with notes kept at their size, eight fit one page unchanged. The owner chose to shorten the
other four, two works in both languages, in the publications, so that the rule holds without a fourth size or a
second page.

## What Changes

- The closer spacing narrows only the gaps. Notes, texts and items keep the text's size and pitch at either spacing,
  and the spacings no longer hold a size or a pitch.
- **BREAKING**: a statement that fitted its page only with smaller notes is refused with `overview_too_tall`, naming
  its first block that does not fit. The publications' Change `shorten-the-overviews-of-two-works` shortened the four
  that did, two works in both languages.
- The spec states the three roles, and a test reads them from a drawn page at either spacing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `overview-page`: the three sizes and their roles; an overview too tall for its page keeps its sizes at the closer
  spacing.

## Impact

Changed: `src/overview/drawn.typ`, `tests/overview-drawn.test.mjs`, `docs/reference/operations.md` and
`CHANGELOG.md`. Every overview set at the closer spacing changes: its notes and texts grow from 11 to 12.5 pt. The
twelve overviews build on one page each from the publications' dev, once their Change has landed.

Queue: `edition-map`.
