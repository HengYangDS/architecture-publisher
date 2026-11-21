## 1. The table and its test

- [ ] 1.1 Add `src/shared.json` and make `src/names.mjs` read it, read-only, in place of its staged model, its delivered model's name and the beginning of a plate's key, and form a plate's staged figure from it. Done when `tests/module-boundaries.test.mjs` passes with `names` importing no other unit.
- [ ] 1.2 Extend `tests/one-source.test.mjs` with the search for a name of the table written again in the JavaScript or the Typst, the test of the table's own name, their cases and the table's values, moving the search for a plate's key into it. Done when, on the unchanged readers, the search names `edition/colophon.mjs`, `edition/colophon.typ`, `edition/record.mjs`, `edition/typeset.mjs`, `overview/drawn.typ`, `overview/house.typ` and `overview/typeset.mjs`, the test of the table's name finds `src/names.mjs` alone, and the file's other nine tests pass.

## 2. The readers

- [ ] 2.1 Make the overview's staging copy the table beside the class by its own name and cover it in the class's digest, and the overview's entry and query, the edition's staging, entries and query, the colophon's record and query and the edition's record of a plate's figure take each name from the table. Done when the search of 1.2 names no `.mjs` file.
- [ ] 2.2 Make `src/overview/house.typ` read the table and set its three labels, read its staged files and attach the model from it, and `src/overview/drawn.typ` and `src/edition/colophon.typ` take the table from the class, none of the three longer than it was. Done when `tests/one-source.test.mjs` passes.

## 3. Only the class's two digests change

- [ ] 3.1 Build at the lane's base and at its head, with one `SOURCE_DATE_EPOCH` and the default widths: the bundled `examples/big-bank`, and the publications' `architecture-publisher` work in both its languages with its checkout at its pin. Done when `archpub compare` lists no plate and no file but `manifest.json` for each of the three pairs, and each pair's two manifests, parsed, are equal once `edition.house` and `overview.house` are set aside, and differ in both.
- [ ] 3.2 Accept the base's build of `examples/big-bank`, and a copy of the head's with the base's `manifest.json` in place of its own, by one reviewer, unsigned. Done when the copy's `colophon.pdf` and `acceptance.json` are the same bytes as the base's.
- [ ] 3.3 Run the test files the Change reaches (`affected-tests.py`): the light ones one at a time, among them `overview`, `colophon`, `edition-class`, `edition-front`, `edition-contents`, `edition-index`, `edition-key-line`, `figures-alone` and `pinned-face`, and those on the host's heavy list, among them `acceptance`, `delivery`, `delivery-compare`, `delivery-data`, `edition-plates`, `line-table`, `page-single-run` and `poster-part`, under one ticket of the host's queue. Done when every one passes, none changed but `one-source`.

## 4. Records

- [ ] 4.1 Describe the table where `docs/reference/development.md` names the units, and record the Change under `Unreleased` in `CHANGELOG.md` with the two digests it changes. Done when `npm run check:static` passes.
