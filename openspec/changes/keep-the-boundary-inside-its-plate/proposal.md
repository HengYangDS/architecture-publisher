## Why

The census of the tiers fill (2026-11-27) found one plate whose system boundary runs past its plate: the English
Architecture Publisher edition's `models` plate is 1805 px wide, and its boundary reaches 1825.5, so the figure's
right side is clipped. The plate is drawn so on dev, before the fill. The layout fits its content width; the move that
centres a figure's ink on its plate is bounded by the figure's rectangles, which leave the boundary's frame out, and
the check that nothing is drawn outside the plate reads the same rectangles.

Queue: `compositions`.

## What Changes

- The move that centres a drawn figure's ink keeps the boundary's frame, out to the outer edge of its stroke, inside
  the plate, as it keeps every card and label; the frame still counts as no ink in the centroid or the balance
  measures.
- The move, a whole number of pixels, is rounded inward where rounding would take what the figure covers past the
  plate's edge; a figure that no whole move keeps inside is centred on the plate.
- A figure whose boundary would lie outside its plate is not composed, as a card outside it is not.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `poster-composition`: "Figure containment" names the boundary and its name among what stays inside the plate.

## Impact

`docs/research/tiers-fill.md`, `src/poster/figure.mjs`, `src/poster/plate.mjs`, `tests/plate-boundary.test.mjs` (new)
and `tests/plate-fill.test.mjs`.

A model is accepted as before. A plate whose boundary bounds its move, or whose move the rounding took past its edge,
is drawn at a smaller move, and with it the editions, the page images, the figures alone and the manifest's records of
those plates change.
