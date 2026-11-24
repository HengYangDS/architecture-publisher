## Context

See [proposal.md](proposal.md). The queue item rests on the committee's record
`docs/research/edition-carriers-committee-2026-11-18.md`, where the overview became the edition's map and
`edition-map` joined the queue. A census of the editions 0.16.0 built found four views their overviews named nowhere;
the publications named them on 2026-11-22 and their input check refuses one since.

## Goals / Non-Goals

**Goals:**

- No edition holds a plate that its stated overview does not reach.
- The twelve published works build the same deliveries.

**Non-Goals:**

- An edition with a composed overview (no statement): it draws every view by itself.
- The page alone: its sections reach every view.

## Decisions

1. Refuse, where a check had warned.
   - Rests on: the item's clause "every view is reached from the overview", and the publications' check, which
     already refuses it for the works.
   - Considered: keeping the warning, which leaves the clause to whoever reads warnings.
   - Chosen because: a clause of the edition held by a warning is not held; the contract's Evolution makes the
     refusal a breaking release, which 0.18.0 is.
   - Applies to: `src/build.mjs`.
2. The refusal comes before the views are planned, for an edition only.
   - Rests on: the statement and the declared views are all it reads, and planning is most of a build's time.
   - Considered: refusing with the overview's own checks, after the plates are laid out.
   - Chosen because: a model that will be refused is refused in a moment, and a page alone does not need it.
   - Applies to: `src/build.mjs`.

## Risks / Trade-offs

- A model that left a view out on purpose, as a plate reached only from the contents, is refused; its author names
  the view on the overview or drops it.
