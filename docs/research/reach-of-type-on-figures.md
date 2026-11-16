---
subject: architecture-publisher:research-reach-of-type-on-figures
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# Reach of type on figures

A research page. It records to what distance the text of a figure can be read, how a size follows from a viewing
condition and a least visual angle, what the letters of the product's faces measure, how far the type of the
product's present plates reaches, and what two views looked like when built under two conditions. It decides nothing:
the design that rests on it, decision D7, is to be shown and is not yet ruled. Every angle on this page is
second-hand.

## Question

On 2026-11-16, after the queue's holder had written that the type on the product's plates is "below the 24 pt that
projection requires", the owner asked:

> 「投影屏要求 24 磅那一点再斟酌下」「是不是在错误假设前提下得到的结论」
>
> 「20 磅，或者和桌面阅读场景是什么关系。场景上，考虑本地电脑阅读和投屏，这样区分么？」
>
> 「如何设计和构建得更本质、通用和泛化呢」

Glosses, made for this page and not the owner's words: "Weigh again the point that a projection screen requires
24 pt." "Was that not a conclusion drawn from wrong premises?" "20 pt; or what is its relation to the setting of
reading at a desk. As settings, consider reading on one's own computer and projecting: is that the distinction?"
"How can this be designed and built so that it is more essential, more general and generalised?"

So: to what distance can a figure's text be read, and what size does a viewing condition ask for?

## Short answer

- A size is an angle times a distance: 24 pt is 20′ at 4 H, 20 pt is 20′ at 3.3 H, and 11 to 15 pt is 20′ at a desk.
- In the product's fonts a Han character is 0.919 of the em and a Latin capital 0.656: Latin needs 1.40 times the size.
- Of the product's 82 present plates, names reach a desk (2.6 H) on 32 and a room (4.0 H) on 9; labels a desk on 10.
- Two views built with every text exactly at its floor: details read more easily, names and labels are set smaller.
- The angles (16′, 12′, 20′) are second-hand; nobody has looked from a distance; English was not built.

## What was measured

Working material of 2026-11-16, all ignored and local to one checkout: the prototype under
`build/runtime/work/reach/` (its notes, its three input files and its two output records `out/sizes.json` and
`out/reach-today.json`, read in full; its script, its record of the faces, the plates and the proof PDF, not opened);
the sections of 2026-11-16 in the owner's rulings and in the ruling under `build/runtime/work/committee-20261115/`;
decision D7 in `build/runtime/work/style-research/round-5/DECISIONS.md`; and the third proof's notes and measure
under `build/runtime/work/sample-book/proof-3/`.

**The letter of each face.** The typesetter the product pins, Typst 0.15.1, was asked for the height of the drawn
outline of a glyph set at 1000 pt, on the font files of the product's own supplies, with system fonts ignored.

| Face                     | Letter                                                                                                          | Share of the em | Spread                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| Noto Sans CJK SC Regular | A Han character: the median over the 463 distinct Han characters the six works set in names and relation labels | 0.919           | Tenth 0.870, ninetieth 0.925, most 0.935; bold median 0.939; 国 0.875, 口 0.790 |
| Source Sans 3 Regular    | The capital H                                                                                                   | 0.656           | Semibold 0.654; the font's cap-height metric 0.660, x-height 0.486              |

A glyph that stands wholly above the baseline (一) is measured from the baseline (0.431); this over-reads the least
value, not the median.

**Viewing distances, as arithmetic.** A viewing condition is the distance of the farthest viewer in image heights.
The ruling gives, as measured for real screens, 1.8 to 2.6 image heights at one's own computer and 2.5 to 5.4 before
a shared screen; decision D7 speaks of eight real viewing situations, from 1.8 to 5.4 image heights. The eight are not listed in the records
read for this page. The prototype declares two conditions, each two numbers, with the geometry each comes from:

| Condition | Lead read from | Detail read from | Geometry                                                                                                                                      | By the geometry |
| --------- | -------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `desk`    | 2.6 H          | 2.6 H            | A 16-inch screen of 16:10 at 50 cm, the page fitted to its width; lead and detail are read from the same seat                                 | 2.58 H          |
| `room`    | 4.0 H          | 2.6 H            | A 120-inch projection of 16:9 from 6 m for the lead; the detail is read from near, by enlarging, or in one's own copy, at the desk's distance | 4.02 H          |

