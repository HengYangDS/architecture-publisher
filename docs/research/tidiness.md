---
subject: architecture-publisher:research-tidiness
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# Tidiness, built in and measured

A research page. It records what untidiness on a page was found to be, a measure that reads a finished PDF for it,
how that measure was calibrated and what it cannot see. It decides nothing; the decisions that rest on it are named
under "What follows".

## Question

On 2026-11-15 the owner pointed at three places in a hand-set sample book and then at the kind of problem:

> 「另外，这里圈内的数字，是不对齐的，看起来很不工整」「如果数字的部分是对齐的，观感会好很多」
>
> 「尤其是 7 底线那里，目前这种居中方式，在文字不等长时，导致的不对齐，会显得画面很脏乱」
>
> 「8 那个外圈的线怎么是细线，和 1~7 的不一样」
>
> 「我反映的工整和整洁问题，是个系统性问题，你需要从本质上解决。要机制上处理，而不是头疼医头脚疼医脚」
>
> 「这里，距提交日 那一列的对齐也不好」「你看看图的部分，是残次不齐的，因为后面数字的长短不一」
>
> 「所以，这种情况，应该是 xy 日在前面，图在后面？还是有其他更好的解决方式？」
>
> 「类似的问题，不要让我一一列举，请自己发现问题并系统性解决」

Glosses, made for this page and not the owner's words: "Also, the numbers inside the circles here are not aligned; it
looks very untidy." "If the numbers were aligned, it would look much better." "Especially at 7 底线: with the present
way of centring, where the texts are of unequal length, the misalignment makes the picture look dirty and disorderly."
"Why is the outer ring of 8 a thin line, unlike those of 1 to 7?" "The tidiness and cleanliness problem I raised is a
systemic one; you need to solve it at its root. Handle it by mechanism, and do not treat the head when the head aches
and the foot when the foot aches." "Here, the column 距提交日 is not well aligned either." "Look at the part with the
pictures: it is uneven, because the numbers after them differ in length." "So in this case, should 'xy 日' (xy days)
come first and the picture after? Or is there another, better solution?" "Do not make me list such problems one by
one; find the problems yourself and solve them systematically."

The Chinese words left in the glosses are text on the pages pointed at. As the lane's coordinator told this drafting
on 2026-11-16, 距提交日 is the head of the source table's column, "days before the commit date", and "7 底线" is the
label of the seventh circled item, "bottom lines", on the first proof's page; the working records do not say this
themselves. The working note of the measure places the remark on the column at page 33, its column of swatches and
days. The record of the owner's rulings holds all nine sentences since 2026-11-16, when the three on the swatch column
were added; the working note quotes the first of those three only.

So: what is untidiness, stated so that a builder can exclude it and a check can find it, without anyone listing its
instances?

## Short answer

- A page is tidy when things of one kind share their values; untidiness is the near miss or an unexplained difference.
- Each thing the owner saw had one cause in the page's construction, and a construction exists that cannot produce it.
- A measure reading the finished PDF reports near misses; on the six pages it was calibrated on, 17 of 19, none false.
- An overrun, a thing in another's place, is no near miss: the measure is blind to it, so the page's boxes are checked.
- Only six pages are judged, and the measure sees edges: not ink, not ugly but consistent spacing, not meaning.

## What was measured

All of it is working material of 2026-11-15 and 2026-11-16 under `build/runtime/work/tidy/`, ignored and local to
one checkout.

| Material                                              | What it is                                                                                       | How it was used for this page         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `README.md`                                           | The working note: definition, causes, the three layers, calibration, tests, census, limits, next | In full                               |
| `tidy.py`, `test_tidy.py`, `labels.json`, `census.py` | The measure, its tests, the labelled set, the census                                             | Not opened; taken as the note reports |
| The second proof's review, parts 4 and 5              | Where the second kind of fault was found; see [what the second proof showed](second-proof.md)    | In full                               |

