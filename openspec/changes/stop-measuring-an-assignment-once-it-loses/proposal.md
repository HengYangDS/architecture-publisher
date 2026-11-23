## Why

Node's CPU profile of a build of ETHOS's Chinese edition on 2026-11-23 gave the channel search's measuring of the
assignments it completes 10.25 s of 59.5 s, 17.2 %, the largest share the publisher's own process still holds; of
it the route measure took 6.00 s. An assignment loses once its route defects bring its score to the best one's, yet
the search counted every defect of each assignment it measured.

## What Changes

- The route measure takes a limit and stops once it has found that many defects: the first of those it finds
  without one. Without a limit it measures as before.
- The search gives each assignment's measure the fewest defects with which it loses, found by the comparison the
  search makes, so a count stopped there decides as the whole count would. The best keeps its whole count.
- A test counts the work: a measure that has found as many defects as it was asked for reads no further.
- The performance record and the changelog say so.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None: every delivered byte is the same; only the work done to choose it is less.

## Impact

Changed: `src/layout/measure.mjs`, `src/layout/channel-solver/search.mjs`, `docs/research/build-and-suite-time.md`
and `CHANGELOG.md`; added: `tests/route-defects-limit.test.mjs`.

Queue: `performance`.
