## Context

See [proposal.md](proposal.md) and the research page `docs/research/build-and-suite-time.md`, its section "An
assignment measured until it loses (2026-11-23)". The search scores
a completed assignment `unmeasured + routes * ROUTE_DEFECT` and keeps it only when that is below the best score so
far; it already skips the measure when `unmeasured` alone reaches the best.

## Goals / Non-Goals

**Goals:**

- No route defect is counted once the count already decides that an assignment loses.
- Every delivered byte of the twelve published works is the same.

**Non-Goals:**

- Measuring fewer assignments, or a cheaper measure: what each measured assignment needs is unchanged.
- The whole layout's measure (`measureLayout`), which reports every defect.

## Decisions

1. The limit is a count, passed to the measure; the measure stops at it.
   - Rests on: the search compares counts, and the measure finds defects in a fixed order, so the first `limit`
     found with a limit are the first `limit` found without one.
   - Considered: passing the search's comparison into the measure as a function.
   - Chosen because: a count keeps the measure ignorant of scores, and the measure's other callers pass none.
   - Applies to: `src/layout/measure.mjs`.
2. The limit is the fewest defects with which the search's own comparison fails, found by trying counts up from just
   below the quotient. The comparison is `unmeasured + count * ROUTE_DEFECT < best.score`.
   - Rests on: scores hold fractional preferences, so a quotient rounded up could stop one defect early where
     floating point rounds the sum the other way; the comparison grows with the count, so the first count at which
     it fails is where every larger count fails too.
   - Considered: `Math.ceil((best.score - unmeasured) / ROUTE_DEFECT)` alone.
   - Chosen because: it decides as the whole count does in every case, not only where the arithmetic is exact.
   - Applies to: `src/layout/channel-solver/search.mjs`.

## Risks / Trade-offs

- A search that stopped passing its limit would pass the measure's test: the test holds the measure, not the
  search's use of it. The profile read at the item's end would show the time come back.
