## 1. The tokens and their tests

- [ ] 1.1 Add `seal.cinnabar` and the rows' `keyDash` to `src/house.json`; remove `plate.x`, `plate.y`, `plate.width`, `plate.height`, `lines.widths`, `lines.levels` and each row's `channel`, `question` and `page`; and derive the body's box in `src/house.mjs`. Done when the test of the values in `tests/one-source-tokens.test.mjs` passes.
- [ ] 1.2 Write `tests/one-source-tokens.test.mjs` with the first part's searches moved from `tests/one-source.test.mjs`, the search for the cinnabar, the body's box and the key's dashes, the reader test and their cases, both files reading the source through `tests/fixtures/source.mjs`. Done when, on the unchanged readers, the search names `src/edition/colophon.typ`, `src/model/edition.mjs` and `src/overview/house.typ`, the reader test names `seal`, `seal.cinnabar` and the two rows' `keyDash`, the file's five other tests pass, and `tests/one-source.test.mjs` passes its thirteen.

## 2. The readers

- [ ] 2.1 Make the colophon page and the palette check read the cinnabar, and the class's key read a status's dash from its row, `src/overview/house.typ` no longer than it was. Done when `tests/one-source-tokens.test.mjs` passes.
- [ ] 2.2 Make the plates' composition, a plate's frame and the tests `line-row-weight`, `line-pairwise` and `strip-lengths` read the body's box from `src/house.mjs`, `pinned-face` and `pinned-face-bytes` take the tokens from it, and let `pinned` import `house` in `tests/module-boundaries.test.mjs`. Done when `module-boundaries`, `strip-lengths` and `pinned-face` pass.
- [ ] 2.3 Move the trials' widths and levels to `tests/fixtures/line-tables.mjs`, derive a row's channel there, and make `tests/line-table.test.mjs` read a row's question and the page's expression from `docs/reference/lines.md`. Done when no test reads `widths`, `levels`, `channel`, `question` or `page` from the tokens.

## 3. Only the class's two digests change

- [ ] 3.1 Build at the lane's base and at its head, with one `SOURCE_DATE_EPOCH` and the default widths: the bundled `examples/big-bank`, and the publications' `architecture-publisher` work in both its languages with its checkout at its pin. Done when `archpub compare` lists no plate and no file but `manifest.json` for each of the three pairs, and each pair's two manifests, parsed, are equal once `edition.house` and `overview.house` are set aside, and differ in both.
- [ ] 3.2 Accept the base's build of `examples/big-bank`, and a copy of the head's with the base's `manifest.json` in place of its own, by one reviewer, unsigned. Done when the copy's `colophon.pdf` and `acceptance.json` are the same bytes as the base's.
- [ ] 3.3 Run the test files the Change reaches (`affected-tests.py`): the light ones one at a time, among them `colophon`, `edition-class`, `edition-key-line`, `edition-style`, `figures-alone`, `line-pairwise`, `line-row-weight`, `module-boundaries`, `one-source`, `one-source-tokens`, `pinned-face`, `pinned-face-bytes`, `strip-lengths` and `style`, and those on the host's heavy list, among them `acceptance`, `delivery`, `delivery-compare`, `delivery-data`, `edition-plates`, `line-table`, `page-single-run` and `poster-part`, under one ticket of the host's queue. Done when every one passes.

## 4. Records

- [ ] 4.1 Say in `docs/reference/lines.md` what the table holds and what the page states, and in `docs/reference/development.md` what the tokens hold, the body's box and the new test file; record the Change under `Unreleased` in `CHANGELOG.md` with the two digests it changes. Done when `npm run check:static` passes.
