---
subject: architecture-publisher:research-tiers-fill
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# Filling the tiers figure: two rounds of drawings and a committee

A research page. It records why most plates drawn in tiers miss the balance gate on blank space, which fills of the
tiers figure a prototype drew in two rounds and what each measured, what a committee of three seats found when it
read the first round, and the decision, taken by the owner's delegate on a committee of three, that the second round
measured. It decides nothing itself: the fill enters the product through the `compositions` item's Change, whose
design repeats the decision as Rests on / Considered / Chosen because / Applies to.

## Question

A plate whose tiers figure leaves a large blank misses the gate on the largest blank rectangle. Can the publisher fill
that blank from the model, without placing anything by hand and without a figure that answers its question less
clearly, and which fill does it draw where?

## Short answer

Partly. A lone card at the figure's first or last row, of a kind outside the code that parts use (an outside system,
a store, a cloud platform, a message bus), and to which at least half the cards of the row beside it relate, is drawn
as a band across the whole figure. Beside the chosen figure, the same figure with its rows spread across the width is
taken where it clears a gate and wires no worse. Neither is drawn where it would bring an outside part inside the
system's boundary. In the second round's light measure the two together took the plates that miss the blank gate
from 51 to 43 of 65; with that last rule, the shipped code takes them to 46, makes no plate miss it that passed, and
makes no figure's wiring worse.

## The problem and its measures

A plate is measured by four balance gates over its body (`src/poster/balance.mjs`): the largest blank rectangle
covers at most 0.12 of it, no blank band 96 px or taller runs across it, at most 0.4 of it lies in holes, and its
centre of gravity lies within 0.12 of the centre each way. The owner, 2026-10-28:

> 「你真的要注意布局上不能有大量空白，整个构图如果重心不对，留白过多，是不符合要求的」

Gloss, a translation and not the owner's words: "Take real care that a layout has no large blank areas; a composition
whose centre of gravity is off, or that leaves too much white, does not meet the requirement." On 2026-11-02 he called
one form forced on every repository overuse (「台阶套所有仓库是滥用」): a composition is chosen by a view's shape, and
every picture is drawn by the product.

The census of the matrix Change's code (2026-11-27, one ticket of the host) built eleven of the twelve published
editions; the English edition of one work was refused by its front page's limit, as on dev. Of their plates, 65 are
drawn in tiers, and 51 of those miss the blank-rectangle gate: 18 by less than 0.02, 5 at 0.20 or more.

- 42 of the 51 blank rectangles touch two edges of the body, a corner (lower left 13, upper right 13, lower right 8,
  upper left 4), and 4 more span its top.
- No single shape tells the missing plates from the passing ones. A first or last row of one card is as common on
  passing plates (9 of 14) as on missing ones (34 of 51); the cards cover a median 0.17 of the body on missing plates
  and 0.19 on passing ones, and their bounding box spans about 0.9 of the body each way on both.
- An earlier measurement found 25 plates that no setting of the grid (type step, wrapping, centring, tier labels)
  passes; ranking the gates higher helps a handful.

So the fills were drawn and measured, not tuned.

## Round 1: the candidates (2026-11-27)

A prototype drew each fill after placement had set the cards on their column lattice and before the wires were
routed, switched on by an environment variable so that the default drew as before; it composed each of the 65 plates
alone, in light runs with the strips at the census's lengths.

- **Justify**: each row of two or more cards spread across the figure's width, its first and last card at the edges,
  equal gaps between; a row that mixes outside and inside parts keeps its places.
- **Band**: a first or last row of one card drawn as a band across the cards it connects to, each wire entering it
  straight at its other end's column, a bus into it drawn as single wires; its text stays set in its own column's
  width at its left.
- **Band-wide**: the same band across every card of the figure.
- **Grow**, cards and type set larger until the widest row spans the body, was checked and dropped: the type step
  already does it. The widest row spans a median 0.85 of the field on missing plates and 0.89 on passing ones, and of
  the 51 missing plates 22 lay out at a larger step only with more crossings or route defects.

| Fill               | Blank misses | Cleared / new | Crossings | Route defects | Bends | Wiring worse / better |
| ------------------ | ------------ | ------------- | --------- | ------------- | ----- | --------------------- |
| none (dev)         | 51           |               | 58        | 22            | 796   |                       |
| justify            | 45           | 11 / 5        | 47        | 31            | 712   | 13 / 15               |
| band               | 47           | 7 / 3         | 58        | 21            | 670   | 0 / 1                 |
| band-wide          | 31           | 21 / 1        | 54        | 18            | 660   | 1 / 3                 |
| justify, band      | 53           | 6 / 8         | 47        | 29            | 556   | 12 / 16               |
| justify, band-wide | 39           | 16 / 4        | 48        | 29            | 552   | 13 / 15               |

