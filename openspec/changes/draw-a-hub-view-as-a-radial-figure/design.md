## Context

See [proposal.md](proposal.md). The research page `docs/research/radial.md` records the prototype's two rounds, the
committee's three seats, the reader and the holder's decision, with their measures. A plate's composition is chosen in
`src/poster/compose/plates.mjs`: a view that names one is drawn so where it fits; otherwise the matrix's rule reads
the tiers figure's route defects, and every other view is drawn in tiers. The prototype's first round chose radial by
a measure of each drawn plate and found that a measure alone would draw nearly every view radial; its second round
chose by the view's shape with a measured guard, and the guard chose per language and let a plate trade one gate for
another.

## Goals / Non-Goals

**Goals:** a view whose shape is a hub's is chosen for a radial figure once, from its model alone, and drawn so in
every language of its work where the figure can be drawn; a plate that gives the figure up in one language records
why; every plate the rule does not take is drawn as before.

**Non-Goals:** the spine, which waits for a second round (a line folded to fill its frame, at most one arch, a test
that the view is a sequence); the matrix's choice per language, which reads the tiers figure's route defects and is
its own Change; the pockets between a radial figure's spokes, which the holes gate measures and the next round is to
reduce.

## Decisions

1. **The shape chooses, from the model alone.** Rests on: the committee's agreement that a radial figure is true where
   one part is the hub of a star and misleads where its centre is only the most connected part, and the reader's
   finding that a centre others write to (Architecture Publisher's `page`, three relations out and two in) reads
   better in tiers. Considered: the prototype's first rule (the centre related to 60 percent of the others), which
   admitted three centres every seat refused; and the measured guard of round 2. Chosen because: a view's composition
   is then a fact of the view, the same in every language. The four tests (at least three parts round the centre, 75
   percent, no second part over half, twice as many relations out as in) are stated once, beside the rule; the first
   was added in the code, since a centre with two parts round it is drawn as one line across the plate with its
   corners blank, and three fixture plates of that shape stay in tiers. Applies to: views that declare no tiers and
   name no composition, before the matrix's rule: the radial rule reads the view alone, the matrix's reads the tiers
   figure, which differs between languages, so a hub view is drawn alike in every language even where its tiers figure
   tangles.
2. **No measure chooses between tiers and radial; a plate gives up radial only where it cannot be drawn.** Rests on:
   round 2, where proxy `failures` in English passed every gate in tiers and missed holes radial, and three views came
   out radial in one language and tiers in the other. Considered: keeping the guard, which would make a difference
   between languages silent. Chosen because: a radial figure that cannot place a card or a label, whose boundary
   cannot hold only its own parts, or whose type would be smaller than its tiers figure's is the only refusal the
   reader of the plate needs, and the plate's record names it, as it names a fill taken back. A plate that gives up
   the radial figure the rule took is drawn as the rules after it would draw it, a matrix where the matrix's rule
   takes the view and a matrix fits, tiers otherwise. Applies to: the chosen and the named radial; a named radial
   refused is drawn in tiers with the warning `plate_composition_unfitted`, as a named matrix is.
3. **Labels keep one clearance from other lines, read by the drawing and the measure.** Rests on: round 2, whose
   radial figure kept its labels 4 px from other lines while the route measure asks 16 px, so that the English `page`
   plate drawn radial had a route defect. Considered: a clearance per composition. Chosen because: one value stated
   once keeps the drawing and its measure in agreement. Applies to: every composition (`src/layout/measure.mjs`).
4. **Lines that are not horizontal or vertical are drawn and measured as lines.** Rests on: the tiers figure draws
   only orthogonal runs, and the route measure counted only those. Chosen because: a spoke or a chord is a straight
   segment like any run. The measure counts its crossings at any slope and a label's distance to the line itself, not
   to its bounding box, and keeps the orthogonal branch as it was: in round 2 every tiers plate's route defects stayed
   as on dev. Applies to: the drawing of lines (`src/poster/lines.mjs`) and the route measure.
5. **A radial figure's orders are ranked as a free figure's.** Rests on: the ring's parts can stand in many orders,
   and each order is drawn and measured. Chosen because: the free figure's rank (`free.mjs`) weighs the gates a figure
   misses and its details before its crossings, route defects and type step, where the ranking of tiers candidates
   weighs wrapping and rows a radial figure does not have. Applies to: the radial figure alone; the order of tiers
   candidates is as before.

## Risks / Trade-offs

- A radial figure leaves pockets between its spokes: by round 2's measures, of the six plates the rule takes, three
  miss the holes gate (`projection` in English and Chinese, `failures` in English), one of them newly; their
  blank-rectangle misses fall from 5 to 0, and all their misses from 11 to 3.
- A view whose radial figure cannot be drawn in one language keeps tiers there; the plate's record says so, and the
  census shows whether any plate is refused.
- The matrix rule still chooses per language; recorded as its own Change.
