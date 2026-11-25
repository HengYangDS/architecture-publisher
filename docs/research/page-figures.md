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

## Limits

- One run each, on one host; Archify 3.3.0 as the publisher bundles it.
- The measures are the publisher's and Archify's; no reader looked at the 44 drawings.
- The other kinds were tried on one file each.
