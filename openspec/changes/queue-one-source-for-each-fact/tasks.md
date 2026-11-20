## 1. The queue

- [ ] 1.1 Add to `docs/product-contract.md` the paragraph of 2026-11-20, the item `one-source` before `edition-map`, the item `derived-references` before `performance`, and to `page-figures` that a guide's diagram file states no repository and no pin. Done when `tests/evolution-queue.test.mjs` passes.

## 2. The research

- [ ] 2.1 Add `docs/research/one-source.md`, the census of 2026-11-20, and its row in `docs/research/README.md`. Done when `npm run check:static` passes.

## 3. Documents

- [ ] 3.1 Name the bundled icons in `docs/reference/model.md` without their version, and say where the version stands. Done when no tracked document but a research page states a version of the icons.
- [ ] 3.2 Record the change under `Unreleased` in `CHANGELOG.md`. Done when `npm run check:static` passes.

## 4. Release

- [ ] 4.1 Record 0.16.0 in `CHANGELOG.md`, `VERSION`, `package.json` and `package-lock.json`, beside the Changes on dev since 0.15.0 (each figure alone, the contents and the index, the edition's words, the Linux bootstrap). Done when `node tools/release/version.mjs --check` and `npm run check:static` pass.
