## 1. The measure

- [x] 1.1 Give the route measure a limit and have the search pass the fewest defects that lose, in `src/layout/measure.mjs` and `src/layout/channel-solver/search.mjs`; add `tests/route-defects-limit.test.mjs`. Done when the test fails without the limit and passes with it, and the channel search's tests pass. `tests/route-defects-limit.test.mjs` fails without the limit (the work directory's rehearsal) and passes in the lane, with the channel search's tests.

## 2. The twelve works

- [x] 2.1 Build the twelve published works with the base and with the head under one ticket and compare each pair file by file, and build ETHOS's Chinese edition alone twice each. Done when all twelve pairs are identical and the head is faster than its base. Twelve of twelve pairs identical; ETHOS's Chinese edition 3.4 35.4 31.2 (s; run/measure-rehearsal/summary.txt of the work directory, on copies of the lane's base with and without this source).

## 3. The record

- [x] 3.1 Record the measure in `docs/research/build-and-suite-time.md` and the change under `Unreleased` in `CHANGELOG.md`. Done when `npm run check:static` passes. `npm run check:static` passes.
