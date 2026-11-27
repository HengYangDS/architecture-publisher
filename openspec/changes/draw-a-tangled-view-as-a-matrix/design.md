## Context

The queue item `compositions` asks for more than one composition of a view, chosen by the view's shape or named by
its author. The owner kept four compositions to be chosen by a view's shape (2026-11-11) and took the order Tiers,
Matrix, then Spine and Radial on evidence (2026-11-17); the research page on prototypes records both. On 2026-11-27 a
committee read four dense views drawn three ways and a calibration set the rule on readers' picks over the published
works' 51 dense views (`docs/research/matrix-choice.md`). Every view is drawn as tiers on dev today; a view tiers
cannot lay out is refused (`plate_unfittable`).

## Goals / Non-Goals

**Goals:** a matrix of label cells for the dense views whose tiers figure tangles, chosen by one measured rule; a
view's author able to name its composition; tiers plates unchanged byte for byte.

**Non-Goals:** a matrix for a view tiers cannot lay out (it stays refused, and whether a matrix should take it over
is left open); splitting a view too large for a plate into narrower questions, which changes the edition's views and
is put to the owner when the item ends; balance measured on content ink for tiers, which the item's next Change, the
fill of the tiers figure, takes up; Spine and Radial.

## Decisions

1. **Label cells only.** Rests on: the committee (3 of 3): a count answers none of the views' questions and loses the
   relation's verb. Considered: cells of counts, which round 1 drew. Chosen because: a label carries what the line's
   label carries in tiers. Applies to: every matrix.
2. **Chosen by route defects.** Rests on: the calibration: "at least two route defects in the full-width tiers figure"
   agrees with the readers on 43 of 50 picks (41 leaving one edition out). Considered: at least one route defect (42,
   41), crossings and bends a relation (39, 33), crossings a relation (34, 28), the committee's estimate of 0.2 to 0.4
   crossings a relation, density alone, and the balance gates. Chosen because: it agrees best and is the layout's own
   measure of a misreading; bends lowered agreement; the gates flatter a matrix's rules and tints. The two numbers stand
   once, beside the rule, with the calibration named: they choose a composition and draw nothing, as the balance
   gates' limits stand beside the gates. 2 route defects was calibrated; 8 parts is the plan the owner approved on
   2026-11-11 and was not. Applies to: views of at least 8 parts that declare no
   tiers and name no composition.
3. **Drawn in the tiers plate's box.** Rests on: the committee's ask that the reading hold the same content whatever
   the composition. Considered: a box sized for the matrix with its own reading width. Chosen because: tiers decides
   the plate's width, reading and summary as on dev, so no estimate of the reading's height restates the class's
   measures and a matrix cannot cause a reading's refusal. Trade-off: a matrix never gets a wider box than tiers.
   Applies to: every matrix, named or chosen.
4. **Named by the author.** Rests on: the queue item's "named by its author", and the prototypes' finding that an
   intent cannot be read from a view's shape. Considered: an environment setting, which the prototype used and this
   Change removes. Chosen because: the model is the one input; the field is stated once in the model's schema, which
   the checks read. A named matrix that does not fit falls back to tiers with the warning `plate_composition_unfitted`,
   since refusing a whole build for a plate tiers can draw would cost the author more than the warning; a matrix the
   rule takes and that does not fit is no case for a warning, since the rule asks that it fit. A view that declares
   tiers may name `matrix`: its author's word wins, and the matrix orders its parts by flow, not by the tiers.
   Applies to: any view.
5. **Flow order, one label said once, the corner.** Rests on: the committee's list before shipping. Chosen because:
   marks fall on one side of the diagonal when sources come first; a cycle kept together keeps its cells near; a label
   repeated along a row or a column is noise; "from ↓ to →" in the corner replaces a line of words. Applies to: every
   matrix.
6. **Balance on content ink, for the matrix.** Rests on: the committee: the gates count rules and tints, and 58 of 81
   cells of one view held nothing. Considered: leaving the tints out too, as the committee's words read. Chosen
   because: a filled cell is the matrix's mark, as a card is tiers'; its tint is what a reader sees of it, so it counts
   at its tint, and only the grid's frame (rules, diagonal, brackets) is left out. "Balance measurement regions"
   states the exception. Applies to: matrix plates; tiers is measured as on dev until the fill.
7. **Every width from the house.** Rests on: the value-table capability: no stroke width holds a number of its own.
   Chosen because: the rules and the diagonal are two marks, so they gain two tokens, `strokes.cellRule` and
   `strokes.diagonal`, at the 0.6 px hairline they were drawn at; the brackets and a planned or retired cell's edge
   already read the boundary's and a relation's rows of the table of lines. A key's sample is drawn as the figure
   draws its mark: a matrix's key edges its cell sample with the cell rule, draws the boundary as a bracket and a
   planned or retired status as a cell edged in its dash, where a tiers key draws a frame and lines. Applies to:
   every matrix and its key.
8. **The record names what chose the matrix.** Rests on: the review: a matrix plate records no route defects of its
   own, so a delivery could not show why the rule took it. Chosen because: the route defects of the full-width tiers
   figure are the rule's input; recorded on the plate's composition, a later calibration reads them from a delivery.
   Applies to: matrix plates.

## Risks / Trade-offs

- The readers were agents; no person picked. The rule disagrees with them on seven of 50 picks.
- The calibration's pages were drawn by the matrix's prototype on dev `cdde0170`. The rule reads the layout's route
  defects, and the layout's code is the same on the dev this Change starts from (`f328b4ee`), so the picks' agreement
  holds for it; the census of task 3.1 built the published editions with this code and drew the same 11 views
  as matrices.
- Chinese in a cell or a head breaks at a space or a punctuation mark where it can, and otherwise between any two
  characters, with no character or count left alone on a line. "Whole-word card text" reads its break rules from the
  characters alone, the same on every host, which rules out a dictionary of words; a break inside a word of Chinese is
  still possible, as on a card.
- The Spanish and Korean corner words, "de ↓ a →" and "↓에서 →로", were written without a native reader.
- The matrix plates miss the empty-space measure by construction, since flow order leaves the lower triangle empty;
  the miss is recorded and chooses nothing.
- Breaking: the bytes of dense views' plates change, and a model that names `composition` is refused by an earlier
  release.
