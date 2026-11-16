## Why

The owner asked for the whole picture of the edition's design on 2026-11-13, on 2026-11-14 and again on 2026-11-17,
and asked on that last day why the earlier discussion of lines, colour, styles and compositions had been lost and
why nothing had followed the hand-set sample book. The research home answers the second question: its eight pages
are about pages of text, type sizes and links, and none is about a composition, a part, a carrier, a palette or a
style. The study of static pictures of 2026-11-01, the prototypes of 2026-11-11 to 2026-11-15 and the sample book
lay in ignored directories, and the queue's items named none of them, so later work began from the owner's latest
remark and redrew what existed.

On the same day the owner learned that the overview page of every published work is placed by its author by hand,
in a Typst file with coordinates, and said that a capability of the product should not require its upstream input
to write coordinates. The owner then asked for the end state the design converges on, and agreed in the main with
the one the holder stated. The contract has a queue and no end state: each item was read against the latest remark
and not against where the queue leads.

## What Changes

- Three research pages enter `docs/research/`: a map of the figure language by dimension, with what was studied,
  what the product draws and where each piece went; the study of static architecture pictures of 2026-11-01; and a
  record of every prototype of 2026-11-11 to 2026-11-15, with what was kept and cut and why, and 26 pictures.
- The contract's Product section says that no input states where anything stands, and names the one input that
  still does: an overview composition.
- The contract's Evolution section gains the end state the queue leads to.
- Three open items of the queue are worded against it: `composable-parts` names the words made from facts, the key
  and the reading page; `compositions` names its four compositions; `carriers` begins with an overview the publisher
  draws from the model and gains rules, what a work writes, an author's notes and what a work covers.
- A test refuses a model schema that holds a property of position.
- The queue's test refuses a Change that names a queue item when its design names no page of `docs/research/`.
- The model reference says that an overview composition is the one input that places marks, and until when.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-identity`: a new requirement, "A queue item's Change rests on research".
- `architecture-model`: a new requirement, "A model states no position".

## Impact

`docs/product-contract.md` (Product, Evolution, three items of the queue), `docs/research/` (three pages, 26
pictures, the index), `docs/reference/model.md`, `docs/reference/development.md`, `CHANGELOG.md`,
`tests/evolution-queue.test.mjs`, `tests/fixtures/evolution-queue.mjs`, `tests/model-states-no-position.test.mjs`.
No shipped source and no delivered byte.

Queue: `maintenance`.
