---
subject: architecture-publisher:research-room-size-plate-fit
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# Room-size fit of the six works' views

A research page, **with one work of six measured so far, in one language**. It records whether the layout engine,
as it is, places a view on one page when names and labels are set at room size. It decides nothing. A run over all
six works in both languages is in progress; the tables under "Findings" are written to be replaced by its result.

## Question

The committee's ruling R7 of 2026-11-15 says that on a presentation plate nothing a room must read stands under the
24 pt tier, and leaves unruled what becomes of a view that does not fit. That waits for a run of the works' 41 views
in both languages at the trial sizes, reporting wiring beside fit. The question of this page: at room sizes, which
views does the layout place on one page, and how are they wired?

## Short answer

- Measured: the six views of one work in Chinese. 35 of 41 Chinese views and all 41 English views are not measured.
- Names at 48 px, the rest at 36 px: five of six views fit; four of them are wired worse than the delivered plate.
- Names at 54 px, the rest at 40.5 px: one of six fits. The name alone at 48 px: all six fit, three wired worse.
- "Fits" means the layout found a placement; no plate was drawn, typeset or looked at.

## What was measured

Working material under `build/runtime/work/room-fit/`, ignored and local to one checkout: the note on what each
variant changes (read in full) and the result file its script generates (read in full, as it stood on 2026-11-15
21:00 CST). The scripts and the records under `out/` were not opened.

**Method.** Each variant is a copy of one unchanged source tree with a diff applied; none is a Git checkout, and
nothing under the layout unit is changed. A script imports a tree's own modules, prepares what a build prepares up
to the plan, walks the plan and asks the tree's admission for every view, also after one is refused. The admission
asks the full body, 2256 × 1071 px, and nothing narrower. For `base` the script then calls the tree's own
composition for each view, as the build does, and reads the plate's step, the share of the width and the reading
column. A room variant has one step only, so a view fits at that step or is refused; its reading column is off. For
each view that fits, the script reads the crossings and route defects of the best composition at the full body. A
hook reports why each candidate was rejected and changes no verdict.

**The variants.** Sizes are px, at 1.5 px to the point.

| Variant                 | Names    | Part's kind, tier labels | Relation labels | Tier numbers, file counts | Boundary name |
| ----------------------- | -------- | ------------------------ | --------------- | ------------------------- | ------------- |
| `base` (5 steps)        | 18 to 32 | 14 to 24                 | 14 to 24        | 14                        | 20 to 24      |
| `room-a` (1 step)       | 48       | 36                       | 36              | 36                        | 36            |
| `room-b` (1 step)       | 54       | 40.5                     | 40.5            | 40.5                      | 40.5          |
| `room-a-names` (1 step) | 48       | 24                       | 24              | 14                        | 24            |

`room-a-names` is the product's largest step (32 / 24 / 24, numbers 14, boundary 24) with the name alone at 48 px: its
relation labels, label boxes, arrowheads, gaps and channels are those of the product's largest step. The note calls it one
reading of "only names at room size"; a part's kind is 24 px in it, not 36. Wires, gaps and channels scale from a
wiring size of 48, 54 and 32 px in the three variants.

What the three room variants change beside the sizes:

- A part is its name and, one gap under it, its kind: no strip, no count of files and bytes, no leading detail. A
  box is still at least 200 px wide.
- Constants that were fixed because the type they hold was fixed grow with it: the label box's cap (336 px at a
  24 px label in the product; 504 px at 36 px and 560 px at 40.5 px, about 14 em as at every step of the product; left at 360 px, a
  36 px label would wrap at 10 em; the cap `min(360, round(250 × name/24))` becomes
  `min(round(360 × edge/24), round(250 × 4/3 × edge/24))`); the boundary's paddings and head (20, 20 and 14 px for a 24 px name become 30,
  30 and 21 px at 36 px); the tier label's numbered disc and the column's cap (280 px for a 24 px label). The disc's radius is the number's
  size (14 px in the product); a tier label starts 2 × radius + 14 after the column's edge (42 px in the product)
  and wraps to the column less 2 × radius + 36 (64 px); the boundary's name tab reaches the boundary's head over and
  under the edge (14 px) and pads its name by the name's size (24 px). No strip is drawn, so a refused plan is not
  asked again at a strip of 240 px.
