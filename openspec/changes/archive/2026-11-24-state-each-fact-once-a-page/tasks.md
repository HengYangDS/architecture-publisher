## 1. Once a page

- [x] 1.1 Drop the cover's top-right date and the edition overview's build line in `src/overview/house.typ`, and the unused words. Done when `tests/page-facts-once.test.mjs` fails without it on the overview and passes with it. `tests/page-facts-once.test.mjs` fails without it on the overview (the work directory's rehearsal) and passes in the lane.

## 2. The works

- [x] 2.1 Build the twelve editions from the publications' dev with the publisher as this Change leaves it. Done when every build passes. Twelve editions built (run/build12-work/run.log of the work directory).

## 3. Record

- [x] 3.1 Record the change in `CHANGELOG.md`. Done when `npm run check:static` passes. `CHANGELOG.md` records it; `npm run check:static` passes.
