## Context

`solveChannel` (`src/layout/channel-solver/search.mjs`) routes one channel exactly within a budget of 60,000
nodes for each number of label rows. `routeChannel` (`src/layout/grid.mjs`) asks it once for each of five port
spacings and again for more label rows, `drawLayout` runs for each layout a plate asks for, and a plate asks for a
layout for each candidate key (`src/poster/plate.mjs`: type step, wrapping, field width, centring, clear turns,
details, caption form). The layout is remembered by that key; the channels under it are not.

Measured on 2026-11-17 in this lane at `7c6504d5` and on `dev` at `60006a90`, one test of
`tests/edition-plates.test.mjs`, one process (`build/runtime/work/one-part/run/suite-speed/`):

|                          | `dev`   | lane      |
| ------------------------ | ------- | --------- |
| calls of the solver      | 32,222  | 17,240    |
| distinct inputs          | 3,306   | 2,364     |
| nodes visited            | 461,352 | 4,290,320 |
| most wires in a channel  | 5       | 7         |
| the test file, wall time | 162 s   | 298 s     |

A profile of that test gives the solver 42 of 53 s. Over 17,403 repeated calls in two tests, a second solve of an
equal input never gave another result.

## Goals / Non-Goals

**Goals:**

- The suite fits its gate again with room, and a build does not pay for the same channel twice.

**Non-Goals:**

- No change of any routing, of the search's budget or of what a plate tries.
- No faster search of a channel met for the first time: a channel of seven wires still costs what it costs once.

## Decisions

1. The solver remembers results by an exact key of its whole input.
   - Rests on: the measurements above; the solver reads only its arguments (the channel with its wires, edges and
     the cards beside it; the spacing; the row bounds; whether routes are measured).
   - Considered: a key of the fields the search reads today; remembering in `routeChannel` or in the plate; raising
     the gate's timeout.
   - Chosen because: a key of chosen fields goes wrong silently when the search reads one more; the callers above
     the solver differ in what stands inside cards, which the solver does not read, so only the solver sees that two
     inputs are equal; a longer timeout leaves every build half again as slow.
   - Applies to: `src/layout/channel-solver/remember.mjs`: a key that follows every own property in order, writes
     a reference back to an enclosing object as the depth it returns to (a wire's points name their wire), and
     treats functions as unsupported; `solveChannel` wrapped by it.
2. What is remembered is bounded and frozen.
   - Considered: remembering without a bound; remembering for one view.
   - Chosen because: a build of a large work meets tens of thousands of channels, and the repeats stand close
     together, within one view's candidates; the oldest result leaves when the store holds 4,096. A result given
     to several callers must not be changed by one of them, so it is frozen through, and a caller that writes to
     it fails in the suite, not silently.
   - Applies to: the same module.

## Risks / Trade-offs

- [The solver comes to read something outside its arguments] → Then equal keys could mean different results. The
  key takes the whole of every argument, and the test of the pinned digests holds every drawn byte.
- [A result is changed by a caller] → It is frozen; the whole suite runs in the proof.
