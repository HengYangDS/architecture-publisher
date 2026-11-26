## Context

The research page on tidiness (`docs/research/tidiness.md`) describes a measure that reads finished PDF pages. Its
census found, among other things, pages over a budget of type sizes, text styles and stroke widths, and one mark
drawn in two weights; the queue item `compositions` names both as untidiness no gate holds. A read of dev on
2026-11-27 (`cdde0170`) found 34 stroke widths written as numbers in five files of `src/`, and the seal's three
strokes written as shares of its size. The value-table capability holds a relation's line, a status's pattern and
the boundary to the table of lines, and leaves the other widths outside it; nothing held those.

## Goals / Non-Goals

**Goals:** each mark stroked at one width, stated once and named by its mark, read by the figure and the key alike;
a test that fails when a width holds a number of its own; the census's budget settled.

**Non-Goals:** changing a width the figure or the pages draw, except where one mark was drawn at two; type sizes and
text styles (the research page records that no test refuses a size written as a number); the balance gates, which
the item's other Changes take up.

## Decisions

1. **Groups of tokens, by unit.** The figure is drawn in pixels and the table of lines states its weights in pixels,
   so the figure's other widths join a new group `strokes` in pixels: `card` 1.2, `tier` 1.4, `icon` 2 (in the icon's
   own 24-unit box, which the figure and the key size alike). The pages are set in points and the class already reads
   `weights` as points (`_line`), so each mark of the pages gains its weight there. The seal is drawn to its own size,
   so its strokes stand as shares of that size under `seal.weights`. The key, set in points, reads a figure width
   times the plate's scale, as it already does for the boundary.
2. **A weight is named by its mark, and one mark has one weight.** Where two numbers drew the same mark they become
   one weight (the tracks of a stretch and the paths of a fork, which carry the course alike; the four smaller rings;
   the bar and stems of one comb). Where one number drew two marks they stay two weights (a ring and a line of the
   same width). A station's ring was the one mark drawn at two numbers: 1.4 pt on a stretch of parallel tracks and
   1.7 pt elsewhere, at the same radius, colour and meaning. It takes the ring's weight everywhere: the census's rule
   reports such a pair, the owner named a ring thinner than its fellows as untidy (the research page's remark of
   2026-11-15), and at 1.4 pt it was thinner than the 1.6 pt track it stands on. Every other value stays as it was.
3. **The key draws a sample at its mark's width.** The outside part's sample takes a card's width; the planned and
   retired samples, which are lines, take a relation's line's width. An icon is drawn in its own box at the icon's
   token, as the figure draws it at the part's name's size.
4. **A test is the gate, stated positively.** The census measures pages after they are built; the cause it found is a
   number in the source, and a test of the sources fails before a page is built. A width is a token, a parameter or a
   product of them, so a number in it is refused: in an SVG's `stroke-width`, in the JavaScript's strings and the
   Typst's; in a Typst `stroke` or `thickness`, its dash aside; and in the weight a stroke primitive of the class takes
   by name (`w` of a line or a ring, `between` of a list), read in the call's own arguments, the condition of a
   choice aside. A Typst line with no stroke, or a shape with neither stroke nor fill, is refused too, since Typst
   strokes it at a width of its own. The colophon's ring takes its width by name. A case test feeds the search one
   example of each form, refused and passed, and on dev's sources it finds the 34 widths and the seal's band.
5. **The budget is dropped.** Its numbers were constants of the measure's script that nobody judged, and each count
   measures how many kinds of thing a page sets, not whether it is tidy: with every width a token, a count of widths
   is a count of marks; the class sets type at the house's sizes and the figure at its scale's steps, so a count of
   sizes or styles is one of the scales a page sets. The second proof's two accepted budget findings were one tier
   counted as two sizes.
6. **The unused `tick` goes.** It was a primitive of the class that nothing calls; giving it a weight would keep a
   token for no mark.
7. **`compositions` moves before `page-figures`.** The contract's rule for an outside wait, that it holds only the
   work that needs it, moved `page-figures` after `reader-file` on 2026-11-25 and `derived-references` before it on
   2026-11-26. On 2026-11-27 the release of Archify it waits for has still not come, and nothing of `compositions`
   reads a guide's diagram file.
8. **The ring check reads each ring's width.** The overview's check that no text lies under a ring took the house's
   ring weight as every ring's, which held only while no ring was heavier. The drawing records a ring's width beside
   its centre and radius, as it does a line's, and the check reads it.
9. **The tests read the source with its comment lines dropped first.** A line that is a comment and quotes `/*`
   opened a block comment over the code after it (`src/sources/scope.mjs` lost six lines to the searches).

## Risks / Trade-offs

- The Typst is changed in three files; the light tests typeset the key and the colophon, and the heavy tests that
  draw the overview run in the lane's pre-run under the host's queue before the lane starts.
- Typst sizes a `dashed` or `dotted` pattern from its thickness, so the planned and retired samples' dashes grow with
  their width by the same share, about a fifteenth.
- The release is a breaking one: a delivery's bytes change where a key shows an outside part or a status, and where
  an overview has a stretch of parallel tracks.
- The test reads a width where the source gives one by name or writes one into an SVG string. A width passed to a
  primitive by position, a number the JavaScript keeps under another name and writes into a `stroke-width`, and an
  SVG element that takes its width from Typst's or a browser's default are not seen; the house's primitives take
  their widths by name, and the research page records the rest as held by reading. Nor can the test tell two tokens
  of one mark apart: a token is named by its mark, and a second name for one mark is found by reading them.
