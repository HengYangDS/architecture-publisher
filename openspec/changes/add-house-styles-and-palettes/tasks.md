## 1. Palette

- [x] 1.1 Resolve a palette: built-in names from `src/house.json` and custom roles derived in OKLab; refuse a custom palette that breaks a rule with `model_palette_rejected`, naming the role, measure and bound. Done when unit tests pass for all four built-ins, a derived custom palette and each rule's refusal. `tests/edition-style.test.mjs` covers the four built-ins, a derived palette and each rule.
- [x] 1.2 Accept the optional `edition` object in the model (style, palette name or roles) with the nearest-name hint for unknown fields, and add it to `schema.json`. Done when model-input tests cover a valid object, an unknown style and an unknown field. `tests/model-input.test.mjs` and `tests/edition-style.test.mjs` cover the object, an unknown style and the nearest-field hint.

## 2. File facts

- [x] 2.1 Record each bound file's size and the date of its last change at the pin with one history read, refusing `source_history_unavailable` when history is missing. Done when binding tests show sizes and dates on a fixture repository and the refusal on a shallow one. `tests/source-binding.test.mjs` covers dated history, merges and the shallow refusal.
- [x] 2.2 Choose an edition's age bands from the span ladder. Done when tests cover thirds, ties and a work whose files all changed on one day. `tests/age-bands.test.mjs` covers thirds, ties, one day and the band edges.

## 3. Drawing

- [x] 3.1 Thread the resolved palette through the figure, the balance measure, the staged `house.json` and the class's colour names. Done when `cards` with `forest` builds byte-identical plates for the archpub fixture and a `cards` plate in `indigo` uses its colours. A digest test holds cards with the house tokens to the 0.12 plates; `tests/poster-palette-key.test.mjs` checks an indigo cards plate.
- [x] 3.2 Draw `bolts`: box metrics, woven strips, empty strips, captions and leading detail, line weights and the hub. Done when plate tests assert segment shares, thickness scale, the empty strip and the hub's lines, and every fixture view composes under the existing gates. `tests/poster-bolts.test.mjs` checks shares, thickness, the empty strip, weights and the hub.
- [x] 3.3 Set each `bolts` plate's key: age bands with spans, thickness, line weight, the hub and statuses shown. Done when an edition test finds exactly the marks a plate shows, in both languages. The key lists bands, thickness, weights, the hub and the boundary only when shown, in both languages.
- [x] 3.4 Apply the defaults and the fallback: `bolts` and `indigo`; `cards` with `style_fallback` without file facts; `style_needs_files` when `bolts` is named. Done when build tests cover all three. `tests/style.test.mjs`, `tests/delivery.test.mjs` and `tests/cli-commands.test.mjs` cover all three.

## 4. Record and documents

- [x] 4.1 Write manifest version 7: each cited file's `bytes` and `changed`, and the edition's `style`. Done when delivery tests read them back. `tests/delivery.test.mjs` reads version 7, the file facts and the style back.
- [x] 4.2 Update the model and operations references, the Skill, README images, CHANGELOG and the house class notes. Done when the docs name every new field, rule, refusal and warning. The model and operations references, the Skill and CHANGELOG name the fields, rules, refusals and warning.

## 5. Verification

- [x] 5.1 Build the six publications works in both languages with the defaults and inspect every plate. Done when all builds pass and no plate is refused or out of balance. All twelve editions of the six works build with no warning; the plates were inspected on contact sheets.
- [x] 5.2 Run `npm run check` and the full test suite. Done when both pass. `npm run check` passes and the packed package checks; the browser tests pass with the installed Chrome as `ARCHPUB_BROWSER_EXECUTABLE`.
