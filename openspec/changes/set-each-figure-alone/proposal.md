## Why

The owner asked on 2026-11-17 whether a figure could be exported alone with a transparent ground, and on
2026-11-19 why the PNG has none; his brief says the static pictures go mainly into slides and documents. A delivery
today holds whole pages only, with the paper's colour painted under every relation's label and under the boundary's
name, so a figure taken out of its page carries patches of its ground.

## What Changes

- A delivery holds, beside each page's image, the view's figure and its key alone, cut to what the figure draws on,
  as PNG on a transparent ground and as SVG of one document whose text is outlined glyphs.
- The manifest and the data record a plate's two figure files beside its images, the reader file names them, and
  `archpub verify` and `archpub compare` hold them as they hold a page's image.
- A line and the boundary's frame are broken where a label or the name stands on them, by a clip path with a hole
  for each such box; no patch of the ground covers anything, and the figure reads on any light ground.
- The key's entries are said in the fewest words that stay clear (the owner, 2026-11-19 15:36).
- A plate's page states its commit's date once, in its foot (the owner, 2026-11-19 18:36).
- A page's image is 3840 px wide unless the caller names its widths.
- The queue: `edition-map` follows this item, before `page-figures`, and its wording takes the owner's rulings of
  2026-11-19 on the contents and the last page.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: a delivery holds each plate's figure alone; a page's image is 3840 px wide by default; a
  plate's page states its commit's date once, in its foot.
- `poster-composition`: a line is broken under a label by a gap and nothing is filled with the page's colour; the
  key names a band by its bounds and a unit.

## Impact

`src/poster/figure.mjs`, `src/poster/strip.mjs`, `src/poster/compose/plates.mjs`, `src/locale.mjs`,
`src/overview/house.typ`, `src/house.json`, `src/edition/typeset.mjs`, `src/edition/record.mjs`, `src/build.mjs`,
`src/manifest.mjs`, `src/projection.mjs`, `src/pinned/`, `src/delivery.mjs`, `src/cli/`; the tests above them and the
digests they pin; the reference pages, the tutorial, the README and the Skill where they state what a delivery
holds; `docs/research/figures-alone.md`. Every plate's bytes change, and the image named without its width is the
one at 3840 px, so a caller that asked for 2400 px by default now names it.

Queue: `figures-alone`.
