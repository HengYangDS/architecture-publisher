## 1. The tokens and their test

- [x] 1.1 Add the groups `text`, `baselines`, `summary`, `mark` and `weights` to `src/house.json`, each measure in the unit and the digits of its literal in the class. Done when the test of the measures' values in `tests/one-source.test.mjs` passes. Done in the lane; the check of its task passes.
- [x] 1.2 Extend `tests/one-source.test.mjs` with the search for a measure of the class written again as a number, the test that the Typst reads the tokens once, and their cases. Done when, on the unchanged readers, the search names `edition/colophon.typ`, `overview/drawn.typ`, `overview/house.typ`, `poster/compose/plates.mjs` and `poster/part.mjs`, the reading test finds `edition/colophon.typ` beside `overview/house.typ`, and the file's other thirteen tests pass. Done in the lane; the check of its task passes.

## 2. The readers

- [x] 2.1 Make `src/overview/house.typ` read the measures once and set each from them, its imprint from `edition.rule` and `edition.foot`, and `src/overview/drawn.typ` and `src/edition/colophon.typ` take them and the tokens from the class, none of the three longer than it was. Done when the search of 1.2 names no Typst file and the reading test passes. Done in the lane; the check of its task passes.
- [x] 2.2 Make the engine's summary above a figure, a caption's mark and the overview check's ring stroke read the tokens through `src/house.mjs`. Done when `tests/one-source.test.mjs` passes. Done in the lane; the check of its task passes.

## 3. Only the class's two digests change

- [x] 3.1 Build at the lane's base and at its head, with one `SOURCE_DATE_EPOCH` and the default widths: the bundled `examples/big-bank`, and the publications' `architecture-publisher` work in both its languages with its checkout at its pin. Done when `archpub compare` lists no plate and no file but `manifest.json` for each of the three pairs, and each pair's two manifests, parsed, are equal once `edition.house` and `overview.house` are set aside, and differ in both. compare big-bank: as allowed: plates 0, files ['manifest.json'], manifest fields ['edition.house'] compare architecture-publisher-zh: as allowed: plates 0, files ['manifest.json'], manifest fields ['edition.house', 'overview.house'] compare architecture-publisher-en: as allowed: plates 0, files ['manifest.json'], manifest fields ['edition.house', 'overview.house'] END as allowed: only the two digests of the class's inputs differ 
- [x] 3.2 Accept the base's build of `examples/big-bank`, and a copy of the head's with the base's `manifest.json` in place of its own, by one reviewer, unsigned. Done when the copy's `colophon.pdf` and `acceptance.json` are the same bytes as the base's. big-bank colophon.pdf same big-bank acceptance.json same 
- [x] 3.3 Run the test files the Change reaches (`affected-tests.py`): the light ones one at a time, among them `overview`, `overview-drawn`, `overview-justified`, `colophon`, `edition-class`, `edition-key-line`, `edition-style`, `figures-alone`, `pinned-face`, `plate-captions` and `text-breaks`, and those on the host's heavy list, among them `acceptance`, `delivery`, `delivery-compare`, `delivery-data`, `edition-plates`, `line-table`, `page-single-run` and `poster-part`, under one ticket of the host's queue. Done when every one passes, none changed but `one-source`. The light files the Change reaches pass (END heavy exit 0 ℹ pass 75 ℹ fail 0 in 124 s), and the heavy ones under one ticket.

## 4. Records

- [x] 4.1 Describe the class's measures where `docs/reference/development.md` names the unit `house`, and record the Change under `Unreleased` in `CHANGELOG.md` with the two digests it changes. Done when `npm run check:static` passes. Done in the lane; the check of its task passes.
