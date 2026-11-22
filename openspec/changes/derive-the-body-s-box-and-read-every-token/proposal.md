## Why

On 2026-11-20 the owner made one source for each fact a hard requirement of everything built here. The census of
that day (`docs/research/one-source.md`, "The house's measures") found the seal's cinnabar, `#a93d31`, written in
the colophon page and in the palette check with no token; the body's box stated by four numbers of
`src/house.json` that follow from the page and the edition; the key's samples of planned and retired drawn as
Typst's dashed and dotted lines and not from the rows of `lines`; and tokens that no file of `src/` reads:
`plate.x`, `plate.y`, `lines.widths`, `lines.levels`, and each row's `channel`, `question` and `page`. A token no
file reads is still digested into every delivery's manifest, and who reads a token has been judged wrong once
already; the census says it is a search's question.

## What Changes

- `src/house.json` gains the seal's cinnabar, `seal.cinnabar`. The colophon page reads it through the class's one
  reading of the tokens, and the palette check through `src/house.mjs`.
- The tokens no longer state the body's box: `src/house.mjs` derives it from `page` and `edition`, in whole points,
  and the plates' composition, a plate's frame in the data and the tests read it there. The unit `pinned` may
  import `house` for it.
- The rows `planned` and `retired` of `lines` name the dash of their sample in the key, `keyDash`: Typst's `dashed`
  and `dotted`, which the class draws, and the class reads it there. Their `dash`, which the engine draws a planned
  or a retired line with, stays. No sample changes.
- `lines.widths`, `lines.levels` and each row's `channel`, `question` and `page` leave the tokens, since no file of
  `src/` reads them. The trials' widths and levels become the tests' record of them, a row's channel follows from
  its values, and a row's question and the page's expression of it stand in the line reference, which the line
  table's test holds.
- A new test file, `tests/one-source-tokens.test.mjs`, takes the first part's searches of the class's measures from
  `tests/one-source.test.mjs` and adds a search for the cinnabar's hexadecimal, the body's width and height as
  numbers and a dash's name in the Typst, and a test that every key of the tokens has a reader in `src/`.
- This is the second part of the item's fourth Change, after `make-the-class-s-measures-tokens`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement changes: every page, image, figure, edition, data and reader file, and every refusal, is what
it was.

## Impact

Changed: `src/house.json`, `src/house.mjs`, `src/overview/house.typ`, `src/edition/colophon.typ`,
`src/model/edition.mjs`, `src/poster/compose/plates.mjs`, `src/pinned/face.mjs`; the tests `one-source`,
`module-boundaries`, `line-table`, `line-row-weight`, `line-pairwise`, `strip-lengths`, `pinned-face` and
`pinned-face-bytes`, and the fixture `tests/fixtures/line-tables.mjs`; new, `tests/one-source-tokens.test.mjs` and
`tests/fixtures/source.mjs`; `docs/reference/lines.md`, `docs/reference/development.md` and `CHANGELOG.md`.
Untouched: the model's schema, the manifest's format, and every file a delivery lists. Each delivery's
`manifest.json` changes in two values, `edition.house` and `overview.house`: the digest of the class's inputs, which
covers the edited class and tokens.

Queue: `one-source`.
