## 1. Measure first

- [x] 1.1 Build one work twice at one commit of the publisher on one platform with `SOURCE_DATE_EPOCH` set, and list every delivered file that differs and why. Done when the list is in the lane's run directory and the definition of the comparison in `docs/reference/command-line.md` names the files compared and the files left out, each with its cause.
- [x] 1.2 Establish why two pieces at the page's middle are drawn light, within half a working day. Done when the cause, with its smallest reproduction and the measurements that prove it, is written in the lane's run directory.
- [x] 1.3 Record the requirement count of `openspec/specs/poster-composition/spec.md` and the line counts of `src/poster` and `src/layout` at the lane's base. Done when the three numbers are written here. At the base 3541bc29: 32 requirements; `src/poster` 3367 lines in 11 files; `src/layout` 2823 lines.

## 2. Comparison

- [x] 2.1 Write tests for `archpub compare` in `tests/delivery-compare.test.mjs`, `tests/cli-usage.test.mjs` and `tests/cli-json-results.test.mjs`: one model built twice, a delivery with one plate's image replaced, a file in one delivery alone, a delivery edited after its build, a directory that is no delivery, an accepted copy, the report and `--json`. Done when they fail because the command does not exist.
- [x] 2.2 Build `archpub compare <delivery> <delivery>` under the reviewer's heading of the help, on the check of a delivery against its manifest in `src/delivery.mjs`, with its report composed in `src/cli/comparison.mjs`. Done when the tests of 2.1 pass, the command writes no file, and its exit status is 0 for identical and for different deliveries, 1 for a refused one and 2 for a usage error.

## 3. The table

- [x] 3.1 Write tests in `tests/line-table.test.mjs` that read the `lines` section of `src/house.json`: the six rows of the design's table and no other, each with its meaning, channel, value, question, tested mark and what the page does for it; no value of one channel under two meanings; the three image widths. Done when they fail because the section does not exist.
- [x] 3.2 Add the `lines` section and read every weight and pattern of a relation's line, of a status and of the boundary from it through `linesOf` in `src/poster/tokens.mjs`. Done when the tests of 3.1 pass and a search of `src/poster` finds no literal weight or dash for those lines.
- [x] 3.3 Write the test that builds a plate from a copy of the table in which every weight is one quarter heavier. Done when every relation's line and the boundary follow, and the test fails on the unchanged drawing.

## 4. Lines on plates

- [x] 4.1 Write the tests of the new requirement in `tests/poster-line-counts.test.mjs` and `tests/poster-strip.test.mjs`, in place of `tests/poster-strip-ticks.test.mjs`: a number for one, two and seven cited files and none for zero, no tick path, lines into the hub at the emphasis weight in the oldest dye, each ending inside an arrowhead 1.45 times as large, a planned relation into the hub heavy in its dashes, a retired one with its faint colour, ordinary weight and dots, and the warning `citation_count_touches`. Done when the tests fail on the unchanged drawing.
- [x] 4.2 Draw lines into the hub at the table's emphasis weight, in the oldest dye, each ending inside its larger arrowhead, in `src/poster/lines.mjs`. Done when the hub's tests of 4.1 pass.
- [x] 4.3 Write each relation's cited files as a number placed clear along its own line, warn `citation_count_touches` where no place is clear, and delete the ticks with their constants and names. Done when the remaining tests of 4.1 pass and a search of `src` finds `tick` only for an overview's station and a tier bracket's end.
- [x] 4.4 Warn `line_row_untested` once for each untested row that the plates of a build or a check draw, naming the plates. Done when a test reads the warning with its plates for a work that draws a planned relation, and none for a work that draws no such row.
- [x] 4.5 Write the test that moves the hub by changing one relation's target, and the test that adds one cited file, in `tests/line-facts.test.mjs`, each comparing the plate's shapes before and after with the layout held. Done when only the lines into the two parts change weight in the first and only one number changes in the second.
- [x] 4.6 Write the pairwise test in `tests/line-pairwise.test.mjs` on images 1920 px wide, in colour and reduced to grey, by the limits of `trials/screen/definitions.md`: the medians of ten upright lines, five of each weight, that stand once on each of the five places a line can take within a pixel, and the boundary's median dash and gap on a built plate. Done when emphasis against a relation and the boundary against a continuous line pass.
- [x] 4.7 Write `tests/line-row-weight.test.mjs`: twelve straight pieces of the rows, some on the figure's middle column and row, typeset by the edition's own path and read at 2400, 1920 and 960 px, and a census of sloped lines at 1012 and 1366 px. Done when it fails on the pieces at the middle and on a lost row at the two other widths.
- [x] 4.8 Place a plate's figure nested in a square canvas as wide as the page less a hair, at the page's origin, in `_plate` of `src/overview/house.typ`. Done when the test of 4.7 passes at the five widths, the edition still compiles to PDF/A-3a and PDF/UA-1, and its pages stay 1600 by 900 pt.