**The measure.** `tidy.py` reads a PDF as words with their boxes (`pdftotext -bbox-layout`), their size and face
(`pdftohtml -xml`) and their true baseline (the origins of their glyphs in `pdftocairo -svg`). Words of one baseline
with no gap wider than 0.8 em are one cell. Each of the three edges (left, right, centre) is clustered across the
page; a cell belongs to the largest cluster of three cells or more whose edge it shares, and that cluster is its
column. Two columns are of one table when their cells in the same rows keep one baseline offset in most rows. A cell
that shares no edge with two others is loose, and a loose cell is a finding only where the page gives a reason to
read it with a column. The thresholds are named constants with their reasons at the top of the script.

Its rules, as the note names them:

| Rule        | Reports                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------- |
| `stack`     | Three or more things of one kind, one under another, that share no left edge, right edge or centre |
| `pitch`     | One column of lines with two nearly equal pitches                                                  |
| `margin`    | Two left edges nearly equal                                                                        |
| `variation` | Marks of one kind and size in two stroke weights                                                   |
| `budget`    | More type sizes, text styles or stroke weights than the budget                                     |
| `baseline`  | Named in the census and in the limits; compares cells of columns only. The note does not define it |
| `numbers`   | Named in the census. The note does not define it                                                   |

**The labelled set.** Six pages: four of the hand-set book (`p02-contents`, `p28-binds-whom`, `p33-sources`,
`p09-main-parts`) and two fixtures. Every finding of the first version of the measure was judged once, and what a
look at the page found that it missed was added. Judged from 13 rendered crops and from coordinates. `budget`
findings are counts and were not judged.

**The tests.** Nine tests, run 2026-11-15 21:07 (the result file was written at 21:07:18), all passing in 3.648 s.
`tidy.py` was last changed at 22:45:00 that day, after that run and after the census (21:07:28); no run of the script
as it stands is on record. They assert: each fixture reports the defect the owner saw (the eight rings' `stack`, the
ring's `variation`, the 36 and 21 swatches' `stack`) and the two rebuilt pages do not; every label reported is found
by rule and place, every false finding is absent, and a labelled page reports nothing unlabelled; a tidy table made
with Typst reports nothing, a table whose third row stands 3 pt out of line reports its mark and its code, a list
whose pitch alternates by 1 pt reports it; a sidecar accepts a finding only by rule, place and a reason.

**The census.** The calibrated measure run over two editions; a page "has a finding" when it has one of `stack`,
`numbers`, `baseline`, `pitch`, `margin`.

## Findings

### What untidiness is

A page is tidy when things of one kind share their values: marks that repeat down a column stand on one axis, text
of one column begins or ends at one x, lines of one text are one pitch apart, there is one margin and not two that
nearly agree, and a difference between two things of one kind is one the page explains. Untidiness is the near miss:
two values that are almost equal and not equal, or a difference nobody explains.

### Each thing seen is one cause

| Seen                                          | Cause                                                                                                                                           |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Circled numbers out of line (page 31, page 7) | Two things of unequal width (a number and a label) were centred as one group in each row, so the fixed-width one moved with the other's length. |
| Swatches out of line (page 33)                | Two things (a swatch, a number of days) shared one flush-right cell, so the swatch stood wherever the number's width left it.                   |
| Ring 8 thinner than rings 1 to 7 (page 31)    | One meaning (a relation into the hub) was drawn in two channels (the line's weight and the ring's weight) and the key explained one.            |

### Calibration

|                                         | Judged | First version | Calibrated                                    |
| --------------------------------------- | ------ | ------------- | --------------------------------------------- |
| True, reported by the first version (T) | 6      | 6 reported    | 6 reported (one through the marks it follows) |
| True, missed by the first version (M)   | 13     | 0 reported    | 11 reported, 2 missed                         |
| False (F)                               | 25     | 25 reported   | 0 reported                                    |

