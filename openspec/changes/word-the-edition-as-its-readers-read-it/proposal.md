## Why

On 2026-11-20 four readers other than the writer read twelve editions whole, built at the head of the Change
`word-the-reading-note`. Of the words the product itself prints on every edition they made fifteen findings. A
fifth reader held each to the source: one was the text extraction's, five stand by design or were settled, and
nine are faults. Two of the nine are untrue sentences of the reading note: a card's title links to the first of
the part's files, not to "the file it was read from", and the page does not cite every claim, since five of the
six published works hold claims with no source.

## What Changes

- The reading note says that a card's title links to the first of its files, and that the claims' sources are on
  the page, in all five languages.
- A plate's key names what its age bands measure: "last changed before commit:", and in Chinese 「改动距提交：」.
- The cover calls the repository and its release the subject in every language: in Chinese 「对象」, the word
  the colophon already uses, where the cover said 「主题」, a topic.
- The foot joins a commit and its date with a point, as the cover and the overview's head do.
- The Chinese build line reads 「构建于提交」, where 「构建自提交」 read two ways.
- In English, a card's files stand under "Files", the overview says "Built from" as the index does, and the
  licence line names the edition as what is licensed, in every language.

No layout changes, and no word of a work.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement states these words, so `.openspec.yaml` sets `skip_specs: true`.

## Impact

`src/edition/words.mjs`, `src/locale.mjs`, the tests that state the old words, `docs/research/contents-and-index.md`
and the Changelog. An edition prints other words in these nine places; a figure whose key holds the label has
another digest, and no page count or plate changes.

Queue: `edition-map`.
