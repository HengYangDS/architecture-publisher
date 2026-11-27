---
subject: architecture-publisher:research-matrix-choice
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# When a view is drawn as a matrix: a committee and a calibration

A research page. It records what a committee of three seats found when it read dense views drawn as tiers and as a
matrix, and how readers' picks on the published works' dense views set the measure and the threshold that choose
between them. It decides nothing itself: the rule enters the product through the `compositions` item's Change, whose
design repeats it as Rests on / Considered / Chosen because / Applies to.

## Question

On which views does a matrix of the parts, a relation in the cell of its source's row and its target's column, let a
reader answer the view's question faster and more surely than the tiers figure, and by what measure can the
publisher tell those views apart?

## Short answer

On a few: the dense views whose tiers figure tangles, where long relations wrap and cross on the way to one target.
The layout's own count of route defects tells them apart better than crossings, bends or the number of parts: a
view of at least 8 parts whose tiers figure at the full width has at least two route defects is drawn as a matrix,
where one fits. On the published works that is 11 of 51 dense views.

## The committee (2026-11-27)

Three seats, agents briefed as an information designer, an architect presenting the edition and a reader holding the
owner's stated standards, read four dense views of the published works, each drawn as tiers, as a matrix of labels
and as a matrix of counts, without being told which the publisher preferred.

- **Which plate is best.** Tiers for two views (3 of 3), the label matrix for one (3 of 3), and the fourth split, tiers
  narrowly (2) or the label matrix narrowly (1). Cells that hold a count lost everywhere (3): on one view 12 of 13
  cells read 1, the verb of the relation is lost, and the ink sits to the left.
- **What decides.** Not density (3): all four views were dense, and tiers was better for two or three of them. What
  decides is whether the tiers figure tangles: crossings, bends and labels set far from their lines.
- **The balance gates.** They flatter the matrix (3): they count grid rules and tints as ink, and on one view 58 of 81
  cells held nothing. A matrix must not be chosen by them; they should measure the ink of content.
- **Past capacity.** A squeezed matrix is worse than tiers (3). A view too large for any one plate is better split into
  narrower questions, which changes the edition's views (2 of 3 said so explicitly).
- **Before it ships.** Rows and columns in the relations' flow, so that marks fall on one side of the diagonal; compact
  row heads; a label repeated along a row or a column said once; Chinese broken only between words; the boundary as
  a bracket over the inside rows and columns (one seat); the filled cells toned and the diagonal reduced; the
  direction of the cells in the empty corner instead of a line of words; a reading that holds the same content
  whatever the composition.

The committee left the measure and the threshold to readers' picks on the published works' dense views. Its own
estimate, from four views, was 0.2 to 0.4 crossings a relation.

## The calibration (2026-11-27)

- **Views.** The six published works, each in English and in Chinese, were built once with every view in tiers and
  once with every view a matrix fits as a matrix; eleven of the twelve editions built (the English edition of one
  was refused by its front page's limit in both builds). Every view
  of at least 8 parts with no declared tiers that the second build drew as a matrix, 51 in all, was set as a pair of
  its two pages side by side, the sides in an order drawn from the view's name. Each language's layout changes the
  measures, so the two editions of a work count apart.
- **Readers.** Six readers, agents briefed alike, three to a pair: each judged which side lets a reader answer the
  page's question about how the parts relate faster and more surely, or either. 38 of 51 pairs were unanimous and 50
  had a majority: 18 for the matrix, 32 for tiers. Their reasons agree with the committee's: long lines that wrap and
  cross on the way to one target sent them to the matrix; a layered flow with short lines kept them in tiers.
- **Measures.** Each rule "a matrix when the full-width tiers figure has more than a threshold" was scored at its best
  threshold against the 50 picks, and again leaving one edition out at a time:

| Measure of the tiers figure               | Agrees on 50 | Leaving one edition out |
| ----------------------------------------- | ------------ | ----------------------- |
| at least 2 route defects                  | 43           | 41                      |
| at least 1 route defect                   | 42           | 41                      |
| crossings and bends over 1.455 a relation | 39           | 33                      |
| crossings over 0 a relation               | 34           | 28                      |

Route defects are the layout's own count of what a reader misreads: two wires taken for one, a wire that seems to
continue another or to leave a card it does not touch, arrowheads run together, a label set against another
relation's wire. Bends, which a tidy tiers figure has one or two of a relation, lowered agreement when added.

## Limits

- No person picked; the readers and the seats were agents reading pictures.
- The rule disagrees with the readers on seven pairs: four views with one route defect that the readers moved to the
  matrix, and three with none, whose loop-back lines wrap the figure.
- Six works, eleven editions; the threshold is set on them and has not been tried on others.
- The pairs were drawn by the matrix's prototype on dev `cdde0170`. The rule reads the layout's route defects, whose
  code is the same on the dev the shipping Change starts from, so the picks' agreement holds for it; the census below
  counts what the shipped code draws.

## The census of the shipped code

On 2026-11-27 the Change that ships the matrix built the twelve published editions with its own code under one
ticket of the host (10:25:48 to 10:27:35). Eleven built; the English edition of one work was refused by its front
page's limit, as on dev. Of their 76 plates, 56 show a view of at least 8 parts with no declared tiers; the rule drew
11 of those as matrices, the same 11 views it took in the calibration, with 2 to 11 route defects in tiers. No view
named a composition and no warning was reported. Every figure lies within its plate's width. The matrices miss the
empty-space measure, since flow order leaves the lower triangle empty by construction; the miss is recorded and
chooses nothing.