**Reading roles and least angles.** The prototype's table gives each script's face a least angle for each role, the
same for the Han and the Latin face: lead (a part's name and the plate's title) 16′; detail (relation labels, a
part's kind and details; the prototype also holds a tier's label and the boundary's name to it) 16′; apparatus
(counts, tier numbers) 12′, read from the detail's distance. Each is a starting value of the prototype's brief, and
the table marks every one as second-hand, to be calibrated by eye and not by an agent.

**Derived sizes.** Size = 2 · tan(angle / 2) · distance · 900 pt ÷ the letter's share of the em, set on the next
whole px up and never down; the page is 900 pt high at 1.5 px to the point.

| Condition | Role                 | From  | Han: pt; set px (pt) | Latin: pt; set px (pt) |
| --------- | -------------------- | ----- | -------------------- | ---------------------- |
| `desk`    | Lead, 16′            | 2.6 H | 11.85; 18 (12.0)     | 16.60; 25 (16.7)       |
| `desk`    | Detail, 16′          | 2.6 H | 11.85; 18 (12.0)     | 16.60; 25 (16.7)       |
| `desk`    | Apparatus, 12′       | 2.6 H | 8.89; 14 (9.3)       | 12.45; 19 (12.7)       |
| `room`    | Lead, 16′            | 4.0 H | 18.23; 28 (18.7)     | 25.54; 39 (26.0)       |
| `room`    | Detail and apparatus | 2.6 H | As `desk`            | As `desk`              |

**The reach of the product's present plates.** For the 82 plates of the six works' present editions, 41 in Chinese
and 41 in English, the size of each text was taken from the edition's manifest (the step) and the room-fit record
of the same source (the sizes of each step); the two agree on all 82 steps. The reach of a text is the distance to
which its letter still subtends the role's angle; a text reads as far as its smaller script.

**Two views built under two conditions.** The views `readers` and `overview` of the work `ddwg`, in Chinese, were
each built under `desk` and under `room`, in copies of the source that built the present editions, one view to an
edition. The derived sizes are read from a file; no size is typed. A step is a level of detail, and each style is set
at the largest floor of the scripts in the texts it sets at that level. Two levels are declared, one for all parts
of a view: full (name, kind, strip, counts, details) and plain (name, kind); a view is drawn at the first level at
which the layout places it. Sizes in px:

| Condition | Level | Name | Kind, details | Relation label | Boundary name | Numbers | Why                                                                                                   |
| --------- | ----- | ---- | ------------- | -------------- | ------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `desk`    | full  | 25   | 25            | 18             | 25            | 19      | Details hold Latin (ETHOS, DR-0001, L0) and counts hold digits; the name is raised to its own details |
| `desk`    | plain | 18   | 18            | 18             | 25            | 19      | Names, kinds and labels are Han only                                                                  |
| `room`    | full  | 28   | 25            | 18             | 25            | 19      | The name's own floor is above its details                                                             |
| `room`    | plain | 28   | 18            | 18             | 25            | 19      |                                                                                                       |

Two rules are the prototype's own: a part's name is never set under its own kind and details, and the fullest level
the layout places is taken before the wiring is compared. All four builds ended without a warning; no view was
refused, and no gate was switched off. The six plates (the present one, `desk` and `room` of each view) were looked
at once each at 1400 px by the prototype's author, and once more on a contact sheet.

## Findings

### What the 24 pt was

By the ruling's arithmetic, 24 pt is 20′ at 4 H; 20 pt is 20′ at 3.3 H or 16.7′ at 4 H; 11 to 15 pt is 20′ at a
desk. The chair's review names three premises behind "projection requires 24 pt", none of them the owner's: that the
farthest viewer sits at four image heights, where the standard read gives a formula between element height and
distance and names no distance; that every text on a figure, relation labels included, must be read by a room at the
angle of comfortable continuous reading; and that the page is looked at whole and still. What stands is the
relation: a character's size is its visual angle times the distance. The standard and the angles are on the page
[letter height by viewing distance](viewing-distance-and-letter-height.md).

### The letters

- Latin needs 1.40 times the size of Han for the same letter height. The prototype's notes call this its main
  number; decision D7 had it as not established.
- The calibration decides the count. The ruling's first count assumed 0.875 of the em for a Han character and found,
  of the 41 Chinese plates by the Han face alone, names legible at 2.6 H on 28, labels at 2.6 H on 13 and names at
  4 H on 1. At the measured 0.919 the same count is 41, 20 and 13: type of 18 px and of 28 px stands within 5 % of
  the two thresholds.

### The product's present plates

| Condition (lead, detail) | Names reach it             | Relation labels reach it | Names and labels both | With a part's kind, details and counts | Of  |
| ------------------------ | -------------------------- | ------------------------ | --------------------- | -------------------------------------- | --- |
| `desk` (2.6 H, 2.6 H)    | 32 (Chinese 23, English 9) | 10 (Chinese 10)          | 10                    | 0                                      | 82  |
| `room` (4.0 H, 2.6 H)    | 9 (Chinese 9)              | 10 (Chinese 10)          | 6                     | 0                                      | 82  |

Names read to 1.9 to 4.1 H and relation labels to 1.5 to 2.9 H. The ruling's earlier figures, with 0.875 for Han
and Chinese alone, were 2.5 to 4.5 H for names and 1.9 to 3.3 H for labels. The third proof measured the type inside
the present plates of one work as they stand on a figure page, each at 0.952 to 1.073 of its source: part names 12.0
to 17.7 pt, details and relation labels 9.0 to 10.0 pt.

### The two views at their floors

| Plate               | Level | Crossings, route defects | Reading column               | Balance miss              |
| ------------------- | ----- | ------------------------ | ---------------------------- | ------------------------- |
| `readers`, present  | full  | 3, 0                     | Beside, a fifth of the width | None                      |
| `readers`, `desk`   | full  | 3, 0                     | Summary above                | Empty share 0.125 of 0.12 |
| `readers`, `room`   | full  | 3, 0                     | Summary above                | Empty share 0.127 of 0.12 |
| `overview`, present | full  | 0, 11                    | Summary above                | Blank band 120 of 96 px   |
| `overview`, `desk`  | full  | 7, 18                    | Omitted                      | None                      |
| `overview`, `room`  | plain | 1, 20                    | Summary above                | Blank band 152 of 96 px   |

The balance gates record misses and refuse nothing, as in the product.

- `readers`: the full level is placed under both conditions and wires as the plain one would (3, 0).
- `overview` under `desk`: the full level is placed, in three rows, with 7 crossings and 18 route defects. The plain
  level would have had no crossing (0, 20). The rule took the fuller level and the worse figure.
- `overview` under `room`: the full level is placed at no wrapping (12 candidates not wirable, 4 with a part's
  kind-and-count line 17 px wider than its box), so the view is drawn plain.

What the prototype's author saw in the plates:

- `readers` under both conditions. Better: a part's kind, counts and details are plainly easier to read (16.7 pt for
  13.3), and the figure has the whole width. Worse: relation labels are smaller than in the present plate (12.0 pt
  for 13.3) and are now the smallest words in the figure; under `desk` the names are smaller than in the present
  plate (16.7 pt for 18.7) and no larger than their own details, so weight alone leads; the list of file locations
  is gone with the reading column. Under `room` the names lead again, at 18.7 pt, the present size.
