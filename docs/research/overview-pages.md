# The overview pages placed by hand: what they hold

## Question

Every published work opens with an overview: one landscape page that tells the whole work at a glance. Its author
writes it as a Typst file that places every word, line and mark by coordinates. The product contract says that no
input states where anything stands, and the owner restated on 2026-11-17 that nothing is to be placed by hand.
What do these pages hold, so that a model can state it without a position and the publisher can draw it?

## Short answer

The six pages are built from the same few blocks: a masthead; one flow across the page, a course of stations or
a small graph; a second course with one outcome that leaves it; lists of terms and texts; tables; paragraphs that
belong to a block; and a foot. What their positions express that their words do not is a small set of relations: a
station's order, the run of stations a heading covers, a stretch where the course runs on parallel tracks, a line
from one station to others, the block a list or a paragraph belongs to. Each can be stated as data. The page's grid
is the same on every page: three bands under the masthead, set in halves or thirds of a content width of 1504 pt.

## What was read

The Chinese overview of each of the six published works in `architecture-publications` at its `dev` of
2026-11-17 (`publications/<work>/zh/overview.typ`, 127 to 152 lines a file), each read by one reader of another
origin with one brief. No page was rendered for the reading.

## Findings

### Counts

| Work                   | Blocks | Text placements | Lines | Dots and ticks | Values in pt |
| ---------------------- | ------ | --------------- | ----- | -------------- | ------------ |
| ETHOS                  | 15     | 74, 22 pairs    | 12    | 28             | about 230    |
| AIGW client            | 14     | 62, 18 pairs    | 17    | 15             | about 210    |
| Architecture Publisher | 16     | 60, 17 pairs    | 13    | 10             | about 200    |
| DDWG                   | 14     | 63, 14 pairs    | 13    | 18             | about 170    |
| filmkit                | 13     | 77, 18 pairs    | 6     | 25             | about 186    |
| openai-responses-proxy | 14     | 51, 21 pairs    | 6     | 19             | about 170    |

### The blocks

| Block                               | Pages | What it holds                                                                                       |
| ----------------------------------- | ----- | --------------------------------------------------------------------------------------------------- |
| Masthead                            | 6     | name, a claim of one line, a lead sentence, a note of how many files the work was written from      |
| A flow across band 1, as a course   | 4     | 8 to 12 stations in order, headings over runs of them, a parallel stretch, one or two lines over it |
| A flow across band 1, as a graph    | 2     | a chain or two entries fanning out to 4 or 7 parts; the parts of a model, or names retyped          |
| A second course with an outcome     | 5     | 5 to 7 stations, a label on one step, one outcome that leaves one station downward, with a sentence |
| Lists of terms and texts            | 6     | 4 to 7 lists of 2 to 7 pairs, with a heading or without, in halves or thirds                        |
| Tables                              | 4     | 6 rows by 2 columns, 4 titled groups of 3 pairs, 10 stages with two codes                           |
| A paragraph that belongs to a block | 4     | one or two sentences under a course or a table                                                      |
| Foot                                | 6     | one sentence that is the product's own words, retyped by each author                                |

The count of files in the masthead is retyped by hand on all six pages; the build measures it. Only one page (DDWG)
refers to the model's parts by id; the other five retype the names of parts.

### What a position expresses

- The order of stations along a course.
- The run of stations a heading covers: filmkit's seven headings over twelve stations in runs of 1, 2, 2, 2, 1, 3
  and 1, read from x alone.
- A stretch run on parallel tracks: ETHOS's work lanes on three tracks, filmkit's two languages on two.
- A line over or under a course from one station to others, with a sentence: a return to the start, one record
  read by three later stations, a binding back to two stations, a response that returns to its client.
- The block a list, a note or a paragraph belongs to: a list under the lanes' stretch, a note under one station or
  one owner's lane, a paragraph under a course.
- A mark's kind: ring, tick and disc differ by station on every page, and no page says what they mean. Every reader
  asked.

### The grid

Every page sets a masthead and three bands, divided by rules. Band 1 holds the flow at full width; bands 2 and 3
are halves (728 pt, a gutter of 48 pt) or thirds (464 pt). The second course and a table stand side by side in band
2 on five pages; the lists of band 3 stand in thirds on all six.

## What follows for the product

- An overview is stated in the model as a few kinds of block, none with a position: the masthead's claim and lead;
  one course, of steps that may hold stations, run on parallel tracks and carry notes and texts, with lines between
  steps; further courses with a labelled step and one outcome that leaves a step; headed lists of terms and texts;
  tables; and a note that belongs to a block. Where a station names a part of the model, its name is the model's.
- What the hand-placed pages say by position, they say by a field: a step's stations, its parallel tracks, a line's
  ends, the block a note belongs to.
- A mark carries one meaning or is not drawn: a station is a ring, the course's two ends are larger, and the
  outcome that leaves a course is drawn in the accent. The ticks and discs whose meaning no page states are not
  kept.
- The masthead's count of files and the foot are the publisher's.
- The publisher lays the blocks on the grid of the six pages, chooses halves or thirds by what the blocks hold and
  how tall they are set, and refuses a page whose text leaves the live area or lies over other text, as it does
  today.
- A flow that is a graph of the model's parts is a view the plate engine draws; a course is not, so the course is
  the overview's own figure.

## What is not established

- That every block of the six pages fits the grid when set by measure rather than by an author's adjustments: the
  first works converted show it or not.
- Whether a reader reads a page set by the publisher as well as the page set by hand: no reader was tested.
- The English pages were not read; their blocks are taken to be the same as the Chinese ones.

## Record

2026-11-17. Six readers, one file each, by one brief (`build/runtime/work/overview-auto/BRIEF-stock.md` in the
checkout's ignored tree); the synthesis is the holder's. The owner's words of 2026-11-17 13:20 stand in the
holder's record of the owner's words.
