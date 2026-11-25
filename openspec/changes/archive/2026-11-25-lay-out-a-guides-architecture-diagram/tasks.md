## 1. The chooser

- [x] 1.1 Split the chooser into a view's candidates and one choice among candidates, and find a card's centre in Archify's layout where the document places nothing. Done when the generated page's tests pass unchanged. The generated page's tests pass with the split chooser: map-choice 17 and page-single-run 5 (under a ticket, 2026-11-25 12:18).

## 2. The guide

- [x] 2.1 Lay out a guide's architecture file that places nothing, draw it, and keep the author's file in the manifest. Done when the guide's test builds such a file, failing on the code before, and a placed file is drawn as written. A guide's placeless architecture file builds and the manifest keeps the author's file (tests/guide.test.mjs, refused on the code before with Archify's "must include pos"); a placed file, or one with an author's side, is drawn as written (tests/guide-figures.test.mjs).

## 3. The record

- [x] 3.1 Write `docs/research/page-figures.md` and say so in `CHANGELOG.md`. Done when `npm run check:static` passes. `npm run check:static` passes.
