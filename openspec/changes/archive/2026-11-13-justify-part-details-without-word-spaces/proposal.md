## Why

An edition justifies its readings, but the details of every part on a plate are set flush left on
the engine's lines. In a Chinese edition that leaves a ragged right edge inside each part, beside
readings whose edges are even. The owner asked that a Chinese edition justify them too. Chinese is
written without spaces between words, so a line spreads evenly between its characters; a language
that separates words by spaces would open wide gaps in so narrow a column, as measured before
0.12.0, and keeps its details flush left.

Spreading a line to a measure needs the width Typst sets it in, and the engine did not have it. It
measured a line that holds Han in the CJK face alone, letters and digits included, which is wider
than Typst sets it, so a mixed line broke about a character early. And it read no kerning from the
house faces: the font reader skips the extension lookups where Source Sans 3 and Source Serif 4
keep their pair adjustments. Typst kerns some pairs apart, so the released 0.13.1 refuses an
English edition whose detail reads `format: (json)` with `edition_text_wider`.

## What Changes

- In an edition whose language is written without spaces between words (`zh-CN`, `zh-TW`), a
  part's details are set as a justified paragraph is, on strip and card plates alike: they break
  wherever the script allows, inside a list's item as between two, each line is filled by the
  width Typst sets it in, and each line except a detail's last is spread to the details' measure.
  A last line takes the unit before it rather than hold one character alone.
  A line whose slack is more than a tenth of an em for each place it opens, as one broken before a
  long word in another script, stays flush left, so no line is set loose.
- In such an edition a strip part's counts are placed by the width Typst sets them in, so they end
  at the box's edge, where the part's spread lines end.
- The engine measures the house faces with their own pair kerning, read from each face's GPOS
  table, so a run of letters is as wide as Typst sets it. Text that holds pairs Typst kerns apart,
  as `(json)` or `package.json`, is no longer refused, and most labels measure a little narrower,
  in every language.
- A plate's run names the measure its line is spread to, and the house class sets it so with
  Typst's own justification, refusing a line wider than its measure.
- The README's plate is the one the current release builds from the publisher's published work;
  it showed a 0.11.0 plate, from before readings were justified.
- The install guide says that mise holds a release back for its first day and how to take the
  newest at once, and names the Homebrew formula and the npm package.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: part details are justified in a language written without word spaces.
- `poster-composition`: figure text is measured with the house faces' kerning, and a run names the
  measure its line is spread to.

## Impact

`src/locale.mjs` (which languages are written without word spaces), `src/breaks.mjs` (where a
justified line opens), `src/poster/kerning.mjs` (a face's pair kerning), `src/poster/` (the width
Typst sets a line in, and the runs of a part's details), `src/overview/house.typ` (setting a
spread line), their tests, the operations reference, the install guide, the README and
`docs/images/`. Every edition is measured anew, since kerning changes the width of most runs of
letters; a part's box may move by a step of the grid, and a plate that only just could not take a
larger type step or a wider row may be composed anew. Chinese editions' plates change wherever a
detail takes more than one line.
