## Why

The queue item `page-figures`: the page's diagrams are laid out by the publisher. After the item's earlier Changes a
guide's author still sets a dataflow's rows and a sequence's message heights, which Archify requires and does not set
itself (`docs/research/page-figures.md`).

## What Changes

- **Breaking:** a guide's dataflow file that sets a node's row, and a sequence file that sets a message's height or
  states segments or activations (which span heights), are refused (`page_diagram_publisher_field`).
- A guide's dataflow takes the publisher's rows: each stage's nodes ordered by their neighbours in the stages beside
  it, each stage in one of the row patterns Archify's own examples use; Archify measures the candidates in turn and
  the first that passes with every route measure zero is drawn, else the first that passes. A stage of more than
  five nodes is refused (`page_dataflow_too_tall`).
- A guide's sequence takes the heights Archify's own draft shorthand sets: 48 apart from 160 down. A phase that frames
  messages stays the draft's inline `@sequence` with its `phase` rows, which Archify lays out itself.
- The references and the research page say so.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interactive-map`: a guide's dataflow and sequence leave their rows and heights to the publisher.

## Impact

Changed: `src/map/guide-rows.mjs` (new), `src/map/guide-figures.mjs`, `tests/guide-rows.test.mjs` (new),
`docs/reference/model.md`, `docs/reference/operations.md`, `docs/research/page-figures.md` and `CHANGELOG.md`. No
published work holds a dataflow or a sequence as a file: their sequences are inline in the draft.

Queue: `page-figures`.
