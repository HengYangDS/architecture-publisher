## 1. Stale pages and private links

- [x] 1.1 Move the boundary of what the product must not become into the product contract, remove `docs/research/`, and drop what the documents index, the contract's evolution note, the configuration reference and the format-selection policy said of it. Done when no tracked file links into `docs/research/` and the documents registry gate passes.
- [x] 1.2 Keep the alpha releases' headings in `CHANGELOG.md` in their bracketed form and remove their 25 link definitions. Done when the file names no private address and Markdown lint passes.
- [x] 1.3 Refuse a tracked text file that names a private IPv4 address. Done when a test lists the tracked files, passes on the tree, reports the line of a text that gains such an address, and the CI projection's assertion uses the same pattern.

## 2. Unused and mislaid files

- [x] 2.1 Remove the unused CI supply image recipe and the ignore line for `.superpowers/`, and name `.editorconfig` in the configuration reference. Done when `git grep` finds no reference to `.config/ci/supply` and the reference lists the file with its consumer.
- [x] 2.2 Remove the 36 Changes archived before 2026-10-30 from `openspec/changes/archive/`. Done when the archive holds only Changes archived since 0.4.0, no tracked file names a removed one, and OpenSpec validates the specifications.

## 3. Verification

- [x] 3.1 Record the change under `Unreleased` in `CHANGELOG.md` and run `npm run check` with the browser tests, and preview `ethos lane repair-paradigm`. Done when all pass with no test output on standard error and the preview reports the repository conforming.
