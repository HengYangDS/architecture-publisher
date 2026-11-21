## 1. The unit and its test

- [x] 1.1 Add `src/house.mjs`, which states the address of `src/house.json` and reads it once into one read-only object, and admit the unit `house`, importing no other unit, in `tests/module-boundaries.test.mjs`. Done when `tests/module-boundaries.test.mjs` passes. `tests/module-boundaries.test.mjs` passes in the lane.
- [x] 1.2 Add `tests/one-source.test.mjs`: a search for a module that addresses the file itself, a search for a face's name or a page's measure restated, the cases of both, and the tokens' freezing. Done when, on the unchanged readers, the searches name `src/poster/tokens.mjs`, `src/model/edition.mjs` and `src/overview/typeset.mjs` as addressing the file and `src/edition/typeset.mjs`, `src/overview/checks.mjs`, `src/poster/text.mjs` and `src/overview/glyphs.mjs` as restating a value, and the file's other two tests pass. On the unchanged readers the searches named the seven modules (the maintainer's rehearsal, `one-source-1/REPORT.md`); in the lane the file passes.

## 2. The readers

- [x] 2.1 Make `src/poster/tokens.mjs`, `src/model/edition.mjs`, `src/projection.mjs`, `src/poster/part.mjs`, `src/poster/compose/plates.mjs` and the six tests that read the tokens take them from the unit, and `src/overview/typeset.mjs` stage the file from the address the unit states. Done when the first search of `tests/one-source.test.mjs` passes and `src/poster/tokens.mjs` exports no `HOUSE`. The first search passes and `src/poster/tokens.mjs` exports no `HOUSE`.
- [x] 2.2 Read the page's width in `src/edition/typeset.mjs`, the live area's margins in `src/overview/checks.mjs` without its unused width and height, and the faces' names in `src/poster/text.mjs` and `src/overview/glyphs.mjs` from the tokens. Done when `tests/one-source.test.mjs` and `tests/module-boundaries.test.mjs` pass. Both files pass in the lane.

## 3. No delivered byte changes

- [x] 3.1 Build at dev and at the head, with one `SOURCE_DATE_EPOCH` and the default widths: the bundled `examples/big-bank`, and the publications' `architecture-publisher` work in both its languages with its checkout at its pin. Done when `archpub compare` reports each of the three pairs identical with no plate and no file listed, and each pair's `manifest.json` is the same bytes. compare big-bank exit 0: identical; manifest same compare architecture-publisher-zh exit 0: identical; manifest same compare architecture-publisher-en exit 0: identical; manifest same END identical 
- [x] 3.2 Run the test files the Change reaches, those that build or render under one ticket of the host's queue. Done when every one passes, the edition's, the overview's and the plates' unchanged but for the import line of six. The light files the Change reaches pass (END heavy exit 0 ℹ pass 100 ℹ fail 0 in 132 s), and the heavy ones under one ticket.

## 4. Records

- [x] 4.1 Name the unit `house` and `tests/one-source.test.mjs` where `docs/reference/development.md` names the units, and record the Change under `Unreleased` in `CHANGELOG.md` as changing no delivered byte. Done when `npm run check:static` passes. `npm run check:static` passes.
