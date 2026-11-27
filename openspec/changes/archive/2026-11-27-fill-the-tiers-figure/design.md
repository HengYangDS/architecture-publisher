## Context

The queue item `compositions` draws a view in the composition its shape asks for. The matrix Change, archived on dev
`92c19b2b`, draws a tangled dense view as a matrix and left the balance of tiers to this Change. Of the 65 plates of
the twelve published editions drawn as tiers, 51 miss the blank-rectangle gate, 42 of them with the blank in a corner.
No setting of the tiers grid (type step, wrapping, centring, tier labels) makes most of them pass, and no single shape
statistic tells the missing plates from the passing ones: a lone first or last row of one card is as common on
passing plates (9 of 14) as on missing ones (34 of 51). So the fills were drawn and measured, not tuned
(`docs/research/tiers-fill.md`).

## Goals / Non-Goals

**Goals:** fewer tiers plates with a large blank, drawn by the product from the model, with no figure's wiring worse.

**Non-Goals:** the vertical placement of a short figure whose blank is a band across the top or the bottom, the cause
the census names next; Spine and Radial; splitting a view too large for a plate, which is put to the owner when the
item ends.

## Decisions

1. **A band only for an outside thing many parts use.** Rests on: the committee (3 of 3): a band under cards it has no
   relation with tells the reader that every part uses it; that is true of an outside store or platform, false of an
   actor, an entry or a peer part. Considered: every lone end-row card as a band (`band-wide`, 21 of 51 misses
   cleared), a band by kind alone, by coverage of nearly every column. Chosen because: the kind's category is the
   model's own statement of what a part is, so the test reads the model, not the drawing; half the neighbouring row
   is seat 3's test, kept because it asks that the band say something true of the row above or below. The categories
   are those of `src/categories.json` for things outside the code; the half stands once, beside the rule, with the
   decision named. Applies to: a lone card of a first or last row.
2. **Across the whole figure, not over its columns.** Rests on: round 2 over the 65 plates: a band over the columns
   it connects to, for the cards not eligible for a whole one, reached 33 plates and made the blank larger on 19,
   smaller on 10, and added three misses; the whole-width band alone added none. Considered: the narrow band (seats 2
   and 3). Chosen because: it measured worse. Applies to: the eligible card.
3. **No figure's wiring worse.** Rests on: the committee (3 of 3). Chosen because: a figure that answers its question
   less clearly for a better balance is a worse figure; the guard holds per composition and again per plate, and one
   band was taken back in round 2. Applies to: every filled figure.
4. **Justify beside the chosen figure, never a default.** Rests on: round 1: justify everywhere raised route defects
   from 22 to 31 and bent lines that ran straight; round 2: drawn beside the chosen figure and taken on its terms, it
   was taken on six plates and cleared a gate on each, above the five the decision set. Considered: dropping it (one
   seat). Chosen because: on its terms it worsens no plate it is taken on. Applies to: every tiers plate that misses a
   gate.
5. **The matrix chosen on the figure that ships.** Rests on: the committee (3 of 3); round 1 showed that a fill changes
   which views the matrix's rule takes. Chosen because: the rule reads the route defects of what a reader would see.
   In round 2 no view changed between tiers and matrix. Applies to: the matrix's rule.
6. **No fill brings an outside card inside the boundary.** Rests on: the review: a band of an inside kind, or a
   justified row, widened the boundary over person and external cards, and neither crossings nor route defects saw
   it. Chosen because: the boundary's one rule, that it encloses the inside cards and no outside one, holds for a
   filled figure as for a plain one; such a figure is refused, and the plate draws the card as a card or keeps its
   chosen figure. Applies to: the band and the justified figure.
7. **The plate records its fill.** Chosen because: a later calibration reads from a delivery which plates drew a band,
   took the justified figure or had a band taken back, as the matrix records the route defects that chose it.

## Risks / Trade-offs

- The committee and the measures are agents'; no person read the pictures. The owner's direction on blank areas and
  on compositions chosen by shape, 2026-10-28 and 2026-11-02, is the brief they read.
- 50 of the 65 plates still miss the blank-rectangle gate in the shipped code's census (54 on dev, from the same
  works); most have no lone end-row card or a short figure's blank across the top or bottom, the next cause.
- Breaking: the bytes of the plates with a band or a justified figure change.
