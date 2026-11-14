## 1. Stale pages and private links

- [ ] 1.1 Move the boundary of what the product must not become into the product contract, remove `docs/research/`, and drop what the documents index, the contract's evolution note, the configuration reference and the format-selection policy said of it. Done when no tracked file links into `docs/research/` and the documents registry gate passes.
- [ ] 1.2 Keep the alpha releases' headings in `CHANGELOG.md` as plain text and remove their 25 link definitions. Done when the file names no private address and Markdown lint passes.
- [ ] 1.3 Refuse a tracked text file that names a private IPv4 address. Done when a test lists the tracked files, passes on the tree, fails when a scratch copy of a file gains such an address, and the CI projection's assertion uses the same pattern.

## 2. Unused and mislaid files

- [ ] 2.1 Remove the unused CI supply image recipe and the ignore line for `.superpowers/`, and name `.editorconfig` in the configuration reference. Done when `git grep` finds no reference to `.config/ci/supply` and the reference lists the file with its consumer.
- [ ] 2.2 Move the model migrator to `src/model/migrate.mjs`. Done when `archpub migrate` and its test pass from the new path and no file names the old one.

## 3. Verification

- [ ] 3.1 Record the change under `Unreleased` in `CHANGELOG.md` and run `npm run check` with the browser tests and the document, format and prose gates. Done when all pass with no test output on standard error.
