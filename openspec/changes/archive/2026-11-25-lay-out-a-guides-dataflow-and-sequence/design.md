## Context

See [proposal.md](proposal.md). The measures lie in `docs/research/page-figures.md`; the kit in the checkout's
ignored `build/runtime/work/page-figures/` (`e/`, `copy-e/`, `NOTES-e.md`, `rows-proto.mjs`).

## Goals / Non-Goals

**Goals:**

- A guide's dataflow and sequence files state what they show, and no place.

**Non-Goals:**

- A sequence's phase frames as a file: the draft's inline `@sequence` has them, and Archify lays it out.

## Decisions

1. A dataflow's rows from the authors' own patterns, measured.
   - Rests on: `docs/research/page-figures.md`: on Archify's three dataflow examples, spreading each stage over a band
     passed one, rows that follow the flows none, and the authors' row patterns per stage, in the layered order,
     passed all three with every route measure zero; in the publisher's order, at the 3rd, 9th and 14th candidate.
   - Considered: a band per stage, packed or spread; rows following the flows.
   - Chosen because: it is the only rule that placed every example; each candidate is one Archify run, kept between
     builds as a candidate's answer. At most 64 are measured, those nearest every stage's preferred pattern first,
     so each stage is varied before any candidate strays far (the review of 2026-11-25 found a plain cut of the
     product left the first stages unvaried). A refused answer is not kept, as the grid's are not: a dataflow refused
     for a reason no row cures is asked again at the next build.
   - Applies to: `stageOrder`, `rowCandidates`, `dataflowLayout`.
2. A sequence at Archify's own shorthand heights.
   - Rests on: Archify's draft shorthand sets `160 + 48 × i`; the four sequence examples, their segments, activations
     and view box removed, pass at showcase with every measure zero at those heights.
   - Considered: a height that grows with a message's note.
   - Chosen because: it is Archify's own rule, and it passed every example.
   - Applies to: `sequenceLayout`.

## Risks / Trade-offs

- A dataflow whose 64 candidates all fail is refused, where an author's hand might have placed it. None of the
  examples needed more than 14.
- A long note may need more room than 48. Archify's advice is then to set a height or a view box, which a guide's
  file may not; the refusal is the place to shorten the note. Without a view box Archify sizes the canvas to its
  content; notes of 40 and 600 characters passed in the review.
