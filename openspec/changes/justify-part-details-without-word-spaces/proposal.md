## Why

An edition justifies its readings, but the details of every part on a plate are set flush left on
the engine's lines. In a Chinese edition that leaves a ragged right edge inside each part, beside
readings whose edges are even. The owner asked that a Chinese edition justify them too. Chinese is
written without spaces between words, so a line spreads evenly between its characters; a language
that separates words by spaces would open wide gaps in so narrow a column, as measured before
0.12.0, and keeps its details flush left.

## What Changes

- In an edition whose language is written without spaces between words (`zh-CN`, `zh-TW`), each
  line of a part's details except a detail's last is spread to the details' measure, on strip and
  card plates alike. A line that fills less than nine tenths of the measure stays flush left, so no
  line is set loose.
- A plate's run names the measure its line is spread to, and the house class sets it so with
  Typst's own justification.
- The README's plate is rebuilt from the publisher's own work at the current release; it showed a
  0.11.0 plate, from before readings were justified.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: part details are justified in a language written without word spaces.
- `poster-composition`: a run names the measure its line is spread to.

## Impact

`src/locale.mjs` (which languages are written without word spaces), `src/poster/` (the runs of a
part's details), `src/overview/house.typ` (setting a spread line), their tests, the operations
reference and `docs/images/`. English, Spanish and Korean editions do not change. Chinese editions'
plates change wherever a detail takes more than one line.
