## 1. Engine

- [ ] 1.1 Mark the locales written without spaces between words and, in an edition of one, report on each line of a part's details except a detail's last the measure it is spread to, when the line fills at least nine tenths of it, on strip and card plates; report the part's text block at that measure. Done when plate tests cover a Chinese strip plate and card plate, a loose line, a one-line detail, and an English plate that reports no measure.

## 2. Class

- [ ] 2.1 Set a run that names a measure spread to it, and refuse one Typst measures wider than its measure. Done when an edition test reads the spread line's width back from Typst as the measure and a wider run is refused with `edition_text_wider`.

## 3. Documents

- [ ] 3.1 Update the operations reference and CHANGELOG, and rebuild the README's plate from the publisher's own work at the current release. Done when the reference states the rule and the README's plate names the current release in its foot.

## 4. Verification

- [ ] 4.1 Build the Chinese editions of the six publications works and read every plate; measure how many detail lines are spread and how many stay flush left. Done when no spread line reads as loose and the counts are recorded here.
- [ ] 4.2 Run `npm run check` with the browser tests, the length gates and the tests in a Linux container. Done when all pass with no test output on standard error.