The six pages are the ones the rules were calibrated on, so 17 of 19 reported and none false describe a fit to those
pages, not accuracy on a page the measure has not seen. The two still missed are both in the key of page 9: two notes
of one row on baselines 4.7 pt apart (neither is in a column, and `baseline` compares only cells of columns), and two
notes that begin 3.2 pt apart (two items are no column).

### Census with the calibrated measure

| Edition                     | Pages | Pages with a finding | Findings | `baseline` | `numbers` | `pitch` | `stack` | `margin` | Over budget | `variation` |
| --------------------------- | ----- | -------------------- | -------- | ---------- | --------- | ------- | ------- | -------- | ----------- | ----------- |
| Hand-set book               | 37    | 34                   | 98       | 67         | 12        | 8       | 6       | 5        | 36 pages    | 1           |
| Product's edition `ddwg-zh` | 9     | 0                    | 0        | 0          | 0         | 0       | 0       | 0        | 8 pages     | 1           |

The ten worst pages of the book: 16 (13 findings), 22 (7), 19 (6), 8, 23, 31 and 37 (4 each), 4, 7 and 9 (3 each).
Of the 67 `baseline` findings, 21 are of 0.6 pt, the smallest the rule reports: a monospaced cell set by its box and
not on its row's baseline. A first census, made with other rules, counted 32 of 37 and 4 of 9 pages and is
superseded.

### What the measure cannot see

- Optical alignment: it measures the boxes type is set in, not ink. A line that begins with 「 or a numeral 1 stands
  on the edge and looks indented.
- Spacing that is consistent and ugly: one pitch too tight, a gutter too narrow, a paragraph space of 1.5 pt
  repeated every time.
- A wrong hierarchy, a wrong grouping, a head over the wrong column: it knows edges, not meaning.
- Two items that nearly align: a column needs three. Cells that stand in no column are not compared for baseline.
- A cell that shares an edge with two unrelated cells elsewhere on the page by chance is taken as placed, and a near
  miss of its own column is then missed.
- Cells of columns set closer than 0.8 em are read as one cell; a monospaced word space is 0.6 em, so no smaller
  threshold separates them.
- A head or a line alone in its row (a caption 3 pt off the list under it): a miss is reported only in a row that
  has two other cells in the table's columns.
- Text drawn as outlines, rotated text, and the inside of images.
- A run-in (a note after text of varying length) is taken as placed by what it follows. A numeral in a ring is
  measured through the ring only.

### A second kind of fault: a thing in another's place

Found on 2026-11-16 in the second proof. A repair to a key of four long entries overran the key's line on pages 94,
167 and 182: one entry lay over the next, and the last ran 120 pt past the margin. The measure
reported nothing, and rightly by its own definition: it looks for near misses among like things, and an overrun is
no near miss. The face check of that proof did not see it either.

The fault is measured where the page's boxes are known exactly, in the page face the kit leaves (every block and
mark with its box): no box over another, none outside the frame. The proof's build now checks this on every box:
11 977 boxes in the booklet and 1 257 in the presentation, and the survey found these three keys and nothing else.
Six wrong pages are kept as fixtures and all six are refused: two for this rule, which are the two the working note
counts, beside four from part 5 of the proof (a mark on another column's axis, a number ending at another column's
x, a continued table without the head that names its statement, a source table without its column heads on its
second page); the review named the six on 2026-11-16.
It is checked on the face and not on the PDF, because from the PDF alone text set over text reads as one run. By
construction, a line of typed cells whose natural widths exceed its measure fails the compile.

## What was compared

| Way to get a tidy page                                           | For                                                                                                                               | Against                                                                                                          |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Repair each place that is pointed at                             | Nothing recorded                                                                                                                  | The owner refused it by name; the census found findings on 34 of 37 pages, so instances do not end               |
| By construction: primitives that cannot misalign                 | Removes the cause: every kind of cell has its own column and alignment, positions come from one grid, one meaning has one channel | Not recorded; the working note pairs it with a measure that knows nothing of how a page was made                 |
| By measure: read the finished PDF, knowing nothing of its making | Independent of the builder; finds what the builder did not foresee; calibrated against judged pages                               | Sees edges and not ink or meaning; needs three items for a column; judged on six pages only; blind to an overrun |
| On the page face: every box against every other and the frame    | Sees a thing in another's place, which the PDF hides                                                                              | Reads the page face the kit leaves, not the finished PDF                                                         |

