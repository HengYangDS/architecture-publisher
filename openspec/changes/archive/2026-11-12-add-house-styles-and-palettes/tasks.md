## 1. Model and palettes

- [x] 1.1 Resolve a palette from the built-ins 靛蓝 `indigo`, 柿漆 `persimmon`, 松烟 `soot` and 铜绿 `patina`, or from custom roles derived in OKLab, refusing a custom palette that breaks a rule, the hue rule included, with `model_palette_rejected`. `tests/edition-style.test.mjs` covers each built-in, a derived palette and each rule's refusal.
- [x] 1.2 Accept the optional `edition` object (`marks`, `palette`) with the nearest-name hint for unknown fields, in the loader and `schema.json`. `tests/model-input.test.mjs` and `tests/edition-style.test.mjs` cover a valid object, unknown marks and an unknown field.

## 2. File facts

- [x] 2.1 Record each bound file's size and the date of its last change at the pin with one history read, refusing `source_history_unavailable` when history is missing. `tests/source-binding.test.mjs` covers dated history, merges and the shallow refusal.
- [x] 2.2 Band every file's age by the same spans, a week and three months, counted back from the pin. `tests/age-bands.test.mjs` covers the spans and their edges.

## 3. Drawing

- [x] 3.1 Thread the resolved palette through the figure, the balance measure, the staged `house.json` and the class's colour names. A digest test holds cards in the house tokens to the 0.12 plates; `tests/poster-palette-key.test.mjs` checks a cards plate in indigo.
- [x] 3.2 Draw strips: length proportional to bytes on one edition scale, one thickness, segments by file share and age, empty parts dashed, one tick per cited file, the hub in the oldest dye, relation labels in the regular weight. `tests/poster-strip.test.mjs` asserts the scale, shares, ticks, hub and a strip part refused by the gates as a card would be; 5.1 composes the real works.
- [x] 3.3 Set each strip plate's key: the age bands with the pin's date, a scale bar, the ticks, the hub and the statuses shown, in both languages, saying that files are cited. `tests/poster-palette-key.test.mjs` finds exactly the marks a plate shows; `tests/edition-key.test.mjs` carries them into the edition.
- [x] 3.4 Apply the defaults and fallback: `strip` and `indigo`; cards with `marks_fallback` without file facts; `marks_need_files` when `strip` is named. `tests/style.test.mjs` and `tests/cli-commands.test.mjs` cover all three.

## 4. Record and documents

- [x] 4.1 Write manifest version 7: each cited file's `bytes` and `changed`, and the edition's marks, palette, bands and pin date. `tests/delivery.test.mjs` reads them back.
- [x] 4.2 Update the model and operations references, the Skill and CHANGELOG. They name every new field, rule, refusal and warning.

## 5. Verification

- [x] 5.1 Build the six publications works in both languages with the defaults and inspect every plate. All twelve builds pass with 78 plates and none refused; every plate was read at 1:1 or on contact sheets, a strip past its boundary was found and fixed by 29d33bce, and each edition records its strip length (360 px, 240 px for Film Kit in English).
- [x] 5.2 Run `npm run check` and the full test suite. Both pass at 29d33bce: 303 tests, no test output on standard error.