Crossings, route defects and bends are totals over the 65 plates; a plate's wiring is worse when it has more
crossings or more route defects. Built under one ticket as whole editions (11:48 to 12:00), the fills also changed
which views the matrix's rule took, since the rule reads the tiers figure's route defects: justify sent 14 views to
the matrix, band 10 and band-wide 9, against 11. Over the tiers plates of those builds, justify left 38 blank misses
with 38 route defects, band 48 with 21, band-wide 31 with 19.

What each costs: justify bends wires that ran straight, since cards no longer share column edges from row to row, and
does nothing for a row of one card, where most corner blanks sit; band reaches only the cards its card connects to,
so the far corner stays blank; band-wide lies under cards it has no relation with.

## The committee (2026-11-27)

Three seats, agents each alone, read the first round's measures and pictures of six plates drawn six ways, and whole
pages as a reader sees them. All three agreed that:

1. A band is a true picture only of an outside store, platform or repository that many parts use; under cards it has
   no relation with, it misleads when its card is an actor, an entry or a peer part. Band-wide is no blanket switch.
2. Justify is not a default: it raises route defects, sends more views to the matrix and bends straight lines. On two
   plates it was the only drawing that passed. Two seats kept it as a candidate under a no-worse guard; one dropped it.
3. A fill is kept only where the figure's crossings and route defects are no worse than the plain figure's.
4. The matrix is chosen on the figure that would ship: the fill comes before the rule reads the route defects.
5. Short figures whose blank is a band across the top or the bottom are a problem of placement, the figure's height
   in its field, not of a fill.

They differed on the width of a band not eligible for the whole figure (two seats: across the columns it connects to;
one: a plain card) and on the test of eligibility (by kind; by kind or coverage of nearly every column; by kind and at
least half the neighbouring row related).

## The decision (2026-11-27, the owner's delegate, on a committee of three)

- A lone card of a first or last row whose kind's category is `external`, `database`, `cloud` or `messagebus` (the
  categories of things outside the code that parts use) and to which at least half the cards of its neighbouring row
  relate is drawn as a band across the whole figure. The kind's category is the model's own statement of what a part
  is, so the test reads the model, not the drawing; half the neighbouring row is the third seat's test, which asks
  that the band say something true of the row above or below it.
- Any other card was to be drawn in one of two ways, measured before either was built: (A) a plain card, or (B) a band
  across the columns it connects to.
- Justify is drawn beside the plate's chosen figure and taken only where it clears a missed gate, adds no crossing or
  route defect and keeps every row's order of cards; left out if it cleared fewer than five of the 65 plates.
- A filled figure is kept only where its crossings and route defects are no worse than the plain figure's.
- Out of the Change: the vertical placement of short figures; Spine and Radial.

## Round 2: the decision measured (2026-11-27)

The same light runs over the 65 plates, the matrix's rule reading the figure that would ship, the guards per
composition and again per plate:

| Variant              | Blank misses | Cleared / new | Crossings | Route defects | Bends | Wiring worse / better | Matrices of 76 |
| -------------------- | ------------ | ------------- | --------- | ------------- | ----- | --------------------- | -------------- |
| none (dev)           | 51           |               | 58        | 22            | 796   |                       | 11             |
| A                    | 47           | 4 / 0         | 58        | 22            | 778   | 0 / 0                 | 11             |
| B                    | 46           | 8 / 3         | 58        | 22            | 674   | 0 / 0                 | 11             |
| A and justify beside | 43           | 8 / 0         | 58        | 21            | 776   | 0 / 1                 | 11             |
| B and justify beside | 45           | 9 / 3         | 58        | 22            | 664   | 0 / 0                 | 11             |

- The whole-width band was kept on nine plates in both A and B, and the guards took back one band: an outside
  repository at the foot of one figure, which drawn as a band had two crossings against one plain.
- B's narrow bands were drawn on 35 plates. On the 33 of them with no whole-width band the blank grew on 19, shrank
  on 10 and stayed on 4, and three overviews that passed came to miss.
- Justify beside the chosen figure was taken on six plates in A and cleared a gate on each, four of them every gate.
- No view changed between tiers and the matrix.

**Chosen: A and justify beside.** It leaves the fewest plates missing and adds no miss; "clears more" was read as fewer
plates missing in all, not more cleared alone, so B is left out. Justify cleared a gate on six plates, above the five
the decision set, so it stays.

## What follows for the product, and where it applies

