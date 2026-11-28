## Why

The queue item `compositions` asks for a view's composition to be chosen by its shape: tiers, the matrix, a spine and
a radial figure. Tiers, the matrix and the radial figure have landed; the spine is the last. Five prototype rounds and
three committees of three found what a spine tells truly: a view that is a pipeline, its path read station to station.
A single line across the figure left its corners blank and its type smaller; a test of the parts alone admitted fans,
trees and hubs; a fold whose rows all read left to right crossed its own relations (`docs/research/spine.md`).

Queue: `compositions`.

## What Changes

- A view that declares no tiers, names no composition and that the radial rule does not take is drawn as a spine when
  a directed path of at least five stations, inside the repository but for its two ends, covers at least 60 percent of
  its parts, every other part relates to a station, at least half its relations join neighbouring stations, and no
  station sends relations to more than three parts. The choice reads the model alone, after the radial rule and before
  the matrix's, so a view is drawn alike in every language.
- A spine sets the path's stations in rows that alternate direction across the box its tiers plate keeps, the path
  turning down at the box's side under an arrowhead and drawn as a relation into the hub is, which the key names the
  main path, while a relation into the hub is drawn plain; every other part stands above or below its station on an
  orthogonal line with at most one bend, a part outside the repository beyond the boundary or in a row of its own.
  Cards, labels, the boundary, the margin, the plate's width, reading and summary are those of tiers.
- A plate whose spine cannot be drawn or would set smaller type is drawn as the matrix's rule or tiers would draw it,
  and its record says that the spine was refused and why.
- A view may name `spine` as its composition; one whose spine cannot be drawn is drawn in tiers with the warning a
  named matrix that does not fit gets.
- The radial figure and the spine share the free figure's helpers, each stated once.
- The model, operations and lines references describe the value and the rule; the research page
  `docs/research/spine.md` records the five rounds, the committees and the decisions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `poster-composition`: "The matrix chosen by the tiers figure's route defects" leaves sequence views to the spine;
  "A composition named by the view's author" admits `spine`; three requirements are added: the sequence view drawn as
  a spine, the spine, and the spine that cannot be drawn.

## Impact

`docs/reference/lines.md`, `docs/reference/model.md`, `docs/reference/operations.md`, `docs/research/README.md`,
`docs/research/spine.md`, `src/locale.mjs`, `src/model/schema.json`, `src/plan/views.mjs`, `src/poster/balance.mjs`,
`src/poster/compose/free.mjs`, `src/poster/compose/plates.mjs`, `src/poster/compose/radial.mjs`,
`src/poster/compose/spine-fold.mjs`, `src/poster/compose/spine-path.mjs`, `src/poster/compose/spine-wires.mjs`,
`src/poster/compose/spine.mjs`, `src/poster/lines.mjs`, `src/poster/strip.mjs`, `tests/cli-commands.test.mjs`,
`tests/model-views.test.mjs`, `tests/poster-matrix-plate.test.mjs`, `tests/poster-radial-plate.test.mjs` and
`tests/poster-spine-plate.test.mjs`.

A model is accepted as before, and a view may now name `spine`. On the published works the rule admits one view,
Architecture Publisher's `page`, whose spine would set smaller type: its two plates are drawn in tiers as before and
their records say the spine was refused for its type. Every other plate is drawn and recorded as before.
