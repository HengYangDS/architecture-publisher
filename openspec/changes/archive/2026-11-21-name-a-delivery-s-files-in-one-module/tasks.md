## 1. The unit and its test

- [x] 1.1 Add `src/names.mjs`, which states a delivery's file names, the staged model's name and the Typst version and forms the names made from a value, and admit the unit `names`, importing no other unit, in `tests/module-boundaries.test.mjs`. Done when `tests/module-boundaries.test.mjs` passes. Done in the lane; the check of its task passes.
- [x] 1.2 Extend `tests/one-source.test.mjs` with the search for a name of the unit written again outside it, its cases, and the names the unit forms. Done when, on the unchanged modules, the search names `build`, `manifest`, `projection`, `delivery`, `pinned/reader`, `pinned/data`, `edition/record`, `edition/typeset`, `edition/colophon`, `edition/words`, `cli/report`, `cli/comparison`, `cli/run`, `poster/compose/plates` and `overview/typeset`, and the file's other six tests pass. Done in the lane; the check of its task passes.

## 2. The readers

- [x] 2.1 Move the page's, image's and figure's names and the default width from `src/edition/typeset.mjs` to the unit, and make `src/manifest.mjs` take them there. Done when `src/edition/typeset.mjs` exports none of them and `tests/module-boundaries.test.mjs` passes with the manifest's units `map` and `names`. Done in the lane; the check of its task passes.
- [x] 2.2 Make every other module that formed or restated a name take it from the unit, `src/projection.mjs` derive its refusal of an id from the names, and the colophon's note and the help of `accept` and `verify` take the names as arguments, with `tests/overview.test.mjs` and `tests/colophon.test.mjs` reading the names from the unit. Done when `tests/one-source.test.mjs` passes. Done in the lane; the check of its task passes.

## 3. No delivered byte changes

- [x] 3.1 Build at the lane's base and at its head, with one `SOURCE_DATE_EPOCH` and the default widths: the bundled `examples/big-bank`, and the publications' `architecture-publisher` work in both its languages with its checkout at its pin; accept both builds of `examples/big-bank` by one reviewer, unsigned; and print the help of `archpub accept` and `archpub verify` at both. Done when `archpub compare` reports each of the three pairs identical with no plate and no file listed, each pair's `manifest.json`, `colophon.pdf` and `acceptance.json` are the same bytes, and so is each help text. compare big-bank exit 0: identical; manifest same compare architecture-publisher-zh exit 0: identical; manifest same compare architecture-publisher-en exit 0: identical; manifest same big-bank colophon.pdf same big-bank acceptance.json same help of accept same help of verify same END identical 
- [x] 3.2 Run the test files the Change reaches by their imports (`affected-tests.py`): the light ones one at a time, and `acceptance`, `cli-commands`, `delivery`, `delivery-compare`, `delivery-data`, `delivery-guide-files`, `edition-plates`, `guide`, `line-table`, `page-single-run` and `poster-part` under one ticket of the host's queue. Done when every one passes, none changed but `one-source`, `module-boundaries` and the import of a name in `overview` and `colophon`. The light files the Change reaches pass (END heavy exit 0 ℹ pass 75 ℹ fail 0 in 123 s), and the heavy ones under one ticket.

## 4. Records

- [x] 4.1 Name the unit `names` and its searches where `docs/reference/development.md` names the units, with `names` among the units `pinned` imports, and record the Change under `Unreleased` in `CHANGELOG.md` as changing no delivered byte. Done when `npm run check:static` passes. Done in the lane; the check of its task passes.
