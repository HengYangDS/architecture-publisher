## Context

`docs/research/overview-pages.md` reads the six hand-placed overview pages: the same few blocks on one grid, and a
small set of relations that their positions express. Today a model names a Typst file in `overview`; the publisher
stages it with the house class (`src/overview/house.typ`), refuses imports, styles and missing files, typesets it,
reads back every text's glyph box and refuses text outside the live area or over other text
(`src/overview/checks.mjs`). The title and contents pages are already the publisher's: `edition()` in the house
class sets them from the edition's record, by measure, with no input that places anything.
`docs/research/figure-language.md` records the end state the owner agreed with on 2026-11-17: one model in, one
complete edition out, no page placed by hand.

## Goals / Non-Goals

**Goals:**

- The overview drawn by the publisher from what the model states, as the title and contents pages are.
- Every relation that a hand-placed page expressed by position stated by a field, so no meaning is lost.
- The same gates as today, and one more: a page too tall for its blocks is refused, naming the block.

**Non-Goals:**

- A graph of the model's parts as the overview's flow: a view the plate engine draws. Two works use one; they state
  a course or show the graph on its plate.
- A choice among compositions of the overview page: one grid, as the six pages share it.
- The portrait form: `portrait-edition`.

## Decisions

1. The model states the overview as blocks of a few kinds, none with a position.
   - Rests on: `docs/research/overview-pages.md` ("The blocks", "What a position expresses").
   - Considered: keeping the composition and moving its coordinates into a style; a free list of figures each
     naming a kind.
   - Chosen because: the six pages hold the same few blocks; a block kind that the publisher knows can be laid out
     by measure, and its relations stated as fields (a step's stations, its tracks, a line's ends, the block a note
     belongs to).
   - Applies to: `overview` in the model: `claim`, `lead`, `course` (`steps`, `lines`, `text`, `parallel`, `spurs`,
     `passes`) and `blocks`, in the
     order the page sets them: further courses, lists, tables, groups of lists and headed texts, each with an
     optional text. A step's stations may include forks, whose branches are siblings with no order (a fan to
     clients, providers or topics, a split into two outputs). A stretch of the course, from one station to a later
     one across steps, runs on tracks counted or named (`parallel`): filmkit's two languages split inside one step
     and join three steps later, which tracks stated by step drew as three splits. A line joins points: a station, a
     branch, a spur or a step without stations; a step that holds stations is a run, not a point. A spur is a
     station beside the course that leaves one of its points (the publisher's LikeC4 import, AIGW's tokens and
     model family); a line with an end at a spur runs under the course. A fork that ends the course sets its
     branches side by side (DDWG's topics, the proxy's providers); one that another point follows splits the course
     into a path for each branch, which join it again (the publisher's edition and page into its delivery, AIGW's
     clients into their endpoints). A course may label a stretch between two points (AIGW's "serves"). Readers who stated the six pages found
     these missing from the first form of the statement.
2. The publisher lays the blocks out on one grid, in Typst, by measure.
   - Rests on: `docs/research/overview-pages.md` ("The grid"), and the house class's title and contents pages,
     which are set this way today.
   - Considered: computing every position in the engine, as plates are, and handing Typst a list of placed runs.
   - Chosen because: the page is text in rows and columns, which Typst sets and measures natively; the plate engine
     solves routing between boxes, which the overview does not need. The text boxes are read back and checked as
     before.
   - Applies to: band 1 the course at the content width; the other blocks in the order stated: a course, a table or
     a group takes a half; a run of lists and headed texts takes the rows of thirds and halves with the least height
     in all, measured at each spacing; headed texts stated one after another share a cell, as the hand-placed pages
     stacked them; a list of six items or more, each one line in half its width, stands in two columns, as the
     publisher's own page set its refusals. An item follows the one before at a line's pitch and a small gap.
     A station takes one cell of its step and a fork one for each branch; a fork's branches stand side by side
     under the course on a bar that leaves it. Lines between points take the highest channel their spans keep clear
     of; a step without stations sets its text under the course beside the stations' notes. The page is laid out at the house's spacing and, when that reaches
     below the foot, at a closer spacing with notes and texts a size smaller, as a plate tries its type steps; a page
     that fits at neither is refused with `overview_too_tall` and the first block that does not fit. The six works'
     pages, stated from their hand-placed compositions, are drawn and pass the page's checks in both languages. The
     checks read back the page's lines and rings as well as its texts, and refuse a text under a line.
3. A note or a text of more than one line is justified, as the edition's prose is.
   - Rests on: the owner, who asked for justified paragraphs on 2026-11-07, 2026-11-12 and 2026-11-13 and again on
     2026-11-18 on seeing this page ragged. The edition's typography already requires it of prose; the overview's
     text primitive never met it, hand-placed or drawn. English text is set as prose is. Chinese text is filled and
     spread line by line with the breaks and the bound a part's details use on a plate (`src/breaks.mjs`): Typst's
     own justification of a narrow column pulls a line's characters apart before a Latin word that does not fit.
   - Considered: Typst's paragraph justification for every language (the fault above); hyphenating Latin words
     inside Chinese text (it breaks identifiers such as `OpenSpec`).
4. The overview is the edition's map: a point or a block names the view that enlarges it, and the page sets that
   view's plate number there, as a link.
   - Rests on: the owner, 2026-11-18 07:37 and 07:38 (the overview's mission is one page of overview; the pages
     after it each expand one topic), 08:39 (the committee's design; links that jump are needed). The committee of
     2026-11-18 (`build/runtime/work/committee-20261118/RESULT.md`): the overview keeps all it states and delegates
     depth to the plates by number. The model states a reference, never a position; the product derives the number
     and reports a view the overview does not reach.
   - Considered: deriving the tie from the parts a block names (too few blocks name parts); a strip of the course's
     stations on every plate (takes room from every figure, and marks nothing on plates off the course).
5. The height a page's rows leave is shared between them, so the page is full.
   - Rests on: the owner, 2026-11-18 00:53 and 00:56 (every page is full, as a matter of course), and 09:1x on seeing
     a band of paper under the rows. The rows keep their content; only the room between them grows.
   - Considered: a larger type size for the whole page (changes the hierarchy; the committee's three sizes are a
     Change of their own).
6. A mark carries one meaning, and only marks with a meaning are drawn.
   - Rests on: `docs/research/overview-pages.md` ("What a position expresses", the last item: every reader asked
     what ring, tick and disc meant, and no page said).
   - Considered: keeping three kinds of mark with a key.
   - Chosen because: a mark nobody can read is noise; a station is a station.
   - Applies to: a station is a ring; the course's first and last stations are larger rings; a fork's branches and
     a spur are smaller rings under the course; a stretch on parallel tracks is drawn as thinner lines beside the
     course; a line between points is drawn over the course with its sentence; the outcome that leaves a course is
     drawn in the accent, with its sentence.
7. A step or a station may name a part of the model, and then prints the model's label.
   - Rests on: `docs/research/overview-pages.md` (five of six pages retype the names of parts).
   - Chosen because: a name stated once cannot drift; a part named that does not exist is refused at the model's
     path with `model_reference_unknown`.
8. The composition is retired, not kept beside the statement.
   - Rests on: the contract's Product paragraph ("no other input of its kind is added", and the composition "stays
     until the publisher draws the overview from the model").
   - Considered: accepting both forms for a release.
   - Chosen because: two ways to state one page is the choice the edition marks were; a model that names a `.typ`
     file is refused with `model_overview_composition_retired`, which says what replaced it.
   - Applies to: the schema, the staging and its three refusals, the manifest's composition record.
9. The queue gains `overview` before the rest of `composable-parts`.
   - Rests on: the owner's words of 2026-11-17 13:20 and the holder's decision under the owner's delegation of
     2026-11-15 to order the work; `docs/research/figure-language.md` ("What follows for the product").
   - Applies to: the contract's queue and the item `carriers`, which no longer names the overview.

## Risks / Trade-offs

- A page set by measure may not fit what an author fitted by hand → the statement is checked against the grid by
  the build, which names the block that does not fit; the six works are converted and built in this Change's
  acceptance.
- Retiring the composition breaks every published work until its models carry statements → the publications move
  with the release that holds this Change, in one Change of their own.
- Marks without a meaning are dropped, so a page loses the difference between a record and a check that its author
  meant → the station's note says it in words.