- Not changed: nothing under the layout unit (its route constants: parallel 24, alongside 40, run 96, join 48, jump
  400, label 16; the 80 px least label width; the 10, 12 and 16 px clearances); the spacing values the product
  keeps fixed across steps (port spacing 40, port margin 30, axis clearance 40, least jog 56, band gap 8); a part's
  least and greatest width, 200 and 760 px. A name's measure is 16 em, 768 px at 48 px and 864 px at 54 px, so in
  `room-b` a name longer than about 14 em wraps one line earlier than its measure allows. 54 and 40.5 px are not on
  the product's scale; nothing the admission runs checks a size against the scale.

**The run.** `openai-responses-proxy`, Chinese, all four variants, 2026-11-15 20:58, one process at a time at low
priority while the machine's one-minute load was 68 to 77. Each variant was run twice or more with the same
verdicts. Seconds per process: `base` 42.8 (it composes each view), `room-a` 2.9, `room-b` 2.7, `room-a-names` 3.9.

## Findings

The two tables are to be replaced when the full run is read.

### By view (Chinese; one work of six)

"None" is no crossing and no route defect. Heights are the figure's own, of the body's 1071 px, before it is
justified into the body.

| View           | Parts | Relations | `base`                                            | `room-a`                                                              | `room-b`                                                                     | `room-a-names`                                  |
| -------------- | ----- | --------- | ------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- |
| `request-path` | 9     | 11        | Fits; step 2 (names 24, labels 18 px); none       | Refused: 42 candidates, 28 unroutable, 14 too tall (least over 42 px) | Refused: 42 candidates, 32 unroutable, 10 too tall (least over 1069 px)      | Fits; 0 crossings, 2 route defects; 998 px high |
| `portability`  | 7     | 11        | Fits; step 3 (names 28, labels 20 px); none       | Fits; 0 crossings, 3 route defects; 1016 px high                      | Refused: 12 candidates, 8 unroutable, 4 too tall (least over 81 px)          | Fits; none; 784 px high                         |
| `failures`     | 7     | 9         | Fits; step 3 (names 28, labels 20 px); 1 crossing | Fits; 3 crossings, 0 route defects; 1065 px high                      | Refused: 18 candidates, 14 unroutable, 4 too tall (least over 205 px)        | Fits; 3 crossings, 0 route defects; 766 px high |
| `install`      | 8     | 11        | Fits; step 2 (names 24, labels 18 px); none       | Fits; 2 crossings, 0 route defects; 1000 px high                      | Refused: 12 candidates, 6 unroutable, 4 too tall (least over 9 px), 2 untidy | Fits; none; 816 px high                         |
| `handoff`      | 7     | 9         | Fits; step 1 (names 20, labels 16 px); none       | Fits; 0 crossings, 1 route defect; 1024 px high                       | Refused: 12 candidates, 8 unroutable, 4 too tall (least over 177 px)         | Fits; 1 crossing, 2 route defects; 1048 px high |
| `supervision`  | 6     | 6         | Fits; step 3 (names 28, labels 20 px); none       | Fits; none; 977 px high                                               | Fits; none; 1012 px high                                                     | Fits; none; 726 px high                         |

The works `aigw-client`, `ddwg`, `filmkit`, `architecture-publisher` and `ethos` are not measured in Chinese, and
no work is measured in English.

### Counts

