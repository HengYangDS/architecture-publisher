## Context

See [proposal.md](proposal.md); the queue item rests on the committee's record `docs/research/edition-carriers-committee-2026-11-18.md`, where `edition-map` joined the queue.
The overview's drawn body sets step names and block titles at the head's size (18),
names, notes, texts and items at the text's size (12.5) and labels, track names and plate numbers at the small size
(11); the claim stands at the title's size (34), as every page's title does. `_spacing` in `src/overview/drawn.typ`
held two spacings, each with its gaps, a size and a pitch; the closer one set the small size at a pitch of 14 pt.

## Goals / Non-Goals

**Goals:**

- The three sizes keep their roles on every overview page, whatever its length.

**Non-Goals:**

- A further page for an overview that does not fit one: the works shorten their statements instead (the owner's
  choice of 2026-11-23).
- The other clauses of `edition-map` (the line back to the overview, the answer on every plate, a fact once a page).

## Decisions

1. The spacings hold gaps only.
   - Rests on: a trial drawing of the twelve overviews on 2026-11-23: eight fit as they stood; the other four, two
     works in both languages, fit after the publications shortened them.
   - Considered: keeping the size in each spacing and setting both to the text's; a further page for a long overview.
   - Chosen because: a spacing that cannot hold a size cannot break the roles again, and the size and pitch are then
     stated once, by the house.
   - Applies to: `src/overview/drawn.typ`.
2. The test reads the roles from drawn pages.
   - Rests on: `checkOverview` returns every text's box with its size.
   - Chosen because: a page at either spacing either sets its texts at their roles' sizes or fails by name.
   - Applies to: `tests/overview-drawn.test.mjs`.

## Risks / Trade-offs

- A model that built with 0.17.0 may be refused, by `overview_too_tall` naming its first block. The contract's
  Evolution allows it before 1.0; the changelog says so, and the works' four long statements were shortened first.
- The closer spacing now saves only its gaps, not a size, so a statement near the limit fits less than before; that
  is why four overviews were shortened.
