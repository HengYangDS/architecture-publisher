## 1. The derivation and its tests

- [x] 1.1 Make `src/model/normalize.mjs` derive `repository.browse` from `repository.url` when the model declares none and the address is an `https` address on GitHub or GitLab that names a repository and nothing more, and describe it beside the template in `src/model/schema.json`. Done when `tests/model-input.test.mjs` passes with its new test of the derivation's cases. Done in the lane; the check of its task passes.
- [x] 1.2 Extend `tests/one-source.test.mjs` with the search for a bundled example, fixture or test that declares the template its address implies, and its cases, and drop that template from `tests/edition-class.test.mjs`. Done when, with `tests/edition-class.test.mjs` unchanged, the search names it alone, and with it changed `tests/one-source.test.mjs` and `tests/edition-class.test.mjs` pass. Done in the lane; the check of its task passes.

## 2. Nothing published changes

- [x] 2.1 Build at the lane's base and at its head, with one `SOURCE_DATE_EPOCH` and the default widths: the bundled `examples/big-bank`, and the publications' `architecture-publisher` work in both its languages with its checkout at its pin. Done when `archpub compare` reports each of the three pairs identical. compare big-bank exit 0: identical; manifest same compare architecture-publisher-zh exit 0: identical; manifest same compare architecture-publisher-en exit 0: identical; manifest same END identical
- [x] 2.2 Run the test files the Change reaches (`affected-tests.py`): the light ones one at a time, among them `model-input`, `edition-class`, `edition-contents` and `edition-index`, and those on the host's heavy list, among them `edition-plates`, `delivery` and `delivery-data`, under one ticket of the host's queue. Done when every one passes, none changed but those 1.1 and 1.2 name. The light files the Change reaches pass (END heavy exit 0 ℹ pass 100 ℹ fail 0 in 143 s), and the heavy ones under one ticket.

## 3. Records

- [x] 3.1 Say in `docs/reference/model.md` which addresses imply the template (the operations reference reads the normalized template, which holds the derived one, and stays as it was), and record the Change under `Unreleased`, `Added`, in `CHANGELOG.md`. Done when `npm run check:static` passes. Done in the lane; the check of its task passes.

## 4. Release 0.17.0

- [x] 4.1 Record release 0.17.0 with this Change, the last of the train that publishes `dev`: date the `Unreleased` notes in `CHANGELOG.md` on the day of the lane's work, link the release, and move `VERSION` to 0.17.0 with the version tool's projections. Done when `node tools/release/version.mjs --check` passes. `VERSION` is 0.17.0, `node tools/release/version.mjs --check` passes, and the changelog dates 0.17.0 and links it.
