## 1. Class

- [ ] 1.1 Set the key by its baseline at `edition.key`, 850 points, and centre every mark 0.36 em above it. Done when an edition test reads the rows of a strip plate's key from its picture and finds the label's ink, the band, the sample strip, the ticks, the hub's mark and the boundary centred within a pixel of one row, and the text's baseline on the same row for a card plate and a strip plate.
- [ ] 1.2 Draw the hub's mark as the plate's line and arrowhead from the weight and arrow its entry carries. Done when the engine's key test finds both on the entry and the edition test finds the mark's ink as tall as the arrowhead.
- [ ] 1.3 Break a key longer than the body is wide between two entries onto a second line, the two 16 points apart about the key's line, and refuse one that needs a third, or holds an entry wider than the body, with `edition_key_too_long`. Done when an edition test reads two lines of ink ending on 842 and 858 points that start at the margin with an entry's mark and end within the body, and a key of sixty entries and a key of one entry 2500 points long are refused.

## 2. Words

- [ ] 2.1 Name the mark in the hub's entry in the five languages. Done when the locale test holds each language's words and a Chinese plate's key reads `深色连线：通向` before the hub's label.

## 3. Documents

- [ ] 3.1 State the key's baseline, its mid-line and the hub's mark in the operations reference and CHANGELOG. Done when the reference gives 850 points and the document stays within 500 non-blank lines.

## 4. Verification

- [ ] 4.1 Build the publisher's own edition in English and Chinese and read each plate's key; measure the rows of one strip plate's and one card plate's key. Measure how far the key reaches on every plate of the twelve editions of the six works. Done when the measured centres agree, every key ends within the body and both are recorded here.
- [ ] 4.2 Run `npm run check` with the browser tests. Done when it passes with no test output on standard error.

## 5. Release

- [ ] 5.1 Record 0.14.0 in `CHANGELOG.md`, `VERSION`, `package.json` and `package-lock.json`, beside the justified details and kerned measures already on dev. Done when `npm run check` passes at that version with the browser tests run.
