## Context

See [proposal.md](proposal.md); the queue item rests on the committee's record `docs/research/edition-carriers-committee-2026-11-18.md`, where `edition-map` joined the queue.
An overview element names a view by `view`; the publisher already numbers it with
its plate. Measured on the twelve editions of 2026-11-23, every plate's question leaves at least 826 pt to the right
margin; a line back is at most 227 pt.

## Goals / Non-Goals

**Goals:**

- Every plate whose view the overview names links back to it.

**Non-Goals:**

- The answer in the head band (`edition-map`'s next Change).

## Decisions

1. The first element in the statement's order.
   - Rests on: a view named twice (a step and a block) needs one line.
   - Chosen because: the statement's order is the reading order of the overview.
   - Applies to: `backOf` in `src/edition/record.mjs`.
2. The overview's name where the element bears the plate's title.
   - Rests on: the drawing of 2026-11-23, where the line back repeated the title on the same page.
   - Chosen because: a fact is said once a page.
3. On the question's line, refused when it would pass the margin.
   - Rests on: the measured room; no plate comes near it.
   - Chosen because: a refusal by an existing code is simpler than a wrap rule no plate needs.

## Risks / Trade-offs

- A question that fills its line leaves no room: the build is refused by name, and the author shortens the question.
