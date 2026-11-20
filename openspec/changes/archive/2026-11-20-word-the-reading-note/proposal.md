## Why

The Change `set-the-contents-and-the-index` wrote the reading note of the contents anew in five languages. Its
pages were read for their layout before it was archived, and its words only after: readers other than their
writer then found the Chinese note faulty, with two titles of two things joined in one sentence, a phrase that
reads two ways and "every part" reduced to "parts", and found that the Spanish and the Korean say plates that
belong to a part where the English says plates that draw it.

## What Changes

- The reading note in Simplified and in Traditional Chinese says each thing in a sentence of its own: the plate
  and its question, the card's title and the file, the index of every part, the page and its sources.
- The Spanish and the Korean note name the plates that draw a part, as the index's own line under its title does;
  the Spanish says that the page gives the source of each statement, and the Korean that a card's title leads to
  the file its content was read from.
- The Changelog's unreleased entry says that the reading note names the index, which may take more than the last
  page.

The English note does not change, and no layout does.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement states the note's sentences, so `.openspec.yaml` sets `skip_specs: true`.

## Impact

`src/edition/words.mjs`, the sentence `tests/edition-contents.test.mjs` states, `docs/research/contents-and-index.md`
and the Changelog. An edition in one of the four languages prints other words in its reading note; no page count,
plate or digest of a figure changes.

Queue: `edition-map`.
