## 1. The model and the style

- [x] 1.1 Test first that a model naming `edition.marks` is refused at `/edition/marks` with `model_field_retired`, that the schema's `edition` takes a palette alone, and that the edition's style holds its tokens and facts, with no marks, no warning and a record of palette, names, roles and bands. Done when the tests fail on the present source for those reasons. Observed: on the present source eight tests of `tests/edition-style.test.mjs`, `tests/style.test.mjs` and `tests/model-input.test.mjs` failed, each on `marks` still listed, kept or suggested, on `model_marks_unknown` where `model_field_retired` was expected, or on the style's `warnings`.
- [x] 1.2 Remove `marks` from `src/model/edition.mjs`, `src/model/schema.json` and `src/style.mjs`, and what read it in `src/build.mjs`. Done when the tests of 1.1 pass. Observed: the three files pass, 32 tests and none skipped.

## 2. The part

- [x] 2.1 Add `tests/poster-part.test.mjs`: a part that owns files is one card with its name, its strip, a caption of its kind's icon and label with its count, and its details; a part that owns no file has no strip and no count; a build without file facts draws no strip; a narrow card sets its count under its kind. Done when each case fails on the present source because the card or the region is missing. Observed: on the source before the part seven of the eight tests failed: three on no strip within an outline, one on a caption without its kind, one on no kind's label without a checkout, the caption that breaks on the missing `src/poster/part.mjs`, and the key on a kind's entry.
- [x] 2.2 Add `src/poster/part.mjs` (the part's boxes and its drawing) and have `src/poster/plate.mjs` and `src/poster/figure.mjs` measure and draw every part through it; `src/poster/strip.mjs` keeps the strip's measures, segments and key. Done when the tests of 2.1 pass. Observed: `tests/poster-part.test.mjs` passes, eight tests and none skipped.
- [ ] 2.3 Bring the tests of strips, plates, lines and pinned faces to the one part. Done when `npm test` passes with no test skipped that ran before. Not ticked: run alone, every test file that reaches a changed module passes except `tests/agent-skill.test.mjs`, which fails until 4.1 takes `marks_fallback` and `marks_need_files` out of the Skill; `npm test` has not been run.
- [x] 2.4 Test first that a compact card leaves its part's details out, that a plate with room sets them and records it, and that details a composition cannot hold at its step cost it neither wiring nor type; then compose every plate for compact cards and add details where the chosen composition holds them. Done when `tests/plate-details.test.mjs` fails on the present source and then passes. It failed on all three cases (a plate whose parts state four long details stood at 1 crossing and step 2, against 0 crossings and step 4 with nothing stated); it passes.
- [x] 2.5 Test first that a strip which a row of six held bare is held within its card at the two densest type steps; then set the edition's longest strip at 320 px and its shorter scale at 208 px. Done when `tests/strip-lengths.test.mjs` fails at 360 px and passes at 320 px. It failed at 360 px (a card of 360 px in a column of 328 px) and passes.

## 3. The key and the records

- [x] 3.1 Test first that a plate's key lists no kind, holds the strip's entries, the count, the hub, the boundary, the statuses and the ground of a part outside, and holds no strip entry without file facts. Done when the test fails on the present source. Observed: on the source before the part the key's test of `tests/poster-part.test.mjs` failed on a kind's entry in the key.
- [x] 3.2 Make `legendOf` in `src/poster/compose/plates.mjs` and the edition's record build that key, and remove `marks` from the manifest's `style`. Done when the tests of 3.1 and of the manifest pass. Observed: the key's test passes, and `tests/delivery.test.mjs` and `tests/facts-pin.test.mjs` pass with no `marks` in the manifest's `style`; `src/edition/record.mjs` needed no change, since it hands each key entry on as it is.
- [x] 3.3 Test first that a group's view keys its context neighbours with the words for a neighbour outside the group, and says "outside" only of a part outside the repository; then add the word in five languages and key the two apart in `legendOf`. Done when the test fails on the one word for both and then passes. It failed on `outside it` for a group's view with no part outside the repository; with the word `context` in five languages it passes.

## 4. Documents

- [ ] 4.1 Bring `docs/reference/model.md`, `docs/reference/operations.md`, `docs/reference/data.md`, the glossary, the README's plate and the Skill to the one part. Done when no tracked document outside `docs/research/` and the changelog's history names strip or card marks as a choice.
- [ ] 4.2 Record the change under `Unreleased` in `CHANGELOG.md` as breaking. Done when `npm run check:static` passes.

## 5. Acceptance on the works

- [ ] 5.1 Build the six works in Chinese and English with the lane's source. Done when all twelve editions build, with every refusal and warning listed.
- [ ] 5.2 Run the key check, the grounds check and the tidiness measure on every edition, and set the plates' measures (type step, crossings, route defects, missed balance gates, omitted summaries) beside those of `dev`. Done when the table stands in the lane's work directory with what worsened named.
- [ ] 5.3 Give the twelve editions to a reader of another origin with the product's sources, to check every sentence a plate prints against what the publisher measures. Done when the reader reports no finding, or each finding is corrected and read again.
- [ ] 5.4 Rehearse the archive of this Change without applying it. Done when the rehearsal accepts it.
