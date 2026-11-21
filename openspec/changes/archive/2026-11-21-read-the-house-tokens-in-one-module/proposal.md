## Why

On 2026-11-20 the owner made one source for each fact a hard requirement of everything built here. The census of
that day (`docs/research/one-source.md`) found the house tokens of `src/house.json` parsed twice by the JavaScript,
in `src/poster/tokens.mjs` and `src/model/edition.mjs`, and four of their values restated beside them: the page's
width in `src/edition/typeset.mjs`, the page and its right edge in `src/overview/checks.mjs`, and the faces' names
in `src/poster/text.mjs` and `src/overview/glyphs.mjs`. A change of a face or of the page would have to be made in
each place, and nothing would say where one was missed.

## What Changes

- A unit `house` (`src/house.mjs`) is the one module of the JavaScript that reads `src/house.json`. It states the
  file's address once and gives every reader the same tokens, read-only.
- `src/poster/tokens.mjs` and `src/model/edition.mjs` read the tokens from it; `src/overview/typeset.mjs` stages
  the file from the address it states; the modules and tests that took the tokens from the poster's module take
  them from the unit, and the poster's module no longer hands them out.
- A literal that restates a token reads the token: the page's width where the edition's images are rendered, the
  margins of the overview's live area, and the names of the house's sans, serif and Han faces where the publisher
  measures text and checks the overview's glyphs.
- `tests/one-source.test.mjs` refuses a module that reads the file again, or that restates a face's name or a
  page's measure that the house states. Later Changes of the item add their searches to it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement changes: every delivery, page, image, figure, manifest and refusal is what it was.

## Impact

New: `src/house.mjs` and `tests/one-source.test.mjs`. Changed: `src/poster/tokens.mjs`, `src/model/edition.mjs`,
`src/overview/typeset.mjs`, `src/overview/checks.mjs`, `src/overview/glyphs.mjs`, `src/poster/text.mjs`,
`src/poster/part.mjs`, `src/poster/compose/plates.mjs`, `src/edition/typeset.mjs`, `src/projection.mjs`;
`tests/module-boundaries.test.mjs`, and the import line of six tests that read the tokens
(`figures-alone`, `edition-index`, `edition-key-line`, `edition-contents`, `strip-lengths`, `edition-class`);
`docs/reference/development.md` where it names the units, and `CHANGELOG.md`. Untouched: `src/house.json`, every
Typst file, the model's schema, the manifest's format and every delivered byte. The manifest's `house` digest
covers the class, the drawing and the tokens' bytes, none of which this Change edits.

Queue: `one-source`.
