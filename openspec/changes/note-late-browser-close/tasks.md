## 1. Close

- [x] 1.1 Add a regression test whose browser never closes; verify it fails under the current close hook with "test timed out after 100ms", as the 0.8.0 job did. Under the old hook the subtest failed with `test timed out after 100ms` and left no note.
- [x] 1.2 Bound the close after each browser test at the two-minute limit, noting lateness and failing on errors; verify the regression and `tests/map-browser.test.mjs` pass. The regression passes with its note; `tests/map-browser.test.mjs` passes without a browser and, with Chromium headless shell 1243, all 4 tests in 46 s.
- [x] 1.3 Record the fix in the changelog's Unreleased notes; verify Prettier and markdownlint pass. Recorded under Fixed in the Unreleased notes; Prettier and markdownlint pass.

## 2. Verification

- [ ] 2.1 Run `npm run check`; verify it passes at or above the coverage floors.