- `overview` under `desk`. Better: every word reads at a glance where the present plate is small type in the upper
  half of a page. Worse: the hub is lost; wires cross seven times and run round the figure; the summary is omitted.
- `overview` under `room`. Better: names lead, the hub and its spokes are clear, one crossing. Worse: strips, counts
  and details are gone; one name breaks with a single character on its second line; the lower left is empty.
- The cause common to the worse points, in the author's words: the prototype sets each text at its floor exactly.
  The present `readers` is set above the Han floors because it has room; only its Latin fragments fall short. "A
  floor should bound a size, not be it."

## What was compared

Decision D7 considers three ways to arrive at a size.

| Way                                                                                                                                                      | For                                                                                                                                | Against                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| One fixed room size: 24 pt, as ruled on 2026-11-15, or 20 pt                                                                                             | It is one value of the third way                                                                                                   | It says nothing of another scene. A typed size hides its premise, a distance and an angle; the premise of 24 pt was the chair's and unexamined |
| Two fixed scenes, desk and projection, each with its typed scale                                                                                         | They are two values of the third way                                                                                               | They say nothing of a third scene; the product is general and cannot know the room                                                             |
| Derived: the viewing condition as a number, the legibility floor as a table by script and reading role, detail reduced in a declared order, reach stated | A stated reach is true of every display: it says to what distance a figure can be read and leaves the distance to whoever shows it | The angles are second-hand; set exactly at the floor, the prototype shrank what the present plate sets larger; it is not ruled                 |

