## Context

See [proposal.md](proposal.md). The research page `docs/research/one-source.md` records the census of the sets the
documents restate, the five maintenance Changes that write them from their sources, and the two sets they left to this
item: the balance gates, which `GATES` (`src/poster/compose/gates.mjs`) and `HOLE` (`src/poster/balance.mjs`) state
without exporting, and the most cards a row holds, which the grid layout states (`src/layout/rows.mjs`). A maintenance
Change may not change those modules; a Change of this item may.

## Goals / Non-Goals

**Goals:** both sets written into the documents from the modules that state them; every delivered byte and every
command's output as before, but the Skill's.

**Non-Goals:** the gates' values or the layout's limits; the example reports' other values, which are a run's, not
the gates'; Archify's row limits for the interactive page, which no document states.

## Decisions

1. **Export where they stand.** Rests on: each gate stands beside the measure it limits and the pages it was
   calibrated on, and the writer already imports the strip's lengths and the age bands from their modules, saying why.
   Considered: the house's tokens, which the product already reads. Chosen because: the values keep their reasons
   beside them, and in the tokens they would serve the writer alone while changing every edition's bytes, since a
   manifest records the tokens' digest. Applies to: `src/poster/compose/gates.mjs`, `src/poster/balance.mjs` and
   `tools/docs/references/measures.mjs`.
2. **The grid layout's limits, said of a plate.** Rests on: the model reference's five for a tier's row and six for a
   view of `members` are the grid layout's, which draws a view's tiers beside their labels; Archify wraps the
   interactive page's rows at five for every view. Chosen because: the documents described the plate; the sentence now
   says so, and the layout states the labelled row's limit once instead of writing it as one fewer where it is used.
   Applies to: `src/layout/rows.mjs`, `src/layout/grid.mjs`, `docs/reference/model.md` and the Skill.
3. **Example reports held, not written.** Rests on: the command-line reference's and the tutorial's reports are a
   run's output, and writing them would mean laying out plates in a check of generated inputs. Chosen because: a test
   that reads the limits each report prints and compares them with the gates keeps them true at the cost of a light
   test. Applies to: `tests/references-measures.test.mjs`.

## Risks / Trade-offs

- The writer imports two more modules of the drawing, each for the reason its comment gives; a module that stops
  exporting the value stops the writer by name.
- An agent reads the row limits at the Skill's end, a step away from the step that plans the views.
