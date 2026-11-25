## Why

The queue item `page-figures`: the page's diagrams are laid out by the publisher. Archify lays out neither an
entity-relationship nor a class diagram: without a row and a column for each item, a class diagram is refused and an
entity-relationship diagram fails inside Archify (`docs/research/page-figures.md`). So a guide's author must place
each one.

## What Changes

- A guide's entity-relationship or class file that places nothing takes the publisher's grid: the items follow a
  walk of the relationships, at two to four columns; a domain (an entity's `tag`) fills one run of one row, or full
  rows; Archify measures every grid at the build's quality and the first by its route measures is drawn.
- A domain no grid can hold is refused (`page_diagram_unplaceable`); a file with no grid that passes is refused with
  the findings of the grid Archify found least wrong; a file that places anything is drawn as written (its refusal
  is a later Change of the item).
- The research page records the ten published files laid out without their cells.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interactive-map`: a guide's entity-relationship or class diagram that places nothing is laid out by the
  publisher.

## Impact

Changed: `src/map/guide-grid.mjs` (new), `src/map/guide-figures.mjs`, `tests/guide-grid.test.mjs` (new),
`docs/research/page-figures.md` and `CHANGELOG.md`. No delivered byte changes for a model built before: every
published file places its items.

Queue: `page-figures`.
