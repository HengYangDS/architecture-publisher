## Why

The operations reference stated the four balance gates and their limits, with the side of the square a hole is
counted in, and the model reference and the agent Skill stated the most cards a plate's row holds, each by hand. The
owner chose on 2026-11-28 that each set the documents restate be stated once, in a source the code reads, and written
into each document by `tools/docs/references.mjs`. The maintenance Changes before this one could not reach these two
sets, whose sources are modules of the drawing (`docs/research/one-source.md`), and left them to this item.

Queue: `compositions`.

## What Changes

- The operations reference's sentence of the balance gates is written from the gates and the hole's side, which their
  modules now export where they stand.
- The grid layout states once that a row beside the column of tier labels holds one card fewer.
- The model reference and the Skill state the most cards a plate's row holds, written from the grid layout's limits,
  each a paragraph between its own comment lines; the model reference's bullets and the Skill's step no longer count
  them.
- A test holds the limits that the command-line reference's and the tutorial's example reports print to the gates.
- `archpub skill` prints the Skill as written, so its output carries the new paragraph and the reworded step.
- The research page records both sets as written from their sources.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: the references' measures written from their sources now include the balance gates and the
  cards a plate's row holds.

## Impact

`docs/reference/model.md`, `docs/reference/operations.md`, `docs/research/one-source.md`,
`skills/architecture-publisher/SKILL.md`, `src/layout/grid.mjs`, `src/layout/rows.mjs`, `src/poster/balance.mjs`,
`src/poster/compose/gates.mjs`, `tests/poster-balance.test.mjs`, `tests/references-measures.test.mjs` and
`tools/docs/references/measures.mjs`.

No delivered byte changes, and no program behaviour; `archpub skill` prints the Skill's new paragraph.
