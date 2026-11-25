## Context

See [proposal.md](proposal.md). The measures lie in `docs/research/page-figures.md`; the kit in the checkout's
ignored `build/runtime/work/page-figures/` (`b/`, `copy-b/`).

## Goals / Non-Goals

**Goals:**

- A guide's entity-relationship or class file that places nothing builds, its relationships readable.

**Non-Goals:**

- A workflow's columns, the refusal of a placed file and the repository from the model: later Changes of the item.

## Decisions

1. A walk of the relationships orders the cells.
   - Rests on: `docs/research/page-figures.md`: grids in that order measure as clean as the authors' placing in all
     ten published files, at two to four columns.
   - Considered: every permutation, which grows as the factorial of the items.
   - Chosen because: it keeps related items near and needs no search.
   - Applies to: `walk`, `gridCells`.
2. A domain fills a rectangle, or the column count is no candidate.
   - Rests on: Archify refuses a domain whose members do not fill a solid rectangle (`erd/domain-not-drawn`).
   - Considered: moving members until they fill one, which is a packing problem.
   - Chosen because: one run of one row, or full rows, is always a rectangle; another column count usually holds it.
   - Applies to: `gridCells`.
3. Archify's own route measures rank the grids.
   - Rests on: Archify measures an entity-relationship and a class diagram's routes as it does an architecture's; the
     publisher's own measures read architecture layouts only.
   - Considered: the publisher's measures, which would need Archify's layout of these kinds.
   - Chosen because: they are what Archify checks, and the grids are few.
   - Applies to: `gridLayout`.

## Risks / Trade-offs

- A domain of more than four members that none of two, three and four divides (five, seven, ten, eleven members)
  has no candidate and is refused with `page_diagram_unplaceable`; none of the published works has one.
- A grid passes as the chooser's candidates pass (every check, no error or warning), and a route measure Archify no
  longer reports refuses the diagram (`page_measures_missing`), as it does the generated page's.
- Each grid costs one run of Archify at each build and check (three at most), kept between processes as the
  candidates' answers are.
