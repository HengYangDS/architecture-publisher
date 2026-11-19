## Context

See [proposal.md](proposal.md) and the research page [figures alone](../../docs/research/figures-alone.md), which
records the trial and the receivers' own documents. A figure's shapes are one SVG and its text is set by Typst at the
engine's positions; inside the figure the paper colour fills two kinds of rectangle — under a relation's label and
under the boundary's name — and each covers a line.

## Goals / Non-Goals

**Goals:**

- A figure alone on any light ground: PNG with alpha, and one SVG of shapes and outlined glyphs.
- The edition's own pages unchanged to the pixel where the change does not show.
- What the key prints said in the fewest words that stay clear.

**Non-Goals:**

- A dark ground, or a ground the palette supplies: the palettes are chosen for light grounds.
- Sizing the figure for a particular slide: the caller scales it.
- Live text in the SVG: a reader without the faces would see other glyphs.

## Decisions

1. A gap in a line is a hole of a clip path, not a patch of the ground.
   - Rests on: the research page's trial (`try2/`, `try3/`), read in five renderers; the edition's pages against the
     released 0.15.0's, 0 to 3 pixels of 8,294,400 a plate.
   - Considered: the plate of paper, which has the page's colour (today); cutting each path at the label's box, which
     computes the intersection of every wire with every label and restarts a dash pattern at each cut.
   - Chosen because: it needs no geometry beyond the boxes the engine already places, and it leaves no mark on
     another ground.
   - Applies to: the boundary's edge, the wires and their arrowheads; the two rectangles of paper go.
2. The figure is set alone from the same page machinery, on no ground, cut to the box the plate records.
   - Rests on: Typst's PNG export of a page filled with none has alpha; its SVG nests the figure as a base64 image,
     which becomes a nested `svg` under the image's transform.
   - Considered: a figure drawn by the engine's own SVG writer with the text as paths, which the engine's text shaper
     would have to feed; the data URI left as it is, which a drawing program shows as one image.
   - Chosen because: one document of shapes and outlined glyphs, which PowerPoint, Keynote, Pages and Figma document
     they break into shapes, without a second text shaper.
   - Applies to: `figures/NN-<view>.png` and `.svg`, one each to a plate, at the density of the widest page image.
3. The key's entries are a bound and a unit, and what the bands count from leads them.
   - Rests on: the owner's words of 2026-11-19 15:36 to 15:38; the key's ink on one figure, 93 per cent of its width
     before and 53 after in English, 75 and 52 in Chinese.
   - Considered: breaking a long key onto two lines, which treats the symptom and keeps the sentences.
   - Chosen because: what a key says of a bound, a size or a count is a bound, a size or a count.
   - Applies to: `src/locale.mjs` in five locales, `src/poster/strip.mjs` for the order, `src/poster/compose/plates.mjs`
     for the boundary and the outside ground.
4. A page states its commit's date once, in its foot; a figure set alone, which has no foot, states it in its key.
   - Rests on: the owner's question of 2026-11-19 18:36, whether the key's date and the foot's are redundant; the
     trial, in which a plate's page above its key differs from the released 0.15.0's by 7 pixels of 8,294,400.
   - Considered: the date in the key and none in the foot, which leaves the pages without a key (the contents, the
     overview) undated; the date in both, as today.
   - Chosen because: the foot stands on every page and names the release and the commit beside the date, so it is
     the one place a reader looks for what the page was built from; the key says what its bands count from.
   - Applies to: the key of a plate's page (`src/overview/house.typ`, `_key`) and of a figure set alone. The title
     page, the contents page and the overview page each state the date more than once as well; they are the item
     `edition-map`'s, whose design takes one statement of the pin a page.
5. A page's image is 3840 px wide unless the caller names its widths.
   - Rests on: the owner's word of 2026-11-15 20:58; the sets the kit built at 3840 px since 2026-11-19.
   - Considered: 2400 px, the present default.
   - Chosen because: a screen larger than 1920 px is the owner's own.
   - Applies to: the default of `--png`.

## Risks / Trade-offs

- [Every plate's bytes change, so the works' pinned faces and the fixtures move] → The pinned faces are drawn anew by
  the release and the fixtures state their extents, as the test run of the trial showed (`try5/`).
- [A figure wider than its key allows] → A key breaks between entries, and a lone figure is at least as wide as its
  widest entry; a key that would need a third line is still refused, as the edition refuses it.
- [A mark lost on a ground of its own colour] → Each sample stands one place before its word; the research page says
  which palettes dye the oldest band as their ink.
- [The drawn calls named in Film Kit's model: the narration view does not fit with two more relations] → Their
  placement is the model's, not this Change's.
