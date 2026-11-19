## Context

The exact search of one channel (`src/layout/channel-solver/search.mjs`) walks the wires in order, tries each
option of a wire on each label row, and at a complete assignment asks for the tracks of the upper and of the lower
band. The tracks of a band are solved once for one content of the band: the search kept them under a key it made by
serializing the band's spans and the verticals that cross it, which it first collected from the chosen options.
On the way down it asks `compatible` whether a choice fits the wires already chosen, which looks at the choice and
at each chosen one in turn. For a band's content not yet solved it calls `assignTracks`
(`src/layout/channel-solver/tracks.mjs`), which tries every order of up to six spans; and where the medium draws
the channel's wires it measures each complete assignment's route defects with `measureRoutes`
(`src/layout/measure.mjs`), the same measure the whole layout is held to.

Both are asked far more often than there are different questions. An option's spans in a band and the verticals of
it that cross the band do not depend on the label row it takes, and there are a few options a wire. Two choices fit
or do not, whatever else is chosen, and a channel of five wires with five options each on three rows has 75
choices where the search completes tens of thousands of assignments. Whether one span's top stands on another's
bottom, whether the two may share a track and how many of one's ends lie within the other are the same in each
of the 720 orders. Where a segment reaches and which way it runs are the same against every other segment.

## Goals / Non-Goals

**Goals:**

- The search asks for a band's tracks, and for the fit of two choices, without making the question anew each time.
- The track assignment and the measure work out a fact about two spans, or about one segment, once.
- Every delivered byte is what it was.

**Non-Goals:**

- No change to what the search finds, to its budget, to the order in which it tries choices or to `compatible`,
  whose answers stay defined row by row in the tests.
- No change to which orders the track assignment tries, to the order it tries them in or to which of two equal
  assignments it keeps; no change to what the measure finds or to the order it lists its findings in.
- The suite's width: a further cause in the record, measured on the guests in a Change of its own.

## Decisions

### 1. A band's content is named once an option

Rests on: `docs/research/build-and-suite-time.md` (the build's profile by line, and the builds before and after).

Considered: a cheaper serialization of the spans; a key made of the chosen options' positions and rows; a number
for what each option puts into each band, given before the search.

Chosen because: the row an option takes changes nothing of its spans or of where its verticals cross a band, so a
key that held the row would solve one band's tracks up to three times. The option's own content, serialized once
before the search, is the same question the old key asked, asked once: an assignment's key is its wires' numbers,
and the spans are listed only for a content not yet solved and for the assignment the search keeps.

Applies to: `src/layout/channel-solver/search.mjs` (`search`: `nameOf`, `tracksFor`).

### 2. A pair of choices is asked once a search

Rests on: `docs/research/build-and-suite-time.md` (the build's profile by module before and after, and the builds).

Considered: precomputing every pair before the search; rewriting `compatible` to take a pair; asking `compatible`
with the one other choice the first time a pair meets, and keeping the answer.

Chosen because: the search prunes, so most pairs never meet, and a table filled as pairs meet costs only what is
asked. `compatible` decides choice by choice already, so asked with one chosen choice it answers for the pair, and
its definition and its tests stay as they are. A choice is numbered by wire, option and row; the answers lie in one
array of bytes, cleared for each count of label rows, since the fit of two choices depends on how many rows there
are. A channel with more than four million pairs keeps none and is asked as before: the array would outweigh
what it saves.

Applies to: `src/layout/channel-solver/search.mjs` (`search`: `fits`).

### 3. What two spans are to one another is worked out once a pair

Rests on: `docs/research/build-and-suite-time.md` (the build's profile by function after decisions 1 and 2, and
the builds before and after).

Considered: a cheaper search than trying every order; keeping the answers of whole bands between searches;
working out each fact about two spans once, before the orders are tried.

Chosen because: another search could keep another of two assignments that score alike, and every plate would
have to be shown unchanged anew; the tracks of a band are already kept for a search by the band's content. The
orders, their sequence and the first-kept rule stay exactly as they are, and only what they read changes: four
small tables of a pair of spans (stands on, too near, ends within from above and from below) and one count of the
crossing verticals, which does not depend on the order at all. The orders of up to six spans are the same lists
for every band of that many spans, so they are made once a count and only read after. What the assignment answers
is stated order by order in a fixture, and a test holds the solver's own to it on seeded bands.

Applies to: `src/layout/channel-solver/tracks.mjs` (`assignTracks`), `tests/fixtures/tracks-by-orders.mjs`.

### 4. A segment's own facts are worked out where the segment is made

Rests on: `docs/research/build-and-suite-time.md` (the same profile, by function and by line, and the builds
before and after).

Considered: measuring fewer assignments in the search; a measure of its own for a channel; keeping the one
measure and working out a segment's owner, reach and direction once.

Chosen because: the measure is what a layout is held to, and a second measure for the search could let a defect
through that the first finds; which assignments are measured decides which is kept. The measure's findings and
their order are untouched: a segment carries its owner's name, its reach and its direction from where it is made,
a pair that makes no defect makes neither a list of numbers nor a text, and a turn beside a card asks its own
wire's relations for the card where it built a set of every wire's ends first.

Applies to: `src/layout/measure.mjs` (`segmentsOf`, `measureLayout`, `routeDefects`).

### 5. What keeps each cost from returning

Rests on: `docs/research/build-and-suite-time.md` (finding 6: a bound in seconds fails for the host's reasons).

Considered: a bound on a build's seconds; counts of work.

Chosen because: all four costs are countable from outside and the counts are the same on every machine.
One test counts what a solve serializes and requires the same count on one label row and on three; one counts
how often a solve reads a wire's label and requires it within the count of pairs of choices; one counts how often
laying six spans reads a span's ends and requires it within two reads a span; one counts how often measuring
forty wires reads a coordinate and requires it within eight reads a point.

Applies to: `tests/channel-search-bands.test.mjs`, `tests/channel-search-pairs.test.mjs`,
`tests/channel-tracks.test.mjs`, `tests/layout-measure.test.mjs`.

## Risks / Trade-offs

- [A kept answer is read for another question] → a pair's number holds wire, option and row of both choices, the
  array is cleared when the count of rows changes, and it lives for one search; the published works are built
  before and after and compared byte for byte.
- [Two options of a wire put the same content into a band] → they share a name, which is right: the band's tracks
  are the same.
- [The tests tie to how the search reads its input] → each states one property, that a cost does not grow with the
  assignments, the orders or the pairs, and nothing else about the code.
- [The track assignment keeps another of two equal assignments] → the orders and the first-kept rule are untouched,
  the fixture states the assignment order by order, and 6,000 seeded bands, with and without an assignment, answer
  alike.
- [The measure finds something else, or in another order] → its own six tests pass unchanged, the measure before
  and after agree on 6,000 seeded geometries that make every kind of finding (a scratch comparison, recorded in the
  research page), and the published works are built before and after and compared byte for byte.
