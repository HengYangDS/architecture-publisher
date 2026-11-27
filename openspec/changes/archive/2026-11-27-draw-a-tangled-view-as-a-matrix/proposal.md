## Why

Every view is drawn as tiers today. On a dense view whose relations run long, tiers wraps and crosses its wires on the
way to one target, and the reader follows the wrong line. The queue item `compositions` asks for more than one
composition of a view, chosen by the view's shape or named by its author. A committee read four dense views drawn
both ways and kept the matrix, in label cells, for the views whose tiers figure tangles; readers' picks on the dense
views of the published works then set the measure and the threshold that choose it (`docs/research/matrix-choice.md`).

Queue: `compositions`.

## What Changes

- A view can be drawn as a matrix: its parts are the rows and the columns, in the order its relations flow (sources
  first, the parts of a cycle together); a relation is a cell that holds its label, tinted in its line's colour; a
  label that every mark of a row or a column shares is said once at its head; the boundary is a bracket over the
  inside rows and columns; the empty corner reads "from ↓ to →" in the edition's language. The matrix is drawn in
  the box its tiers plate keeps, so the plate's width, reading and summary are those of tiers.
- A view of at least 8 parts that declares no tiers is drawn as a matrix when its figure in tiers at the full width
  has at least two route defects and a matrix fits. The rule's two numbers are stated once, beside the rule, with the calibration named.
- A view may name its composition, `tiers` or `matrix`, in a new optional field. A named matrix that does not fit is
  drawn as tiers and the build reports the warning `plate_composition_unfitted`. The model's schema states the field,
  the publisher's checks read its values from there, and another value is the problem `model_composition_invalid`.
- A matrix plate's record names its composition and the route defects of the tiers figure that chose it. Its balance
  is measured on its heads, its filled cells at their tint and its words, not on its rules, diagonal and brackets.
- A matrix plate's key draws the boundary as the bracket the matrix draws, and a planned or retired status as a cell
  edged in that status's dash.
- Every width the matrix strokes reads a token of the house: its cell rules and its diagonal gain `strokes.cellRule`
  and `strokes.diagonal`, at the hairline they were drawn at; the key's cell sample is edged as a cell is.
- The model, operations and lines references describe the field and the matrix; the research page
  `docs/research/matrix-choice.md` records the committee's decision and the calibration.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `poster-composition`: five requirements are added: the matrix's cells; its heads, boundary and corner; its box and
  record; the rule that chooses it; the composition a view's author names, with its fallback. "Balance measurement
  regions" is modified: a matrix's rules, diagonal and brackets are left out of its balance.

## Impact

`src/poster/compose/matrix.mjs`, `src/poster/compose/matrix-draw.mjs` and `src/poster/compose/flow.mjs` (new),
`src/poster/compose/plates.mjs`, `src/poster/part.mjs`, `src/poster/lines.mjs`, `src/build.mjs`, `src/house.json`,
`src/locale.mjs`, `src/overview/house.typ`, `src/model/schema.json`, `src/model/vocabulary.mjs`, `src/model/load.mjs`,
`src/model/normalize.mjs`, `src/plan/views.mjs`, `src/refusal.json`, `tests/poster-matrix.test.mjs` (new),
`tests/model-views.test.mjs`, `tests/one-source-tokens.test.mjs`, `docs/reference/model.md`,
`docs/reference/operations.md`, `docs/reference/lines.md`, `docs/reference/development.md`, `docs/reference/data.md`,
`docs/reference/refusals.md`, `docs/research/README.md` and `docs/research/matrix-choice.md` (new).

A model that names no composition is accepted as before, and its views of fewer than 8 parts, or with declared tiers,
are drawn as before. A dense view whose tiers figure has two route defects or more is drawn as a matrix where it fits,
so the plates, the edition, the page images, the figures alone, the data file's faces and the manifest's records of
such views change. In the calibration, built on the matrix's prototype, the rule took 11 of the 51 dense views of the
published works; the census of this Change's code drew the same 11 as matrices, every figure within its plate's width. The
manifest's digests of the class's inputs, `edition.house` and `overview.house`, change: `src/house.json` gains two
tokens and `src/overview/house.typ` the key's samples of a matrix. A model that names `composition` is refused by a release
that does not know the field.
