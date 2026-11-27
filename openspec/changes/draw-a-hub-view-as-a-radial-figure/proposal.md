## Why

The queue item `compositions` asks for a view's composition to be chosen by its shape: tiers, the matrix, a spine and
a radial figure, in that order. Tiers and the matrix have landed. Of the 65 tiers plates of the published editions, 50
miss the blank-rectangle gate, 40 of them with a blank in a corner or along one side beside a first or last row
narrower than the rest. A prototype drew the English tiers views as a spine and as a radial figure; a committee of
three and then a reader who had not seen the work judged the drawings, and the holder decided that a view whose
relations run from one part to most of the others is drawn radial, and that the spine waits for a second round
(`docs/research/radial.md`).

Queue: `compositions`.

## What Changes

- A view of at least four parts whose author declared no tiers and named no composition is drawn as a radial figure
  when its shape is a hub's: the part with the most distinct neighbours relates to at least 75 percent of the view's
  other parts, no other part relates to more than half of them, and at least twice as many of that part's relations go
  out from it as come into it. The choice reads the model alone, before the matrix's rule, so a view is drawn alike in
  every language.
- A radial figure sets the hub in the middle of the box its tiers plate keeps and the other parts on an ellipse that
  fills the box, each part the hub relates to joined to it by a straight line; a relation between two outer parts runs
  as a straight chord, bent once outward where it would touch a card or the hub. Cards, labels, the boundary and the
  plate's width, reading and summary are those of tiers.
- A plate whose radial figure cannot be drawn or would set smaller type is drawn as the matrix's rule or tiers would
  draw it, and its record says that radial was refused and why.
- A view may name `radial` as its composition; one whose radial figure cannot be drawn is drawn in tiers with the
  warning a named matrix that does not fit gets.
- A relation's label keeps one clearance from other lines in every composition, the value the route measure reads, so
  the drawing and its measure agree; the route measure counts lines that are not horizontal or vertical.
- The model and operations references describe the value and the rule; the research page `docs/research/radial.md`
  records the prototype's two rounds, the committee, the reader and the decision.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `poster-composition`: "The matrix chosen by the tiers figure's route defects" leaves hub views to the radial figure;
  "A composition named by the view's author" admits `radial`; three requirements are added: the hub view drawn as a
  radial figure, the radial figure, and the radial figure that cannot be drawn.

## Impact

`docs/reference/model.md`, `docs/reference/operations.md`, `docs/research/README.md`, `docs/research/radial.md`,
`src/layout/measure.mjs`, `src/model/schema.json`, `src/plan/views.mjs`, `src/poster/compose/free.mjs`,
`src/poster/compose/gates.mjs`, `src/poster/compose/plates.mjs`, `src/poster/compose/radial.mjs`,
`src/poster/figure.mjs`, `src/poster/lines.mjs`, `tests/layout-measure.test.mjs`, `tests/model-views.test.mjs`,
`tests/poster-matrix-plate.test.mjs` and `tests/poster-radial-plate.test.mjs`.

A model is accepted as before, and a view may now name `radial`. On the published works six plates are drawn radial:
the AIGW client's `projection`, the OpenAI Responses proxy's `failures` and Film Kit's `overview`, in English and in
Chinese; with them the editions, the page images, the figures alone and the manifest's records of those plates change.
Every other plate is drawn as before.