The first version of the measure against the calibrated one is the table under "Calibration": the first read
poppler's lines and reported 25 false findings on the labelled set; the calibrated one reads words, boxes and
baselines.

## What follows, and where it applies

The working note orders three layers; none is in the product.

1. **By construction.** Repeated things are placed only by primitives that cannot misalign: a row of typed cells in
   which every kind of cell has its own column and its own alignment (marks at one x; numbers flush right in tabular
   figures with the unit in the head; labels flush left from one x), never a group centred in a row; positions and
   gaps come from one grid and one scale of spaces; one meaning has one channel, named in the value table and shown
   in the key.
2. **By measure.** A page is not sent while it has a finding; a finding that is right as it stands is recorded as an
   exception with its reason, in the page's source, where a reviewer can see it.
3. **In the product.** The same measures become properties the product tests on every delivered plate and page,
   beside its existing gates, and the value table gains the scale of spaces and the alignment of each region.

It applies to the pages and plates of the edition. The chair's ruling R9 (of the committee of 2026-11-15) names the measure in its geometry
acceptance (zero findings or recorded exceptions; repeated things placed by typed columns only); see the
[committee's record](edition-forms-committee-2026-11-15.md). The layers are to enter the queue items `one-anatomy`
and `blocks-by-question`, each by its Change's design; the box check is proposed as a third property of
`blocks-by-question`'s geometry acceptance, beside the floors and the tidiness measure. The alignment rules for
tables that the construction follows are on the page [layout of pages that are mostly text](text-page-layout.md).

Still to do, by the queue's holder: judge the census findings on the other pages of the book, label three pages of
the product's edition, and give the two missed labels a rule (cells of one row that stand in no column); build the
primitives into the kit of the redesigned pages and make the measure a step of the book's build.

## Not established

- Only the six labelled pages are judged. The findings on the other 31 pages of the book are measured by rules that
  report no false finding on the six; nobody has looked at them. One reading of the census found three rules too
  loose (labels of a drawing grouped as a stack, a paragraph space in ragged English text reported as a pitch, an
  indent reported as a miss); they were tightened and the tests rerun, and no page of that kind is in the labelled
  set yet.
- Findings of 0.6 pt are at the limit of what a reader sees. They are reported because their cause is one a setter
  removes at no cost; the owner may prefer a higher tolerance for `baseline`.
- The shape rules are as they were in the first version, with two corrections a label required: an outlined segment
  is joined to its bar, and `margin` compares shapes of one make only.
- The exceptions' sidecar is tested on a synthetic page; no page of the book carries one. In the second proof two
  `budget` findings were accepted by sidecar because the budget counts font sizes where tiers by letter height make
  faces of one tier differ in size; the review asks that the rule count tiers.
- Whether a near miss is annoying and not merely visible: the layout study reports vernier offsets of 2 to 5
  arcseconds as detectable, from a search summary only.

## Record

2026-11-15, by the queue's holder, after the owner's remarks on the hand-set sample book; the second kind of fault
added on 2026-11-16 from the second proof. Working material: `build/runtime/work/tidy/` (the note, the measure, its
tests, the labelled set, the crops, the census) and `build/runtime/work/sample-book/proof-2/`, both ignored and
local to one checkout. Written up for this directory on 2026-11-16 by the author of the documents lane, and brought in
line the same day with the owner's rulings and the review as amended. Corrected later that day after an independent
review (`build/runtime/work/audit-20261116/`, ignored and local): the calibration set is named as such, and the file
times of the script, the test result and the census are given.
