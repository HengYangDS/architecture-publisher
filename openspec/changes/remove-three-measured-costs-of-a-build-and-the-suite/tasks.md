## 1. The check of a choice

- [x] 1.1 State the check row by row in a test fixture and test first: that `compatible` and `rowCrossings` answer as the fixture does on seeded questions with thousands of each answer, and that checking a choice reads the same number of verticals for a channel of one label row and of three. Done when the two tests of equal answers pass on the unchanged source and the count of reads fails there. The two tests of equal answers pass on the source before and after, with thousands of each answer; the count of reads fails before, 24 against 12, and passes.
- [x] 1.2 Rewrite the check to look at the two rows two choices stand on, without a list of rows. Done when the three tests pass and `tests/edition-plates.test.mjs` and `tests/pinned-face-bytes.test.mjs` pass unchanged. The three tests pass, and `tests/edition-plates.test.mjs` and `tests/pinned-face-bytes.test.mjs` pass unchanged.

## 2. The page in one run

- [x] 2.1 Test first, counted in the test's own process, that a build starts one run of Archify on its page and a check one, for a generated page and for a guide; that a page citing a file Archify will not cite is delivered without it after one validation; and that a guide Archify refuses ends a build with every finding. Done when the first two tests fail on the source before with two runs for a build. On the source before, a build of a generated page and of a guide starts two runs and the three tests fail; they pass.
- [x] 2.2 Prepare a build's page with its delivery, hold the file Archify wrote and write it; validate a refused page on its own; clone a guide's repository once. Done when the tests pass, the test of a guide whose checkout cannot be cloned asks `guidePage`, and the tests of generated pages, progress steps and deliveries pass unchanged. The tests pass; the tests of guides, generated pages, progress steps and a guide's delivered files pass, the first with its clone asked of `guidePage`.

## 3. Answers kept for a run

- [ ] 3.1 Test first that an answer is kept by what it answers wherever the document lies; that only a whole answer is kept or read; that a path that cannot be a directory refuses before Archify is asked, an answer that cannot be written is not kept, and nothing is kept without the variable; that the choice of a diagram reads kept answers and chooses the same; and that a build with answers kept delivers what a build without them delivers. Done when the tests fail on the source before for want of the function.
- [ ] 3.2 Keep Archify's whole answers to candidate diagrams in the directory `ARCHPUB_ARCHIFY_ANSWERS` names; have the suite's environment fixture name one directory for a run, and the test of the installed package name none. Done when the tests pass and the tests of the choice pass unchanged.
- [ ] 3.3 Describe the variable and its refusal `answers_unkept` in `docs/reference/operations.md` and the suite's use of it in `docs/reference/development.md`. Done when the documents' checks pass.

## 4. The queue and the record

- [x] 4.1 Add the item `performance` to the queue before `edition-map`, with its end and what it moves back, and write the research page `docs/research/build-and-suite-time.md` with the baseline of 2026-11-18 and each change's measurement, listed in the research home. Done when the queue's test and the documents' checks pass. The item stands before `edition-map` with its end, the page is written and listed, and the queue's test and the documents' checks pass.
- [ ] 4.2 Record the three changes under `Unreleased` in `CHANGELOG.md`. Done when the static checks pass.

## 5. Acceptance

- [ ] 5.1 Build the six works in both languages before and after the check's rewrite and compare each pair file by file; build two works with guides before and after the one-run page and compare them. Done when every pair is identical and the times stand in the research page.
- [ ] 5.2 Run the whole suite before and after the kept answers, the host to itself. Done when both runs' times and the tests that fail in each stand in the research page, and no test fails after that passed before.
- [ ] 5.3 Rehearse the archive of this Change without applying it. Done when the rehearsal accepts it.
