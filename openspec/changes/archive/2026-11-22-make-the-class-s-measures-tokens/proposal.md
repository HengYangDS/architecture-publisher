## Why

On 2026-11-20 the owner made one source for each fact a hard requirement of everything built here. The census of
that day (`docs/research/one-source.md`, "The house's measures") found the house class repeating its measures as
numbers: the foot's rule and line, 866 and 886 points, three lines after the class reads them as `edition.rule`
and `edition.foot`; measures the Typst files repeat and no token holds (the summary's size and lead, a key mark's
gap, a ring's stroke, a rule's weight, the head's baselines, the pitch, a leading, the cover's label line); and
the colophon page reading the tokens a second time beside the class it imports. Drafting found the engine
repeating three of them in JavaScript: a view summary's size and pitch, a key mark's gap and middle, and the
ring's stroke in the overview's check. A measure changed in one place would leave the others setting the old one.

## What Changes

- `src/house.json` gains the class's measures, each in the unit and the digits of the literal it replaces: the
  pitch and the leading of text (`text`), the baselines of a page's head (`baselines`), a view summary's size and
  pitch on its plate (`summary`), a key mark's gap and middle (`mark`), and the weights of a rule, a hair rule and
  a ring (`weights`).
- The class reads them once, where it reads the tokens, and every literal of them reads the token; the overview's
  foot reads `edition.rule` and `edition.foot`. The drawing and the colophon page take them from the class they
  import, and the colophon page no longer reads the tokens itself.
- The engine's summary above a figure, a caption's icon set as the key sets a mark, and the overview's check of a
  ring's stroke read the tokens through `src/house.mjs`.
- `tests/one-source.test.mjs` refuses a measure of the class written again as a number, in the forms the census
  and the drafting found, and a second reading of the tokens in the Typst.
- This is the first part of the item's fourth Change. The cinnabar, the body's box and the tokens no file reads
  follow in a second Change, with their own readers.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement changes: every page, image, figure, edition, data and reader file, and every refusal, is what
it was.

## Impact

Changed: `src/house.json`, `src/overview/house.typ`, `src/overview/drawn.typ`, `src/edition/colophon.typ`,
`src/poster/compose/plates.mjs`, `src/poster/part.mjs`, `src/overview/checks.mjs`; `tests/one-source.test.mjs`;
`docs/reference/development.md` where it names the unit `house`, and `CHANGELOG.md`. Untouched: the model's
schema, the manifest's format, and every file a delivery lists. Each delivery's `manifest.json` changes in two
values, `edition.house` and `overview.house`: the digest of the class's inputs, which covers the edited class,
drawing and tokens.

Queue: `one-source`.
