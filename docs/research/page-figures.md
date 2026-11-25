---
subject: architecture-publisher:research-page-figures
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# The page's diagrams laid out by the publisher: what Archify does and what the chooser adds

A research page for the queue item `page-figures`. It records what the published works' guide diagrams hold, what
Archify 3.3.0 lays out by itself, and how the publisher's chooser compares with the authors' placing. It decides
nothing; the decisions are in the designs of the item's Changes.

## The works' diagram files

The twelve guides of the six published works name 78 diagram files (read on 2026-11-25 from the publications'
`dev`). Most also state a repository block, which the item moves to the model: every file of six kinds, 8 of the 10
trees and no waterfall.

| Kind         | Files | Fields that place or size                                       | Repository block |
| ------------ | ----- | --------------------------------------------------------------- | ---------------- |
| architecture | 22    | `pos`, `size`                                                   | yes              |
| timeline     | 12    | `lane` names a track, not a place; one file sets `layout.width` | yes              |
| lifecycle    | 12    | none                                                            | yes              |
| workflow     | 10    | `col`; `lane` names a swimlane                                  | yes              |
| tree         | 10    | none                                                            | 8 of 10          |
| erd          | 6     | `row`, `col`, `width`                                           | yes              |
| class        | 4     | `row`, `col`                                                    | yes              |
| waterfall    | 2     | none                                                            | no               |

## What Archify lays out by itself

- architecture: a document's `layout.mode` is `grid` or `auto`; under `auto` Archify places every part, and a part
  may hold neither `pos` nor `size`.
- erd and class: `layout.mode` is `grid` only. Without `row` and `col`, a class diagram is refused ("needs grid
  row/col or an absolute pos") and an ERD fails inside Archify (`internal/unclassified`).
- workflow: every node requires `col`, from 0 to 5.
- timeline, lifecycle, tree and waterfall: nothing places them.

## Archify's automatic layout against the authors' placing

Each of the 22 architecture files was validated at showcase, without its sources and repository block, as its author
placed it and with its places removed under `layout: {mode: "auto"}`. Both pass in every file. The publisher's own
route measures (`src/map/routes.mjs`, as the chooser reads them) were taken on each layout, and the chooser's ranking
(`src/map/choice.mjs`) was then given each placeless file: Archify's layout with its sides and with Archify's, the
repair of the sides of routes that misread, and the pins of labels.

| Sum over 22 files          | Routes read as one, or along an edge | Labels read as another's | Doubled routes | Labels set close to another thing | Route ends crowded on a card's side |
| -------------------------- | ------------------------------------ | ------------------------ | -------------- | --------------------------------- | ----------------------------------- |
| As each author placed it   | 22                                   | 51                       | 4              | 31                                | 43                                  |
| Archify's automatic layout | 17                                   | 19                       | 20             | 35                                | 32                                  |
| Chosen by the publisher    | 3                                    | 4                        | 13             | 21                                | 18                                  |

By the chooser's order the chosen diagram ranks before the author's placing in 21 files and after it in one (ETHOS's
English parts: one route that runs along an edge, against four misread labels), and before Archify's own layout in 16
and level in 6. The chooser measured 1,098 candidates in 176 s for the 22, four Archify processes at a time.

## The entity-relationship and class files laid out by the publisher's grid

The ten published entity-relationship and class files were laid out by a walk of their relationships at two to four
columns, each domain (an entity's `tag`) filling one run of one row or full rows, each grid validated by Archify at
showcase. As their authors placed them, all ten measure clean on Archify's route measures. With their cells, layout,
sources and repository removed, every one lays out on the publisher's grid; a grid that ignores domains is refused
in the manifest diagram of Architecture Publisher, both languages (`erd/domain-not-drawn`), and the grid that keeps
them is not. The ten took 11 s at about one core.

## The workflows laid out by the publisher's columns

Each node's column was taken as the longest path to it along the edges, an edge within one lane one step and an edge
across lanes none, as the works' authors draw a hand-off; two nodes of one lane in one column move the later right.
With their columns removed, all ten published workflows lay out within the six columns Archify draws and pass at
showcase with every route measure zero. A first form that stepped across lanes too needed seven columns for the
publisher's edition workflow and drew an arrowhead collision in AIGW Client's English rollout.

## What the published files state that the publisher sets

All 78 published diagram files were read on 2026-11-25. 74 state a repository block, every one a GitHub address
with its revision and `provider: github`, which Archify reads from the address itself. The 22 architecture files give
each of their 166 components a position and a size; the 6 entity-relationship files give 34 entities a cell, 8 a
width and their layouts a gap; the 4 class files give 20 types a cell; the 10 workflows give 70 nodes a column; one
timeline gives its axis a width. None routes a line, and no workflow states a phase or a group. 8 trees name a
direction, which stays the author's. So 74 files are refused as they stand, and the 4 others (2 waterfalls and 2
trees) build unchanged; each refused file builds once those fields are removed, the publisher laying it out
(the sections above).

## The dataflows and sequences laid out by the publisher

No published work holds a dataflow or a sequence as a file, so Archify 3.3.0's own examples stood in: three
dataflows and four sequences, each validated at showcase without its sources. A dataflow's row is one of Archify's
five; spreading each stage over a band of three to five rows passed one example of three, rows that follow the flows
none, and each stage in one of the row patterns the examples' authors use, its nodes in the layered order of their
neighbours, passed all three with every route measure zero. In the order the publisher measures them (the
candidates nearest every stage's preferred pattern first, at most 64), they passed at the 3rd, 9th and 14th. The four sequences,
their segments and activations removed, pass with every measure zero at the heights Archify's own draft shorthand
sets, 48 apart from 160.

## Limits

- One run each, on one host; Archify 3.3.0 as the publisher bundles it.
- The measures are the publisher's and Archify's; no reader looked at the 44 drawings.
- The other kinds were tried on one file each.
