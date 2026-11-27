## Why

Of the 65 plates of the twelve published editions drawn as tiers, 51 miss the balance gate on the largest blank
rectangle, 42 of them with the blank in a corner, and no setting of the tiers grid passes most of them. The owner,
2026-10-28: a composition whose centre is off, or that leaves too much white, does not meet the requirement. A
prototype drew fills of the tiers figure in two rounds; a committee of three read the first, and the second measured
the decision (`docs/research/tiers-fill.md`).

Queue: `compositions`.

## What Changes

- A lone card of a figure's first or last row whose kind is a thing outside the code that parts use (the categories
  `external`, `database`, `cloud` and `messagebus`), and to which at least half the cards of its neighbouring row
  relate, is drawn as a band across the whole figure; its wires enter it straight, at their other ends' columns.
- A filled figure is kept only when its crossings and route defects are no more than the same figure's drawn plain;
  otherwise the plate is drawn plain. No fill brings an outside card inside the system's boundary.
- Beside the chosen figure, the same figure with each row of two or more cards spread across the width is drawn, and
  taken only when it clears a balance gate the chosen figure misses, misses none it passes, and has no more crossings
  and no more route defects; every row keeps its order of cards.
- The matrix's rule reads the route defects of the figure that would be drawn, its fill applied.
- A plate's record says which card it drew as a band, whether the justified figure was taken, and a band the guard
  took back.
- The operations reference describes the band and the justified figure; the research page
  `docs/research/tiers-fill.md` records the candidates, the committee, the decision and its measures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `poster-composition`: three requirements are added: the band, the guard, and the justified figure. "Cards as large
  as their text" and "No stretched cards" admit the band; "Recorded plates" names what a plate records of its fill;
  "The matrix chosen by the tiers figure's route defects" reads the figure as filled.

## Impact

`README.md`, `docs/product-contract.md`, `docs/reference/model.md`, `docs/reference/operations.md`,
`docs/research/README.md`, `docs/research/tiers-fill.md` (new), `src/categories.json`, `src/kinds.mjs`,
`src/layout/channels.mjs`, `src/layout/fill.mjs` (new), `src/layout/grid.mjs`, `src/poster/compose/gates.mjs`,
`src/poster/compose/plates.mjs`, `src/poster/figure.mjs`, `src/poster/part.mjs`, `src/poster/plate.mjs`,
`tests/edition-plates.test.mjs`, `tests/layout-fill.test.mjs` (new), `tests/plate-fill.test.mjs` (new) and
`tools/docs/references.mjs`.

A model is accepted as before. The plates of views with an eligible card, and those on which the justified figure is
taken, change, and with them the editions, the page images, the figures alone, the data file's faces and the
manifest's records of those plates. In the census of the published editions, built from the same works with dev's
code and with this, 4 of the 54 plates that missed the blank-rectangle gate pass it and none comes to miss a gate; no
view changed between tiers and matrix, and crossings and route defects are as on dev.
