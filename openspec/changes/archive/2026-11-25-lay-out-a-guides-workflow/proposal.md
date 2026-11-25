## Why

The queue item `page-figures`: the page's diagrams are laid out by the publisher. Archify draws a workflow only where
every node names its column (`docs/research/page-figures.md`), so a guide's author must number each step.

## What Changes

- A guide's workflow whose nodes name no column takes the publisher's columns: the longest path along the edges, an
  edge within one lane one step and an edge across lanes none, as the works' authors draw a hand-off; two nodes of
  one lane move apart.
- A workflow that needs more than the six columns Archify draws is refused (`page_workflow_too_wide`); a file that
  names a node's column, or states a phase or a group (which span columns the author chose), is drawn as written (its
  refusal is a later Change of the item); a file whose node ids repeat is passed to Archify as written.
- The research page records the ten published workflows laid out without their columns.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interactive-map`: a guide's workflow that names no column is laid out by the publisher.

## Impact

Changed: `src/map/guide-workflow.mjs` (new), `src/map/guide-figures.mjs`, `tests/guide-workflow.test.mjs` (new),
`docs/research/page-figures.md` and `CHANGELOG.md`. No delivered byte changes for a model built before: every
published workflow names its columns.

Queue: `page-figures`.
