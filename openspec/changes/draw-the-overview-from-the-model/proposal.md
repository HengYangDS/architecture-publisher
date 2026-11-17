## Why

Every published work opens with an overview page whose author places every word, line and mark by coordinates in a
Typst file: 168 to 229 values in points a page, six works in two languages. The product contract says that no input
states where anything stands and names this composition as the one input that still does. The owner ruled on
2026-11-17 at 02:08 that a capability of the product should not require its input to write coordinates, and at
13:20 restated that nothing is to be placed by hand: the overview is to be laid out by the publisher, with a
mechanism designed for it. A reading of the six pages (`docs/research/overview-pages.md`) found that they are built
from the same few blocks on one grid, and that what their positions express can be stated as data.

## What Changes

- **BREAKING** A model states its overview in `overview` as blocks, none with a position: the masthead's claim and
  lead; one course of steps, which may hold stations, run on parallel tracks and carry a note and a text, with
  lines between steps; further courses with a labelled step and one outcome that leaves a step; headed lists of
  terms and texts; tables; and groups of lists under one title. A step or a station that is a part of the model
  names it, and the model's label is printed. A model that names a Typst composition in `overview` is refused with
  `model_overview_composition_retired`.
- The publisher draws the overview: the masthead with the count of files it read, the course across the first band,
  and the other blocks in the order stated in rows of halves or thirds, at the house's spacing or a closer one. A
  page whose blocks are taller than the page at both is refused with `overview_too_tall`, naming the block that
  does not fit; a page
  whose text leaves the live area or lies over other text is refused as today.
- A mark on the overview carries one meaning: a station is a ring, the course's ends are larger, a step's parallel
  tracks are thinner lines, and the outcome that leaves a course is drawn in the accent.
- The composition's staging, its refusals of imports and styles, and its missing-file refusal are removed. The
  manifest records the statement's digest beside the class's, the house supply's and Typst's.
- The contract's queue gains the item `overview` before the rest of `composable-parts`, and `carriers` no longer
  holds it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `overview-page`: "Overview composition", "What a composition leaves to the class", "Model references" and
  "Missing composition" are removed; "An overview stated in the model", "A course and its steps", "Lines between
  points of a course", "The overview laid out by the publisher", "An overview too tall for its page", "The
  overview's marks" and "Parts named on the overview" are added; "Overview files" and "Overview in the print
  edition" change.
- `architecture-model`: "Overview composition reference" is removed and "Overview statement" added.
- `edition-delivery`: "Overview inputs in the manifest", "Check without output" and "Print edition" change.
- `pinned-edition`: "A plate's record" changes: the data holds the statement's digest in place of the composition.

## Impact

- Source: `src/model/schema.json`, `src/model/` (validation), `src/overview/` (the drawing, the checks, the
  staging retired), `src/build.mjs`, `src/manifest.mjs`, `src/projection.mjs`, `src/locale.mjs` (the masthead's
  and the foot's words), tests.
- Documents: the model and operations references, the Skill, the contract, the changelog.
- Every published work: its overview composition is replaced by a statement in its models, in the publications
  repository, when it moves to the release that holds this Change.

Queue: `overview`.
