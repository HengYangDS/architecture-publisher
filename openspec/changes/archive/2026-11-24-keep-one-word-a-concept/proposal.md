## Why

The holder promised on 2026-11-08 and 11-13 a table of the product's terms in each language with a check of
wording (ledger row 24). Read against the product's words on `dev`, one concept had two English words (the index's
"Parts", the page's "component"), Chinese wrote the pinned commit two ways (固定的提交, 固定提交), and Traditional
Chinese, Spanish and Korean still set a plate's key in more words than the change of 2026-11-19 left in English
and Simplified Chinese.

## What Changes

- `docs/reference/terms.md` is the product's vocabulary: each concept, its word in English, Simplified and
  Traditional Chinese and the keys of the product's words that use it. A test refuses a listed key that names its concept by another word.
- The English index and reading note say component ("Components and the plates that draw them"), as the page and
  the reader file say.
- Simplified and Traditional Chinese say 固定提交 for the pinned commit throughout.
- Traditional Chinese, Spanish and Korean label the key's boundary by its name alone, and the context as "outside
  this group" says it, without "for reference".

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `poster-composition`: the publisher names each concept of its term table by one word a language.

## Impact

Changed: `src/edition/words.mjs`, `src/locale.mjs`, `docs/reference/terms.md` (new), `docs/reference/README.md`,
`tests/terms.test.mjs` (new), `tests/edition-index.test.mjs`, `CHANGELOG.md`. An English edition's index, a Chinese
reader file and a Traditional Chinese, Spanish or Korean plate's key change their words. The cut of `edition-map` put
the term table last (`docs/research/edition-map.md`).

Queue: `edition-map`.