## 5. Key and words

- [x] 5.1 Change the key's tests in `tests/edition-key-line.test.mjs`, `tests/edition-key.test.mjs`, `tests/poster-palette-key.test.mjs`, `tests/line-table.test.mjs` and `tests/locale.test.mjs`: an entry for a row exactly when the figure draws it, the hub's sample as heavy as the plate's line, the count's sample a number at the plate's size, the boundary's sample at the plate's dash and gap, and the words of the two entries in the five languages. Done when they fail on the unchanged key.
- [x] 5.2 Draw the key's samples of the hub, the count and the boundary from the table in `src/poster/strip.mjs`, `src/poster/compose/plates.mjs` and `src/overview/house.typ`, and set the words in `src/locale.mjs` for `en`, `zh-CN`, `zh-TW`, `es` and `ko`. Done when the tests of 5.1 pass with every mark of a key centred on the capitals beside it.

## 6. Broken tables

- [x] 6.1 Add the five broken tables of the `value-table` specification as fixtures in `tests/fixtures/line-tables.mjs` and run each invariant's test on its table. Done when each test fails on its broken table with a message that names the row, and passes on the product's table.

## 7. Documents

- [x] 7.1 Add the reference page `docs/reference/lines.md` with a test that compares its table with `src/house.json`, link it from `docs/README.md` and `docs/reference/model.md`, and replace the ticks and the lines told by colour in `docs/reference/model.md` and `docs/reference/operations.md`. Done when the test passes, the lifecycle rows carry the mark "not yet tested by a work", and no document describes a tick.
- [x] 7.2 Describe `archpub compare` in `docs/reference/command-line.md` under "Comparison of two deliveries", with its conditions, its result and what it leaves out, add it to the command list of `docs/reference/operations.md`, and name it in the Skill's step for the reviewer. Done when `tests/agent-skill.test.mjs` passes and `npm run check:docs` reports no issue.
- [x] 7.3 Record the breaking changes, the two warnings, the command and the refusal's new wording under `Unreleased` in `CHANGELOG.md`. Done when the entries stand under Breaking, Added and Changed and name nothing this Change does not build.
- [x] 7.4 Tick `line-table` in the queue of `docs/product-contract.md`. Done when `tests/evolution-queue.test.mjs` passes with this Change active.

## 8. Verification

- [x] 8.1 Run the comparison's two acceptance cases on the publisher's own work in Chinese: the lane's head built twice; and the head against a scratch copy whose table gives the boundary another gap. Done when the first reports identical, the second lists exactly the plates whose figure draws the boundary and the print edition among the edition's files, and both results are in the lane's run directory.
- [x] 8.2 Commit the pass line of the figure-reading check to the publications before any reading: on plate 05 of the Chinese work on Architecture Publisher, hub items right at least 35 of 36, citation items at least 50 of 54, and the items that are the same task in every cell at least 51 of 54. Done when the commit precedes every reading of a rebuilt plate.
- [ ] 8.3 Have two holders read plate 05, rebuilt at 2400, 1920 and 960 px, three readings each, with the items of the baseline. Done when the readings are scored against the committed pass line, their record stands in the lane's run directory for the publications' `trials/screen/`, and every row whose items fall below its line is out of the table and named in a commit to the queue, or the owner has ruled otherwise and the ruling is quoted in the record.
- [x] 8.4 Write the reviewer's list before the reviewer is shown a plate: for each row of the table what to read on a plate and the fact of the build it is checked against, the pieces near the figure's middle, and the counts the build itself reported as touching. Done when the list and its SHA-256 are in the lane's run directory with a time before the reading of 8.6.
- [x] 8.5 Check the Chinese editions of the six works from the lane and count each one's warnings and missed gates beside the same work checked by 0.14.0; build the publisher's own. Done when the counts are in the lane's run directory and every new warning is named with its plate. The six comparisons against the base are not made: with the figure's new placement every plate's picture differs.
- [x] 8.6 Have a holder other than the author read plate 05 and every plate that carries a new warning against the list of 8.4, starting from what the build measures. Done when the record is in the lane's run directory for the publications, with a verdict on each item and the items not judged, and it states that it is no acceptance of form.
- [x] 8.7 Record the three counts of 1.3 at the lane's head beside the base's. Done when the numbers are written here and the rise of `src/poster` is stated as it is. At the lane's head: 32 requirements; `src/poster` 3545 lines in 12 files, 178 more than the base; `src/layout` 2823 lines.
- [x] 8.8 Compare the files this Change changed with the list in the proposal's Impact. Done when `git diff --name-only` against the lane's base names no file outside that list, `src/layout` and `src/map` among those untouched.
- [x] 8.9 Run `npm run check` with the browser tests. Done when it passes with no test skipped and standard error holds only npm's notices of the scripts it runs and the TOML formatter's two lines of information, as on `dev`. At the lane's head merged with `dev`: 398 tests passed, none skipped.
