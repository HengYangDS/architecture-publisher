## 1. Tests first

- [ ] 1.1 Extend `tests/evolution-queue.test.mjs` with the cases of a queue item's Change whose design names no research page and one that names a page the repository lacks; watch them fail; then make `tests/fixtures/evolution-queue.mjs` pass them. Done when the file's tests pass and fail again with the rule removed.
- [ ] 1.2 Add `tests/model-states-no-position.test.mjs`. Done when it passes on the tracked schema and fails when a property `x` is added to `src/model/schema.json`, which is then removed.

## 2. Research pages

- [ ] 2.1 Add `docs/research/figure-language.md`, `docs/research/static-architecture-pictures.md` and `docs/research/figure-prototypes.md` with the 26 pictures of `docs/research/figures/`. Done when every quotation of the owner in them is found in the ledger with its time, and `npm run check:docs` and `npm run check:format` pass.
- [ ] 2.2 Name the three pages in the index `docs/research/README.md` and correct its list of what is not yet written up. Done when the index links each page.

## 3. The contract and the references

- [ ] 3.1 State in the Product section of `docs/product-contract.md` that no input says where anything stands, and name the overview composition as the one that does. Done when the section says until when it stays.
- [ ] 3.2 Add the end state to the Evolution section, word `composable-parts`, `compositions` and `carriers` against it, and say that a queue item's design names a research page. Done when `tests/evolution-queue.test.mjs` still reads fourteen items, six of them finished.
- [ ] 3.3 Say in `docs/reference/model.md` that an overview composition is the one input that places marks, and in `docs/reference/development.md` what the two tests hold. Done when `npm run check:static` passes.

## 4. Record

- [ ] 4.1 Record the change under `Unreleased` in `CHANGELOG.md`. Done when `npm run check:static` passes.
- [ ] 4.2 Rehearse the archive of this Change without applying it. Done when the rehearsal accepts it.