| Language | Variant        | Fit | Of these, no crossing and no route defect | Of these, wired worse than `base` | Refused | Not measured | Of  |
| -------- | -------------- | --- | ----------------------------------------- | --------------------------------- | ------- | ------------ | --- |
| Chinese  | `base`         | 6   | 5                                         |                                   | 0       | 35           | 41  |
| Chinese  | `room-a`       | 5   | 1                                         | 4                                 | 1       | 35           | 41  |
| Chinese  | `room-b`       | 1   | 1                                         | 0                                 | 5       | 35           | 41  |
| Chinese  | `room-a-names` | 6   | 3                                         | 3                                 | 0       | 35           | 41  |
| English  | all four       | 0   | 0                                         | 0                                 | 0       | 41           | 41  |

"Of" is the 41 views the six works plan in each language. "Wired worse than `base`" counts a view with more
crossings, or as many and more route defects, than the plate `base` delivers. The two are not the same figure:
`base` wires its parts with their strips and details, at the step and width it delivers. A view refused in a room
variant would, in the product, refuse its whole edition.

### Other readings

- `base` admits all six views; its step, share of the width and reading column equal the six plates of a built
  manifest of the same work, read side by side.
- The layout `room-a` accepts for `handoff` and `portability` sets names at 48 px bold and kinds and relation labels
  at 36 px; a part is 128 px high (a 64 px name line, a 16 px gap, a 48 px line of its kind), a one-line label box
  64 px high. No file is drawn.
- Near the body's height a view fits with nothing to spare: `failures` in `room-a` takes 1065 of 1071 px.

## What was compared

| Variant        | For                                                                             | Against                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `room-a`       | Names and every label at the ruling's trial sizes; five of six views are placed | One view refused, which in the product refuses the edition; four of five wired worse; heights of 977 to 1065 of 1071 px |
| `room-b`       | The largest type                                                                | One of six placed; 54 and 40.5 px are not on the product's scale                                                        |
| `room-a-names` | All six placed; heights of 726 to 1048 px                                       | Only the name is at room size: kinds and relation labels stay at 24 px and numbers at 14 px; three of six wired worse   |

The ruling reports the first row as "five of six views fit at 32 and 24 pt, tightly, four wired worse".

## What follows, and where it applies

Nothing follows yet. Ruling R7 orders the question of a view that does not fit first and makes it wait for the run
of all 41 views in both languages and for one hand-set layered plate; see the
[committee's record](edition-forms-committee-2026-11-15.md). It applies to presentation plates only: the booklet's
plates use the layout the engine makes as it is. A plate set by hand as two layers on a fixed base is described on the
page [what the second proof showed](second-proof.md).

## Not established

- Five works in Chinese and all six in English. Tier labels and their column were not exercised: no view of the
  measured work has tiers, and of the six works only `architecture-publisher` has, in two views. The boundary was
  exercised (`failures`, `supervision`). A relation's details on more than one line and a count's placement were not
  looked at.
- Whether a plate at room size reads well from a room. No plate was composed, typeset or looked at for the room
  variants.
- The gates a build applies after the plan were not asked of the room variants: the balance gates and the counts of
  cited files that touch another mark. A view that fits here may still miss them.
- A fit is not a good plate: with one step the admission accepts any composition the layout can place. A refusal
  says the layout found no placement within its limits, not that none exists by hand.
- Labels were not shortened or bundled; saying equal labels into one target once, and layering a view on a fixed
  base, are not measured. No view was split and no part or relation dropped.
- A summary set above the figure, which takes height from it, and the key were not asked.
- Whether wires 24 to 40 px apart read as two from a room.
- Why `handoff` wires worse in `room-a-names` (1 crossing, 2 route defects) than in `room-a` (none, 1), with smaller
  labels. The layout is a search over discrete placements, so this can happen; it was not looked into.
- Each record is one run; the note says each room variant was run twice or more with the same verdicts.

## Record

Measured 2026-11-15 by the queue's holder, for the committee's ruling R7. Working material:
`build/runtime/work/room-fit/` (`NOTES.md`, `RESULT.md`, the scripts, the diffs of the variants and the records
under `out/`), ignored and local to one checkout. Written up for this directory on 2026-11-16 by the author of the
documents lane, while the full run was in progress.
