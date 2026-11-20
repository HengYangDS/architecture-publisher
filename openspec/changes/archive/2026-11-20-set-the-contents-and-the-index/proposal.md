## Why

The owner asked on 2026-11-19 where the last page had gone that a committee had ruled a day before, saw it drawn
as a table of parts against plates, and ruled: the contents and the last page are designed again; the contents
may take further pages, and so may the last page of a large work; a table of parts against plates is out, since a
part stands on few plates; sixteen rows a page are too close; the overview stands apart from the plates' rows,
ten a side at most. On 2026-11-20 he saw the contents drawn with the rows shared out evenly and ruled again: the
rows are equally spaced in order and never stretched to fill, and a page they continue on is not filled. For the
index he then asked for twenty a side.
The released contents also lose their foot on a second page and leave its left half empty, which no published work
had shown, since none has more than eleven plates.

## What Changes

- The contents list the plates alone, a row a plate, the whole row a link and no page number. The overview's
  entry, its number, name and claim, opens the left half of the first page above the scope, the limits and the
  reading note.
- A half of a contents page takes ten rows at most, each a tenth of the body high in every edition and in order
  from the top; a further page sets rows in both halves, has its foot and says how many plates there are, and
  the page the rows end on is not filled.
- The edition ends with an index: every part by name, followed by the numbers of the plates that draw it, each a
  link; twenty lines a half at one pitch and in order, on further pages for a large work.
- Under the index stand the repository, the number of files read, the page and the data. The facts beside the
  contents leave: the title page and every page's foot state the rest, and the model's digest stands in the
  manifest.
- The model reference says which address a model states for its repository: the one a reader of the edition can
  open.
- **BREAKING**: an edition has one page more, and `edition_front_too_long` and `edition_index_too_long` refuse
  what the two pages cannot hold.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: the contents' form and pages; the index and what stands under it; the facts beside the
  contents removed.

## Impact

`src/overview/house.typ`, `src/edition/record.mjs`, `src/edition/words.mjs`, `src/edition/typeset.mjs`,
`src/house.json`, `src/build.mjs`; three new test files, a fixture and the tests that stated the old contents; the
reference pages, the glossary, the tutorial, the contract and the changelog; `docs/research/contents-and-index.md`.
Every edition's page count and bytes change; no plate changes.

Queue: `edition-map`.
