## Why

After the conflict check was rewritten, a build of a large work still spends about two fifths of its own time in
the channel solver, and four of its costs are answers worked out again and again:

- At every assignment the exact search completes, it lists a band's spans and crossing verticals anew and
  serializes them, to look the band's tracks up by that text: 6.3 s of a 113 s build of the ETHOS work in Chinese.
  One channel of five wires solved on three label rows serializes 100,047 times.
- Whether two choices fit one another depends on the two alone, and the search asks it of the same two at every
  assignment that holds both: 11.7 s of a 73 s build of the same work once the first cost is gone. The same
  channel reads a wire's label 878,781 times, for 75 choices.
- A band's spans are laid on tracks by trying every order of them, up to 720 orders for six spans, and what two
  spans are to one another is worked out anew in every order: 12.1 s of a 61 s build of the same work once the
  first two costs are gone. Laying six spans reads their ends 55,800 times.
- The search measures the route defects of every assignment it completes, and the measure works out where a
  segment reaches, and whether it runs down or across, anew for every pair of segments it compares: 9.7 s of
  the same 61 s. Measuring forty wires reads a coordinate 262,040 times, for 160 points.

## What Changes

- What an option puts into a band is named once, before the search; an assignment names a band's content by its
  wires' numbers and neither lists nor serializes its spans.
- A pair of choices is asked once a search, for each count of label rows, and its answer is kept; a channel with
  more than four million pairs is asked each time, as before.
- What two spans of a band are to one another is worked out once a pair, before the orders are tried, and the
  orders of up to six spans are listed once for each count of spans.
- A segment's owner, reach and direction are worked out once, where the segment is made; a pair of segments that
  makes no defect makes no list and no text; a turn asks the relations of its own wire and builds no set.

No routing changes: every layout, plate and digest is what it was.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

## Impact

`src/layout/channel-solver/search.mjs`, `src/layout/channel-solver/tracks.mjs`, `src/layout/measure.mjs`, three
new test files with one fixture and one more test in `tests/layout-measure.test.mjs`, the research page
`docs/research/build-and-suite-time.md` and `CHANGELOG.md`. No delivered byte.

Queue: `performance`.
