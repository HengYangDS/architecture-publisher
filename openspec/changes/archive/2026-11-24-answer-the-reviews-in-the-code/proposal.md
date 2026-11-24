## Why

The independent reviews of 2026-11-24 of the Changes that landed for 0.18.0 found faults in code that no published
work meets: a delivered page could read as refused past Archify's limit, a generated page held the plates' layout
until its candidates were measured, a refused build left its page running, a kept page did not answer the
publisher's own verdict, a long question refused its plate, and two tests held less than they claimed. 0.18.0
shipped the corrected docs; the code waited for this Change, after Archify 3.3.0.

## What Changes

- Archify's limit of 300 s is the publisher's own: when it expires during the plates' layout, a grace of 10 s on a
  free event loop follows, and a run that ended meanwhile is read. A run that hangs ends after up to 310 s, and its
  refusal says it met the limit.
- A page's work hears as each of its runs of Archify begins, a candidate's as well as its own: the plates' layout
  waits for the first, not for every candidate.
- A page the build no longer needs is stopped: on a refusal, and where a plan made again for shorter strips starts
  its page again. A refused build or check reports once its page's work has ended, so no run of Archify and no work
  file outlives it.
- A kept page is kept by the digest of the module that forms the publisher's verdict on it as well.
- A line back that would pass the margin gives way to the edition's word for the overview, then to none; a plate is
  never refused for it.
- The search keeps or rejects an assignment by one comparison, from which its early stop is found, and that stop
  ends past 2^53; a test holds it against a count made one by one.
- A test holds the chooser's ranking where every candidate misreads, which no fixture shows since Archify 3.3.0.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: a line back gives way where it would pass the margin, and is never refused.

## Impact

Changed: `src/map/archify.mjs`, `src/map/explainer.mjs`, `src/map/guide.mjs`, `src/map/choice.mjs`, `src/build.mjs`,
`src/overview/house.typ`, `src/layout/channel-solver/search.mjs`, `src/layout/measure.mjs`, six test files and
`CHANGELOG.md`. No delivered byte of a model built before changes; a model 0.18.0 refused for its line back builds.
Most findings are of `performance`'s Changes; the line back is of `edition-map`'s.

Queue: `performance`.
