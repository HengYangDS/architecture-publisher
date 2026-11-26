## Why

A census of 2026-11-26 read every table of the reference documents outside the written blocks: five restate the
source and two are held to it by a test that parses the page. The model reference's table of palettes restates the
house's palettes and the default; the data reference's table of a delivery's three files restates the delivery's
registry, which the operations reference already prints; its tables of the data's members and of an evidence row's
keys repeat the lists the tests hold the code to; the configuration reference's table restates the npm scripts; the
lines reference is held to the house's table of lines by a test, which is a check and not a source. The queue item
`derived-references` asks that a table restating the source be written from it. The committee of 2026-11-26 decided
each table's source (recorded in the research page). It lands after
`write-the-schema-s-enumerations-from-their-tables`, and it is the item's last Change.

Queue: `derived-references`.

## What Changes

- `tools/docs/references.mjs` writes the model reference's table of palettes from `src/house.json`, where each
  palette gains its sentence on its colours, and the schema's default; and the lines reference's table from the
  house's table of lines, where each row gains the question it answers and what the page does for it.
- The data reference's table of a delivery's three files goes: a sentence names them, links the operations
  reference's written table and gives each format.
- The data reference's tables of the data's members and of an evidence row's keys become the delivery format's
  statement of those keys: the tests read them instead of literal lists.
- The configuration reference's table goes: the npm scripts name the carrier each check reads, and a sentence names
  the four carriers no script names, with their readers.
- The command line reference's list of commands by role points at the written catalogue.
- The research page records how the item ended, and the contract marks `derived-references` finished.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `value-table`: the documents' reference table written from the table of lines, not held to it by a test.
- `architecture-model`: the palettes' table written from the house.
- `pinned-edition`: the data's members and an evidence row's keys are those the data reference states, in its order,
  which the tests hold the data to.

## Impact

`src/house.json` (a sentence per palette, a question and a page's expression per row of lines), the reference
writer and its test, `docs/reference/model.md`, `docs/reference/lines.md`, `docs/reference/data.md`,
`docs/reference/configuration.md`, `docs/reference/command-line.md`, `docs/research/one-source.md`,
`docs/product-contract.md`, `tests/fixtures/data-format.mjs` (new) and the tests of the data, the evidence, the
lines, the house tokens and the styles. No model is accepted or refused differently, and no page, image, figure or file a
delivery lists changes; the manifest's digests of the class's inputs, `edition.house` and `overview.house`, change,
as they cover the house tokens, and will again at each later rewording of that text (design decision 5).
