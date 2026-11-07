## 1. Guards and failing tests

- [x] 1.1 Add the published ETHOS overview and proof views to the test corpus and test that the proof plane prints alone beside the overview; verify it passes with today's faces and that the spike's house faces refuse it. `tests/poster-faces.test.mjs` passes on `de4aa6f1` in 34 s; the spike's house faces refuse with `poster_unbalanced` (emptyShare 0.141, holes 0.458).
- [x] 1.2 Add failing tests for the house faces: figure text measured in Source Sans 3, its semibold for heavy text, and Han in Noto Sans CJK SC, and plates drawn in the house palette; verify they fail because the engine sets Noto faces and has no plates. Both tests in `tests/poster-faces.test.mjs` fail: a detail measures 746.28 px against Source Sans 3's 671.18 px, and `composePlates` is not exported.
- [x] 1.3 Add failing tests for plates: every AIGW plate fits 2256 by 1071 px, with no paper and no text in its shapes, its key names the kinds it shows, and the ETHOS proof plane is a plate of its own; verify they fail because no plate composer exists. The three tests in `tests/edition-plates.test.mjs` fail on `composePlates is not exported`.

## 2. House tokens and faces

- [x] 2.1 Move the palette, faces and sizes to one token file, `src/house.json`, read by the Typst class and the engine; verify the overview tests pass with unchanged overview bytes. The class reads `src/house.json`, staged beside it, and the engine reads it; filmkit's `overview.svg` and `overview.png` built before and after are byte-identical, and the overview tests pass. The class digest now covers the class and its tokens.
- [x] 2.2 Measure figure text in Source Sans 3 and then Noto Sans CJK SC, draw figures in the house palette, drop Noto Sans from the font supply and give opentype.js a supply of its own; verify test 1.2's measuring test and the glyph refusal tests pass. The engine measures in Source Sans 3 and Noto Sans CJK SC through `renderers/opentype/supply`; Noto Sans left the font supply. The measuring, `Łódź` and CJK glyph-refusal tests pass; `npm test` passes 219 of 227, the eight failures being group 3's plate tests and the four poster tests in task 3.1.

## 3. Plates

- [ ] 3.1 Compose each view alone for the body field in the plate composition order across the five type steps, record each plate's measures and missed gates, and refuse `plate_unfittable`; and replace the poster tests the house faces changed: the ETHOS proof-plane guard, the browser-use and context-mode route counts and Big Bank's tier-label edges; verify tests 1.3 pass and every corpus model composes.
- [ ] 3.2 Draw each plate as an SVG of its shapes and a list of text runs, each title run naming its component; verify test 1.2's palette test passes and no plate SVG holds text.
- [ ] 3.3 Remove the page archetypes, grouping, heads, legends, notes, balance refusals and drafts; verify `npm test` passes and `npm run check:dead-code` reports nothing.

## 4. Model version 3

- [ ] 4.1 Accept `editors`, `license` and `repository.browse`, and refuse `attribution` and a template without both placeholders; verify by model-input tests for each refusal.
- [ ] 4.2 Migrate version 2 models, refusing `attribution_not_migrated` until editors are declared; verify by migration tests, and migrate the corpus and examples.

## 5. Print edition

- [ ] 5.1 Add the edition to the house class: title page, contents rows, the overview in place, plate heads, keys, live runs and links, the edition's facts beside the contents, the page frame, the prose settings and columns that fill their pages; verify by a class test that compiles a fixture edition, follows its links, extracts its card labels and fits eleven views' contents on one page.
- [ ] 5.2 Deliver `<model id>.pdf` with PDF/A-3a and PDF/UA-1, the model attached, the commit's date, `edition_text_wider` and `edition_title_too_long`; verify by delivery tests for page count, author, attachment bytes, refusals and two byte-identical builds.
- [ ] 5.3 Render `00-overview.png` and `NN-<view>.png` with Typst at each width and retire resvg, its Rust toolchain, the raster journey and their CI steps; verify by delivery tests and `npm run check:ci`.

## 6. Delivery

- [ ] 6.1 Take `--media edition,page`, `--png` for the edition's images and `--quality` for the page, and record manifest version 6; verify by delivery and command tests.

## 7. Documentation

- [ ] 7.1 Update the README, the product contract, the references and the changelog for the print edition, the plates, model version 3, the media and the file names; verify Prettier, markdownlint and Vale pass.

## 8. Verification

- [ ] 8.1 Run `npm run check`; verify it passes at or above the coverage floors.
- [ ] 8.2 Build the six Architecture Publications works from migrated copies; verify each builds a conforming edition, and send the editions to the owner for review.

## 9. Release

- [ ] 9.1 Set `VERSION` to 0.10.0 and write its projections, and date the changelog's Unreleased notes; verify `node tools/release/version.mjs --check` passes.
