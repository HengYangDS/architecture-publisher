## Context

See [proposal.md](proposal.md). The census of the tiers fill found the defect (`docs/research/tiers-fill.md`). A plate
draws its figure, then moves it across its field to bring the centroid of its ink near the plate's centre line,
"without any of it leaving the span" (`src/poster/plate.mjs`). The figure reports its ink as rectangles; the
boundary's frame is kept out of them on purpose, so that the balance measures do not count an outline as filled
(`src/poster/figure.mjs`). The bound of the move and the check that nothing is drawn outside the plate both read those
rectangles, so neither sees the frame. On the `models` plate the layout's boundary ends at 1746.5 of 1805 px, and a
move of 79 px takes it to 1825.5.

## Goals / Non-Goals

**Goals:** no plate draws its boundary or its stroke outside itself, and the move takes nothing past the plate's
edge; every plate whose move neither bound limits is drawn as before.

**Non-Goals:** what the balance measures count, and how far a figure reaches when its width is chosen; both read the
ink alone, as before.

## Decisions

1. **The frame bounds the move and counts in the containment check, and stays out of the ink.** Rests on: the
   reading of the defect above. Considered: adding the frame to the figure's rectangles, which would make the balance
   measures count an outline as filled and change every bounded plate's measures. Chosen because: the frame is part
   of what the plate must hold, not of what weighs on it. Applies to: the move within the plate and within the field,
   and the check that nothing is drawn outside the plate.
2. **The frame counts out to the outer edge of its stroke, and the move is rounded inward.** Rests on: the frame's
   stroke (1.4 px in the house style) is centred on its outline, so half of it lies outside the frame; and the move,
   a whole number of pixels, was rounded after it was bounded, so a bound at a half pixel let the figure reach half a
   pixel past the plate. Considered: bounding by the frame alone, which left the `models` plate's boundary 0.5 px
   past its edge and most of its right stroke cut off; and growing the frame itself by its stroke, which would change
   the extent of every plate with a boundary. Chosen because: what the plate must hold is the ink it draws. The
   figure, which draws the stroke, reports beside the frame how far it reaches (`stroked`, in
   `src/poster/figure.mjs`). A figure that no whole move keeps within its span, with less than a pixel to spare or
   wider than the span, is centred on it; before, one wider than its span stood flush with the span's left edge.
   Applies to: the move within the plate and within the field, and the containment check, which now reads the
   frame's top and bottom as well, with its tolerance of 2 px. Two of the test fixtures' plates, aigw's overview and
   authority, move 1 px to the right: the old rounding took them less than half a pixel past their span's left edge.
   `tests/plate-fill.test.mjs` records their digests anew.

## Risks / Trade-offs

- A plate whose boundary bounds its move keeps its ink a little further from the centre line than before; its balance
  gates are measured as drawn.
- A figure wider than its plate is left to the width its layout is fitted to, which this Change does not touch. In
  the light runs of single plates the English ETHOS edition's `overview` plate, which has no boundary, reached
  0.5 px past its plate as on dev; in the census of the published editions no card and no boundary's stroke lies
  past any plate.
