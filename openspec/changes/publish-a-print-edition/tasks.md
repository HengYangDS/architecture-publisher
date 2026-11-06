## 1. Guards and failing tests

- [ ] 1.1 Replace the ETHOS copy in the test corpus with the published model and add a test that its `proof` view composes as a poster and as an edition plate; verify it passes with today's faces.
- [ ] 1.2 Add failing tests for the house faces: Latin text measured in Source Sans 3, Han in Noto Sans CJK SC, and page and plate titles in Source Serif 4 Subhead; verify they fail because the engine sets Noto faces.
- [ ] 1.3 Add failing tests for edition plates: every plate of the AIGW and filmkit-sized models fits 2256 by 1101 px, draws no page text and reports the legend of the kinds it shows; verify they fail because no edition-plate composer exists.

## 2. House faces and palette

- [ ] 2.1 Move the palette, faces and sizes to one token file in the house supply, read by the Typst class and the engine; verify the overview tests still pass with unchanged overview bytes.
- [ ] 2.2 Set the engine's text and title chains from the house supply and its colours from the palette, and drop Noto Sans from the font supply; verify tests 1.2 pass and 1.1 still passes.

## 3. Edition plates

- [ ] 3.1 Compose each poster page's views for the body field without head, legend or notes, and report each plate's size, legend, composition and measures; verify tests 1.3 pass and every corpus model composes its plates.

## 4. Model version 3

- [ ] 4.1 Accept `editors` and `license` and refuse `attribution` in version 3; verify by model-input tests for each refusal.
- [ ] 4.2 Migrate version 2 models, refusing `attribution_not_migrated` until editors are declared; verify by migration tests, and migrate the corpus and examples.
- [ ] 4.3 Set the poster notes' source phrase from the editors in the model's language; verify the poster tests for English and Simplified Chinese notes.

## 5. Print edition

- [ ] 5.1 Add the edition function to the house class: title page, linked contents, the overview in place, plates with their head and legend, colophon and one foot; verify by an overview-class test that compiles a fixture edition.
- [ ] 5.2 Deliver `<model id>.pdf` from the build with PDF/A-3a and PDF/UA-1, the model attached and the commit's date; verify by delivery tests for page count, contents links, author, attachment bytes and two byte-identical builds.

## 6. Delivery

- [ ] 6.1 Name the static files `00-overview.png` and `NN-<views>.png`, stop delivering SVG, and record manifest version 6 with the house supply and the edition plates; verify by delivery tests.

## 7. Documentation

- [ ] 7.1 Update the README, the product contract, the references and the changelog for the print edition, the faces, model version 3 and the file names; verify Prettier, markdownlint and Vale pass.

## 8. Verification

- [ ] 8.1 Run `npm run check`; verify it passes at or above the coverage floors.
- [ ] 8.2 Build the six Architecture Publications works from migrated copies; verify each builds with a conforming print edition, and review the editions' pages.

## 9. Release

- [ ] 9.1 Set `VERSION` to 0.10.0 and write its projections, and date the changelog's Unreleased notes; verify `node tools/release/version.mjs --check` passes.
