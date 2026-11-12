## 1. Palette

- [ ] 1.1 Resolve a palette: built-in names from `src/house.json` and custom roles derived in OKLab; refuse a custom palette that breaks a rule with `palette_rejected`, naming the role, measure and bound. Done when unit tests pass for all four built-ins, a derived custom palette and each rule's refusal.
- [ ] 1.2 Accept the optional `edition` object in the model (style, palette name or roles) with the nearest-name hint for unknown fields, and add it to `schema.json`. Done when model-input tests cover a valid object, an unknown style and an unknown field.

## 2. File facts

- [ ] 2.1 Record each bound file's size and the date of its last change at the pin with one history read, refusing `source_history_unavailable` when history is missing. Done when binding tests show sizes and dates on a fixture repository and the refusal on a shallow one.
- [ ] 2.2 Choose an edition's age bands from the span ladder. Done when tests cover thirds, ties and a work whose files all changed on one day.

## 3. Drawing

- [ ] 3.1 Thread the resolved palette through the figure, the balance measure, the staged `house.json` and the class's colour names. Done when `cards` with `forest` builds byte-identical plates for the archpub fixture and a `cards` plate in `indigo` uses its colours.
- [ ] 3.2 Draw `bolts`: box metrics, woven strips, empty strips, captions and leading detail, line weights and the hub. Done when plate tests assert segment shares, thickness scale, the empty strip and the hub's lines, and every fixture view composes under the existing gates.
- [ ] 3.3 Set each `bolts` plate's key: age bands with spans, thickness, line weight, the hub and statuses shown. Done when an edition test finds exactly the marks a plate shows, in both languages.
- [ ] 3.4 Apply the defaults and the fallback: `bolts` and `indigo`; `cards` with `style_fallback` without file facts; `style_needs_files` when `bolts` is named. Done when build tests cover all three.

## 4. Record and documents

- [ ] 4.1 Write manifest version 7: each cited file's `bytes` and `changed`, and the edition's `style`. Done when delivery tests read them back.
- [ ] 4.2 Update the model and operations references, the Skill, README images, CHANGELOG and the house class notes. Done when the docs name every new field, rule, refusal and warning.

## 5. Verification

- [ ] 5.1 Build the six publications works in both languages with the defaults and inspect every plate. Done when all builds pass and no plate is refused or out of balance.
- [ ] 5.2 Run `npm run check` and the full test suite. Done when both pass.