## What follows, and where it applies

Nothing here is in the product. **Decision D7** of the chair, of 2026-11-16, rests on this page's measurements; it
is a design to be shown on one view before it is ruled, and it lies in the working material until it enters a
Change's design. In the ruling's words, in short:

1. Two inputs, both data: a viewing condition, the distance of the farthest viewer in image heights, of which a desk
   and a room are two values; and a legibility table, the least visual angle for each script's face and each reading
   role.
2. Sizes are derived and never typed: size = angle × distance × page height ÷ the face's letter height.
3. Text has a reading role: lead (the claim, the parts' names: read from the farthest seat), detail (relation labels,
   a part's details: read from near, by enlarging, or in one's own copy), apparatus (paths, counts). A condition
   gives each role its distance.
4. What does not fit loses detail in a declared order and never loses size below its role's floor.
5. Every figure states its reach, the distance in image heights to which each role is legible, computed from what was
   drawn; a build compares reach with the declared condition.

It applies, by D7, to every text the product sets on a figure and on a page, in every medium; it replaces the
engine's five steps of smaller type by levels of detail and belongs to the queue item `one-anatomy`. It takes the
place of what the chair withdrew that day: the default of four image heights, the tiers as typed sizes, and the 24 pt
floor for relation labels with the ruling that rested on the [room-size fit](room-size-plate-fit.md); see the
[committee's record](edition-forms-committee-2026-11-15.md).

## Not established

- The angles. 16′ and 20′ are second-hand, and 12′ for apparatus is a starting value of the prototype's brief. A
  reader's eye calibrates them; an agent cannot. With type within 5 % of the thresholds, the calibration of the
  letter and of the angle decides the counts above.
- Whether these plates are read from 2.6 or 4 image heights. Nobody looked from a distance.
- A size above the floor. Setting each text exactly at its floor shrank what the present plate sets larger; growth
  above the floor where a view has room, and a wiring bound on keeping detail, are not built.
- English: not built. Its floors are Latin's (names 25 px at a desk and 39 px in a room, labels 25 px).
- Whether one layout can serve two conditions. The prototype builds each condition by itself, and `overview` came out
  at two different levels.
- The order in which detail goes; more than two levels, a level for each part, shorter labels, or a view split in
  two.
- The page's furniture: title, question, summary, key, file list and foot stay at the house's sizes (the key's 11 pt
  reads to 2.4 H in Han and 1.7 H in Latin).
- The build does not compute reach or compare it with a declared condition: the prototype's script reads the sizes
  back from the built page.
- A refusal: none occurred, so its diagnostic sentence was never printed.
- A part's counts are apparatus by the prototype's brief; the product sets them on the kind's line, and the prototype
  leaves them there.
- The eight viewing situations that D7 names: only their range is in the records read.

## Record

Prototype of 2026-11-16, 08:37 to 09:32 CST, by its author, to a brief; the review of premises and decision D7 by the
chair, the queue's holder, on 2026-11-16 at about 08:5x CST, on the owner's question. Working material:
`build/runtime/work/reach/` (`NOTES.md`, `conditions.json`, `legibility.json`, `detail-levels.json`, the records and
the proof under `out/`), `build/runtime/work/committee-20261115/`, `build/runtime/work/style-research/round-5/` and
`build/runtime/work/sample-book/proof-3/`, all ignored and local to one checkout; the prototype's notes name its
copies of the source as residue that can be removed once they are read. Written up for this directory on 2026-11-16
by the author of the documents lane.
