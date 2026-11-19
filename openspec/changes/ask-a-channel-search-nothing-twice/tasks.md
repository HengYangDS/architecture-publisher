## 1. A band's content

- [x] 1.1 Test first that one channel solved on three label rows serializes no more than on one. Done when the test fails on the unchanged source. On the unchanged source the solve on three rows serializes 100,047 times and on one row 165, and the test fails.
- [x] 1.2 Name what each option puts into each band once, before the search, and key a band's tracks by its wires' names. Done when the test passes and `tests/channel-conflicts.test.mjs`, `tests/channel-remember.test.mjs`, `tests/edition-plates.test.mjs` and `tests/pinned-face-bytes.test.mjs` pass unchanged. The test passes, and the four test files pass unchanged.

## 2. A pair of choices

- [ ] 2.1 Test first that one search reads a wire's label no more often than there are pairs of choices. Done when the test fails on the source of task 1.2.
- [ ] 2.2 Keep each pair's answer for the search, for each count of label rows. Done when the test passes and the four test files of task 1.2 pass unchanged.

## 3. A band's tracks

- [ ] 3.1 State the track assignment order by order in a fixture, and test first that the solver's own answers as it does on seeded bands and that laying six spans reads each span's ends once. Done when the second test fails on the source of task 2.2 and the first passes.
- [ ] 3.2 Work out what two spans are to one another once a pair, before the orders are tried, and list the orders once for each count of spans. Done when both tests pass and the four test files of task 1.2 pass unchanged.

## 4. The measure of a layout

- [ ] 4.1 Test first that measuring a layout of forty wires reads each point's coordinates a fixed number of times. Done when the test fails on the source of task 3.2.
- [ ] 4.2 Work out a segment's owner, reach and direction where the segment is made, and make nothing for a pair that makes no defect. Done when the test passes, the measure's six other tests pass unchanged and the four test files of task 1.2 pass unchanged.

## 5. The record

- [ ] 5.1 Enter the four changes' measurements in `docs/research/build-and-suite-time.md` and record them under `Unreleased` in `CHANGELOG.md`. Done when the static checks pass.

## 6. Acceptance

- [ ] 6.1 Build the six works in both languages before and after and compare each pair file by file. Done when all twelve pairs are identical and the summed times stand in the research page.
- [ ] 6.2 Rehearse the archive of this Change without applying it. Done when the rehearsal accepts it.