- Plates drawn in tiers only; the page's diagrams and the matrix are not filled. Which categories may span stands once,
  as `spans` in the table of categories (`src/categories.json`), from which the model reference's table is written;
  the share of the neighbouring row stands once, beside the rule (`src/layout/fill.mjs`). The rule's short statement
  is in the [operations reference](../reference/operations.md#layout-and-media); its detail is here.
- The band is drawn as a card, in the card's tokens; only its width differs. It spans from the left edge of the
  leftmost other card to the right edge of the rightmost, as those stand after any justified row is spread; its
  name, caption and details keep the width of a card of its column, at the band's left. A lone card that the rest of
  the figure is no wider than, as in a figure one column wide, stays a card and is not recorded as a band.
- Each relation between the band and its neighbouring row is a wire of its own, and a bus into the band is taken
  apart, so each enters the band straight at its other end's column. A relation from a row further away is routed as
  any long relation is: down a corridor between columns, a lane or a gap, and into the band where that route reaches
  it, with a jog just above the band where the corridor is not its other end's column.
- A justified figure is drawn beside a chosen figure in tiers that misses a balance gate, and it keeps that figure's
  type step, wrapping, centring, tier labels, details, box and rows, in the same order; each row of two or more cards
  is spread with its first and last card at the figure's insets and equal gaps between, and a row that mixes outside
  and inside parts keeps its places. The plate takes the first such figure, among those its caption forms give, that
  passes a gate the chosen figure misses, misses none that figure passes, and has no more crossings and no more route
  defects.
- Neither fill may bring an outside card inside the system's boundary. A band of one of the system's own kinds (a
  database, a cloud platform, a message bus), or a justified row of its own parts, widens the boundary to its extent;
  where a `person` card or an outside system of the boundary's rows stands within it, the figure is refused as
  `layout_boundary_unplaced`. The band's guard then draws the figure plain and records the band as taken back, and a
  plate drops the justified figure. A refusal, not a band clamped to the inside cards' extent, keeps one rule for
  both fills and keeps every band one width, the figure's.
- The guards: a figure keeps its bands only where it has no more crossings and no more route defects than the same
  figure drawn plain, and a plate keeps them only where its figure wires no worse than the plate drawn plain. A plate
  whose figures drew no band, at the full width and as it ships, is not planned again plain, since its guard has no
  band to take back. The matrix's rule reads the full-width figure as the guards leave it, its bands where kept.
- The plate records what it drew: the cards drawn as bands, the bands a guard took back, and whether the justified
  figure was taken; a figure without a band carries no `bands`.
- The shipped code is the prototype's variant A with justify beside, always on, with three differences: the corridors
  midway between cards that moved are tried only where rows were justified, where the prototype tried them in every
  filled figure; a lone card the rest of the figure is no wider than stays a card; and a fill that would bring an
  outside card inside the boundary is refused. So a plate with no card the rule takes and no justified figure is
  drawn as before: of the 16 plates of the six works the tests use, 12 are drawn byte for byte as on dev and 4 draw a
  band.
- The shipped code was measured as round 2 was, in light runs of the same 65 plates, the strips at the census's
  lengths: 46 plates miss the blank gate against 51 on dev, 5 clear it and none comes to miss it, with 58 crossings,
  22 route defects and 796 bends as on dev, no plate wiring worse and no view sent to the matrix. Seven plates draw a
  band, three take a band back and two take their justified figure; 53 plates are drawn byte for byte as on dev.
  Round 2's variant left 43 missing: the refusal took back the band of two plates and the justified figure of four,
  and on all six that fill had drawn people or outside systems inside the boundary, as the same runs show. Clamping
  the fills to the inside cards' extent was not taken, since the refusal keeps seven of round 2's nine bands.
- A plate that may take a band and whose figures drew none is planned once: 9 of the 65 plates, whose composing took
  12.0 s in place of 14.2 s; the 65 plates are drawn the same either way.
- The census of the shipped code (2026-11-27, one ticket of the host) built the published editions twice from the
  same works, once with dev's code and once with this: eleven of twelve each, the English edition of one work
  refused by its front page's limit as on dev. Of 65 plates in tiers, 50 miss the blank-rectangle gate against 54 on
  dev; 4 clear it and none comes to miss any gate. Five bands are drawn, four taken back and two justified figures
  taken; crossings (61) and route defects (21) are as on dev, and the same 11 views are matrices. 63 of the 76 plates
  are recorded as on dev. The light runs above read the works before their re-pin of the same day, so their counts
  differ from the census's; the census is the measure of record.

## What is not established

- No person read the pictures or the pages; the seats and the prototype are agents.
- The rounds' measures are light runs of single plates, the strips at the census's lengths; whole editions were built
  in round 1 and in the shipped code's census.
- 50 of the 65 plates still miss the blank gate with the shipped code. Most have no lone end row that the rule takes,
  or a short figure whose blank is a band across the top or the bottom: the vertical placement of short figures is
  the item's next measured cause, and Spine and Radial, the compositions that need lines that are not horizontal or
  vertical, come after it.
- Whether three of B's narrow bands were wider than their own column was estimated from the drawings, not measured; B
  is left out, so it bears on no choice.

## Record

2026-11-27. A prototyping agent drew and measured both rounds; three seats, agents each alone, read the first; the
owner's delegate decided and chose; an implementing agent wrote the shipped code, and an agent that had not seen it
reviewed it. The working material (the prototype's code and reports, the pictures, the seats' answers and the
decision) lies in `build/runtime/work/compositions/fill/` and `build/runtime/work/compositions/fill-committee/`, which
are ignored and local to one checkout.
