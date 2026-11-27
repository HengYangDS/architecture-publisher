---
subject: architecture-publisher:lines
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Line values

A plate's lines are drawn from one table inside the product, the `lines` section of `src/house.json`. The figure,
the key and the tests read it; a model cannot name, add or change a row. The table holds what a row means, how it
is drawn, what it answers, whether a work has tested it, what a delivery's HTML page does for it and its sample in
the key; the table below is written from it. Values are in
the plate's drawing space, in which one pixel is one pixel of an image 2400 px wide, 0.8 px of one 1920 px wide
and 0.4 px of one 960 px wide: the three widths the trials measured at.

<!-- lines: written from src/house.json by tools/docs/references.mjs; do not edit -->

| Row         | Means                                | Drawn on a plate                                                 | Answers                                              | Tested by a work         | On the page                                                       |
| ----------- | ------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------- | ------------------------ | ----------------------------------------------------------------- |
| `relation`  | a relation between two parts         | continuous, 1.6 px                                               | Which part acts on which?                            | yes                      | a connection's line, as the page's renderer draws it              |
| `emphasis`  | a relation into the view's hub       | continuous, 2 × the relation's weight; arrowhead 1.45 × as large | Which part do most relations lead to?                | yes                      | no expression                                                     |
| `boundary`  | the edge of the described repository | dashes of 8 px, gaps of 5 px; 1.4 px                             | Is part X inside the described repository?           | yes                      | a region around the parts inside, as the page's renderer draws it |
| `citations` | the files a relation cites           | a number                                                         | How many files does the model cite for the relation? | yes                      | no expression                                                     |
| `planned`   | a planned part or relation           | dashes of 6 px, gaps of 4 px                                     | Is X built, planned or retired?                      | not yet tested by a work | a dashed line for a relation, the same as a retired one           |
| `retired`   | a retired part or relation           | dashes of 1.5 px, gaps of 3.5 px                                 | Is X built, planned or retired?                      | not yet tested by a work | a dashed line for a relation, the same as a planned one           |

<!-- end of lines -->

Weight carries emphasis and nothing else, at two levels. In an edition that draws strips, a relation into the view's
hub that is not retired is drawn at the heavier weight in the oldest dye and ends inside its larger arrowhead; a
planned one keeps its dashes, and a retired one keeps its faint colour, the ordinary weight and its dots. There, a
relation that cites files carries their number near its source, in the smallest figure type and its line's colour,
at the first place along its own line where its figures touch no part, label, line or other number; with no such
place it stands at the first and the result carries the warning `citation_count_touches`, which names the plate
and the relation. In an edition that draws no strip, whose build reads no checkout or whose model claims no files,
every line is drawn alike and carries no number.

The `emphasis` row stands by the owner's ruling of 2026-11-15 and not by its reading. When the rebuilt plate was
read, every reading named the hub, and two of eighteen gave the name of one of the parts that lead to it with one
character wrong or left out, both on the image 960 px wide: 34 answers right of 36, where the line set beforehand
asked for 35.

The rows marked "not yet tested by a work" keep the patterns they had: none of the works that were read states a
status, and a planned line's dashes are too near the boundary's to be told from them by the measure the trials
fixed. A build that draws such a row carries the warning `line_row_untested`, which names the plates.

Widths that are not a relation's line or the boundary are not in the table: a tier's ring, a card's outline, an
icon's strokes, and a matrix's cell rules and diagonal. They stand in `strokes` of `src/house.json`, in the figure's pixels.

The key of a plate holds the sample of a row exactly when its figure draws the row; a plain relation's line has
none. The sample of a planned or a retired row is a line at a relation's weight, as the figure draws one, in the
dash its row names for the key, Typst's `dashed` and `dotted`, not the dashes the figure draws. The page has no expression of emphasis or of the number of cited
files; nothing refuses on that column.
