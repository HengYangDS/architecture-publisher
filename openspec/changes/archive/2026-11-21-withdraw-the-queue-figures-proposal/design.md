## Context

See [proposal.md](proposal.md). The proposal's head is `b01d7bea`, published only to GitLab; the superseding
Change is archived as `2026-11-16-order-the-queue-by-the-figure-language`.

## Goals / Non-Goals

**Goals:**

- The superseded proposal leaves the Forge through ETHOS's own retirement, and nothing of it is kept beside `dev`.

**Non-Goals:**

- Landing any of its content: the queue's order and the type sizes it argues for were both replaced. Its research
  page `docs/research/reach-of-type-on-figures.md` (244 lines, never on `dev`) is left out on purpose: it argues
  the viewing-distance sizes the owner refused, so the research index does not list it.
- The other hanging proposal, `proposal/word-the-reading-note`, which ETHOS already admits for retirement.

## Decisions

1. Absorb by a merge that keeps `dev`'s tree.
   - Rests on: ETHOS's retirement admits a ref that `dev` holds by ancestry, or one kept by an owned lane or a
     closed review ref, and forbids equivalence by patch identity; the proposal has no lane and no review.
   - Considered: a bundle and a keep ref before deleting it, which the owner refused as a stopgap that piles up
     (「只是打包留存，容易造成垃圾堆积，肯定要优先吸收」); deleting the ref outside ETHOS, which governance forbids.
   - Chosen because: the merge records in `dev` that the proposal was read and not taken, and lets ETHOS retire it.
   - Applies to: one merge commit, `git merge --no-ff -S -s ours b01d7bea`.

## Risks / Trade-offs

- [`dev`'s history gains three commits whose content never lands] → The merge's message says so, and a reader of
  the history finds this Change beside it.
