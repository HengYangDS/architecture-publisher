## 1. The sizes

- [x] 1.1 Keep notes, texts and items at the text's size and pitch at either spacing in `src/overview/drawn.typ`, the spacings holding gaps only. Done when `tests/overview-drawn.test.mjs` passes, its test of the three sizes included. `tests/overview-drawn.test.mjs` passes in the lane, its test of the three sizes at either spacing included.

## 2. The works

- [x] 2.1 Build the twelve overviews' editions from the publications' dev with the publisher as this Change leaves it. Done when every build passes, each overview on one page. The twelve editions build from the publications' dev with the lane's publisher, each overview on one page (run/build12-work/run.log of the work directory).

## 3. Record

- [x] 3.1 Say in `docs/reference/operations.md` that the closer spacing keeps the sizes. Done when the reference says so in no more lines and `npm run check:static` passes. `docs/reference/operations.md` says so; `npm run check:static` passes.
- [x] 3.2 Record the change and its refusal in `CHANGELOG.md`. Done when the entry names `overview_too_tall` and `npm run check:static` passes. `CHANGELOG.md` records it with `overview_too_tall`; `npm run check:static` passes.
