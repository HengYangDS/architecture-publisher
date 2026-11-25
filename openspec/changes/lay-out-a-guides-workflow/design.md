## Context

See [proposal.md](proposal.md). The measures lie in `docs/research/page-figures.md`; the kit in the checkout's
ignored `build/runtime/work/page-figures/` (`c/`, `copy-c/`).

## Goals / Non-Goals

**Goals:**

- A guide's workflow that names no column builds, its steps in the order its edges give.

**Non-Goals:**

- The refusal of a placed file and the repository from the model: the last Change of the item.

## Decisions

1. A hand-off between lanes keeps its column.
   - Rests on: `docs/research/page-figures.md`: with that rule all ten published workflows pass at showcase with
     every route measure zero, the widest in six columns; a step across lanes as well needs seven columns for one.
   - Considered: a step for every edge, which widens a workflow by each hand-off.
   - Chosen because: it is the authors' own rule, and it keeps workflows within what Archify draws.
   - Applies to: `workflowColumns`.
2. One layout, no candidates.
   - Rests on: the columns follow from the edges; Archify validates the page when it is delivered.
   - Considered: candidates ranked by Archify's measures, as for a grid.
   - Chosen because: nothing is left to choose, and no Archify run is spent.
   - Applies to: `workflowLayout`.

## Risks / Trade-offs

- A cycle is cut at the edge that would close it, in document order: the column follows the author's order of the
  edges there.
- A workflow longer than six steps in one lane is refused; none of the published works has one.
- A workflow with phases or groups keeps its author's columns: their spans name columns, which the publisher's would
  not match. None of the published workflows states either.
