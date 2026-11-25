## Why

The queue item `parts-index`. On 2026-11-25 the owner asked whether a part on a plate of the PDF could show an
explanation on hover, or behind a small icon, and asked for the need beneath the ask. The need read from it: a
part's explanation one action away from the plate and back, which a talk on a screen can use; links work in every
PDF reader, hovers in few. A plate has no room for a part's details, and the index named each part with its plates
alone. Of three forms the owner chose the index widened, a short paragraph a part, and ruled out a page a part; a
sample of two works was built, and the Change was left to the maintainer.

## What Changes

- Each part of the edition's index is a short paragraph: its name, kind and the numbers of the plates that draw it;
  the details the model states; the parts it reaches and those that reach it by the relations' labels, each the
  other part's name a link to its paragraph; and the paths it claims, each a link to the source at the pin, at most
  the house's `indexPaths` (24) and the rest counted.
- A card's title on a plate links to its part's paragraph in the index, no longer to its first file; the reading
  note says so in each language.
- A paragraph stands whole in one column; one taller than a page's body is refused (`edition_index_too_long`).
- The contract's queue gains `parts-index` after `reader-file`, and marks it finished.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: the index a paragraph a part; card titles link to it.

## Impact

Changed: `src/edition/record.mjs`, `src/edition/words.mjs`, `src/overview/house.typ`, `src/house.json`; the
tests of the index, the class, the contents and the facts layer; `docs/product-contract.md`,
`docs/reference/operations.md`, `docs/reference/refusals.md`, `docs/research/contents-and-index.md` and
`CHANGELOG.md`. Every edition's index changes, and its pages grow: in the sample, AIGW Client's from one to two,
ETHOS's from two to four.

Queue: `parts-index`.
