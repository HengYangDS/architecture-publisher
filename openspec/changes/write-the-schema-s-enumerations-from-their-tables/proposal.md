## Why

The model's schema restates three sets that the code keys its data by, held to it by tests: the categories and the
default category (`src/categories.json`), the built-in palettes (`src/house.json`), and the languages with the default
language (the keys of the publisher's words in `src/locale.mjs`, and `"en"` written beside them). The default palette
is written in the schema's description and in `src/model/edition.mjs`, and the overview's class names its own default
language. A check that refuses a difference afterwards is not a source; the queue item `derived-references` asks that
the schema and the loader's checks come from one statement. A track's name, besides, is held only to not being blank,
while the schema holds it to the rule of a text. The committee of 2026-11-26 decided the owners (recorded in the
research page). It lands after `write-the-top-level-fields-from-the-schema`.

Queue: `derived-references`.

## What Changes

- `tools/docs/references.mjs` writes the schema's categories and default category from the table of looks, its
  built-in palettes from the house's tokens, and its languages and default language from a new table of languages,
  `src/locales.json`; `npm run check:generated` refuses a schema that differs.
- `src/locale.mjs` reads the languages and the default language from that table, and the three tables of words
  keyed by language (the publisher's, the print edition's and the reader file's) are refused at import unless they
  hold exactly those languages in their order.
- The default palette is stated once, as the schema's `default` on `palette`, which the loader reads; the
  palette's description no longer lists the palettes.
- The overview drawn alone takes the model's language from the publisher, as the edition does, instead of
  naming a default of its own.
- **Breaking**: a track's name keeps to the rule of a text, which the loader states once: a name with a NUL
  character or with more than 2,000 characters (a character outside the Basic Multilingual Plane counts as two) is
  refused. The schema of 0.20.0 refused the longer name already; it refuses a NUL character from this release on.
- The tests that held the categories, the palettes and the languages to the schema go.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: the categories, the palettes and the languages stated once, in the tables that own them,
  and the schema written from them; the default palette stated once, in the schema.

## Impact

`src/locales.json` (new), `src/locale.mjs`, `src/edition/words.mjs`, `src/reader-words.mjs`, `src/kinds.mjs`,
`src/categories.json`, `src/model/schema.json`, `src/model/vocabulary.mjs`, `src/model/edition.mjs`,
`src/model/load.mjs`, `src/model/overview.mjs`, `src/overview/typeset.mjs`, `src/overview/house.typ`, `src/build.mjs`,
the reference writer and its test, `docs/reference/configuration.md`, the research page `docs/research/one-source.md`
and the tests of the languages, the palettes, the overview and its statement; `tests/category-looks.test.mjs` is
removed. A model whose stretch names a track with a NUL character or longer than a text is now refused, which the
contract's Evolution counts as breaking; every other model is accepted or refused as before. No page, image, figure
or file a delivery lists changes; the manifest's digests of the class's inputs, `edition.house` and `overview.house`,
change, since they cover the edited class.
