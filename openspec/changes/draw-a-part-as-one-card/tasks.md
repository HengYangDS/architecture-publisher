## 1. The model and the style

- [ ] 1.1 Test first that a model naming `edition.marks` is refused at `/edition/marks` with `model_field_retired`, that the schema's `edition` takes a palette alone, and that the edition's style holds its tokens and facts, with no marks, no warning and a record of palette, names, roles and bands. Done when the tests fail on the present source for those reasons.
- [ ] 1.2 Remove `marks` from `src/model/edition.mjs`, `src/model/schema.json` and `src/style.mjs`, and what read it in `src/build.mjs`. Done when the tests of 1.1 pass.

## 2. The part

- [ ] 2.1 Add `tests/poster-part.test.mjs`: a part that owns files is one card with its name, its strip, a caption of its kind's icon and label with its count, and its details; a part that owns no file has no strip and no count; a build without file facts draws no strip; a narrow card sets its count under its kind. Done when each case fails on the present source because the card or the region is missing.
- [ ] 2.2 Add `src/poster/part.mjs` (the part's boxes and its drawing) and have `src/poster/plate.mjs` and `src/poster/figure.mjs` measure and draw every part through it; `src/poster/strip.mjs` keeps the strip's measures, segments and key. Done when the tests of 2.1 pass.
- [ ] 2.3 Bring the tests of strips, plates, lines and pinned faces to the one part. Done when `npm test` passes with no test skipped that ran before.

## 3. The key and the records

- [ ] 3.1 Test first that a plate's key lists no kind, holds the strip's entries, the count, the hub, the boundary, the statuses and the ground of a part outside, and holds no strip entry without file facts. Done when the test fails on the present source.
- [ ] 3.2 Make `legendOf` in `src/poster/compose/plates.mjs` and the edition's record build that key, and remove `marks` from the manifest's `style`. Done when the tests of 3.1 and of the manifest pass.

## 4. Documents

- [ ] 4.1 Bring `docs/reference/model.md`, `docs/reference/operations.md`, `docs/reference/data.md`, the glossary, the README's plate and the Skill to the one part. Done when no tracked document outside `docs/research/` and the changelog's history names strip or card marks as a choice.
- [ ] 4.2 Record the change under `Unreleased` in `CHANGELOG.md` as breaking. Done when `npm run check:static` passes.

## 5. Acceptance on the works

- [ ] 5.1 Build the six works in Chinese and English with the lane's source. Done when all twelve editions build, with every refusal and warning listed.
- [ ] 5.2 Run the key check, the grounds check and the tidiness measure on every edition, and set the plates' measures (type step, crossings, route defects, missed balance gates, omitted summaries) beside those of `dev`. Done when the table stands in the lane's work directory with what worsened named.
- [ ] 5.3 Give the twelve editions to a reader of another origin with the product's sources, to check every sentence a plate prints against what the publisher measures. Done when the reader reports no finding, or each finding is corrected and read again.
- [ ] 5.4 Rehearse the archive of this Change without applying it. Done when the rehearsal accepts it.
