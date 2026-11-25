## Why

The queue item `reader-file`: the reader file reads as well rendered in a Markdown viewer, for a reader at a screen,
as it does for one that parses it. Today it is written for a parser: its keys are English in every language (a
Chinese file holds `measured` a hundred times), and its last part is the guide's draft byte for byte, with every
`@source` line, `{#id}` anchor and empty citation link of its syntax (Film Kit's: 125, 11 and 152). The owner asked
on 2026-11-19 whether a person who reads it rendered reads it well; a committee of three (`docs/research/reader-file.md`)
chose to give the machine layer to the data file, which already holds every statement and fact.

## What Changes

- **Breaking:** the reader file is a document in the model's language: the words of its items, lines of facts and
  head are the language's; ids, paths, property names, values and units stay code, as the data holds them.
- **Breaking:** the guide follows as prose, written from Archify's own parse of the draft (run in a worker under
  the Permission Model, as the LikeC4 parser is): paragraphs, terms, tables, steps and quotes; a figure named by its
  title and file; citations as footnotes after one sentence naming the pin. A draft Archify refuses is refused
  (`guide_unparsed`), whichever media are built. The draft byte for byte leaves the delivery.
- The reader file is no longer parsed back for its facts; the build still reads its items' ids against the model
  (`reader_ids_differ`), and the manifest counts the statements from the data. The delivery format moves to 9.
- A check of the rendered form in the suite: one first-level heading, no skipped level, no line or mark of the
  guide's syntax, no link without text, no word of the old keys in another language outside code.
- Not yet: a figure's content (its parts, relations, events) as text; a later Change of the same item.
- The queue: `page-figures`, whose last step waits for an Archify release, moves after `reader-file`, which
  needs nothing from it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `reader-file`: one language, the guide as prose.

## Impact

Changed: `src/pinned/reader.mjs`, `src/pinned/invariants.mjs`, `src/projection.mjs`, `src/locale.mjs`,
`src/manifest.mjs`, `src/map/guide.mjs`; new `src/map/guide-parse.mjs`, `guide-parse-worker.mjs`, `guide-text.mjs`;
the tests of the reader, its words and form, the invariants, the deliveries and the re-pin worklist; `knip.toml`;
`docs/reference/data.md`, `operations.md`, `terms.md`, `docs/product-contract.md`, `docs/research/reader-file.md`
(new) and `CHANGELOG.md`. Every delivery's reader file changes.

Queue: `reader-file`.
