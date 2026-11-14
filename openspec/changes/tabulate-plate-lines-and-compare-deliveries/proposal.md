## Why

The roadmap's first step measured the lines of a plate on screen and had two holders read them. Its record
(`trials/2026-11-15-outcome.md` and `trials/screen/2026-11-15-comparison.md` in the publications repository) admits
three things and withdraws two. Lines into a view's hub and every other line have the same width at every image
size, so colour alone tells them apart; at twice the width they are distinguishable on a 1920 px page. A relation's
cited files are read right 54 times in 54 as a number and 88 times in 162 as ticks. The dashed boundary holds at
1920 px and above. Two straight pieces of a line were found drawn at a third of their weight in 0.14.0.

The values these lines are drawn with stand in three places: `src/poster/tokens.mjs`, a literal in
`src/poster/figure.mjs`, and Typst presets in `src/overview/house.typ` that the key draws its samples with. Nothing
holds a plate to them, and a key's sample can differ from the line it stands for.

Every change to the drawing means that a reviewer reads all twelve editions of the six works again, because nothing
says which plates a change touched.

## What Changes

- **BREAKING:** plates of an unchanged model are drawn differently. With `strip` marks, a relation into the view's
  hub is drawn at twice the weight of every other relation, still in the oldest dye, and ends inside an arrowhead
  1.45 times as large: the cell the trial measured and read. A planned relation into the hub is heavy in its
  dashes; a retired one is drawn as before.
- **BREAKING:** a relation's cited files are written as a number near its source, in the smallest figure type and
  its line's colour. Ticks are withdrawn, with the rule of five and the count beside them.
- **BREAKING:** a plate's key holds the sample of a row exactly when its figure draws the row. The hub's entry shows
  the heavy line with its arrowhead and says so in each of the five languages, the entry for cited files shows a
  number, and the boundary's sample is drawn with the plate's own weight, dash and gap, on card plates too.
- One table, the `lines` section of `src/house.json`, holds the line weights and patterns of a plate in six rows: a
  relation, emphasis, the system boundary, the citation count, and the planned and the retired pattern, both marked
  as not yet tested by a work. Each row states what the page does for it, as data on which nothing refuses. The
  figure, the key, the reference page and the tests read the table. A model cannot name, add or change a row.
- Two new warnings, neither a refusal. `citation_count_touches` names the plate and the relation whose count found
  no clear place along its line; the plate is still built. `line_row_untested` names the plates that draw a planned
  or a retired part or relation, once for each of the two rows.
- Tests hold the table to five invariants of the design, each proved by a deliberately broken table that makes its
  test fail.
- A new command, `archpub compare <delivery> <delivery>`, under the reviewer's heading of the help. It checks each
  delivery against its own manifest, then reports each plate with a page image that differs in bytes, by its number
  and views, and apart from the plates the files of the whole edition: the print edition, the page, the overview's
  images and the manifest. An acceptance record, its signature and the colophon page are left out, because `accept`
  writes them after the build. The command writes nothing. Its exit status is 0 whether or not the deliveries
  differ, 1 for a directory that is no delivery or whose files differ from its manifest, and 2 for a usage error.
- A delivery that does not match its manifest is refused by name, so `accept`, `verify` and `publish` say which
  delivery's files differ. Their refusal codes do not change.
- A new reference page, `docs/reference/lines.md`, shows the table row by row, and a test compares it with
  `src/house.json`.

Not in this Change:

- The row "one weight for every piece". Its cause is a pixel column lost at the page's middle, which was found and
  is not yet explained.
- A dash-dot boundary, which no cell of the trial drew.
- The page's expression of the rows, beyond the table's column of data.
- The smallest type of a figure (14 px in the drawing space, 11.2 px on a 1920 px page), which the first step left
  open.
- The single anatomy of a part, the fact layer, the reader file, any change to the model format, and new palettes,
  styles and type sizes.

The design gives this item three working days. A row unfinished by then leaves the table and returns to the queue,
and `fact-layer` opens as planned.

## Capabilities

### New Capabilities

- `value-table`: the one table of line values, the rows it admits, the warning for a row no work has tested, and
  the invariants its tests hold built plates to.

### Modified Capabilities

- `poster-composition`: lines into the hub are heavy, in the oldest dye, with a larger arrowhead; cited files are a
  number, and a count with no clear place is reported; ticks are withdrawn. One requirement is removed and one
  added, so the count of its requirements stays at 32.
- `edition-delivery`: a strip plate's key shows the citation count and the heavy line; the key's samples come from
  the table; two deliveries can be compared plate by plate, and the comparison says what it refuses and leaves out.

## Impact

- The table and the drawing: `src/house.json`, `src/poster/lines.mjs` (new), `src/poster/tokens.mjs`,
  `src/poster/figure.mjs`, `src/poster/strip.mjs`, `src/poster/compose/plates.mjs`, `src/overview/house.typ`,
  `src/locale.mjs`, `src/build.mjs` (one line adds the warnings) and `src/edition/record.mjs` (one word of a
  comment).
- The comparison: `src/delivery.mjs`, `src/cli/run.mjs`, `src/cli/report.mjs`, and the new `src/cli/comparison.mjs`
  and `src/cli/facts.mjs`.
- Tests: the new `tests/line-table.test.mjs`, `tests/line-facts.test.mjs`, `tests/line-pairwise.test.mjs`,
  `tests/poster-line-counts.test.mjs`, `tests/delivery-compare.test.mjs` and `tests/fixtures/line-tables.mjs`;
  `tests/poster-strip-ticks.test.mjs` removed; `tests/poster-strip.test.mjs`, `tests/poster-palette-key.test.mjs`,
  `tests/edition-key.test.mjs`, `tests/edition-key-line.test.mjs`, `tests/locale.test.mjs`,
  `tests/fixtures/strips.mjs`, `tests/cli-usage.test.mjs` and `tests/cli-json-results.test.mjs` changed.
- Documents: `docs/reference/lines.md` (new), `docs/reference/command-line.md`, `docs/reference/model.md`,
  `docs/reference/operations.md`, `docs/README.md`, the Skill, `docs/product-contract.md` (the queue's tick) and
  `CHANGELOG.md`.

Every strip plate with a hub or a cited relation differs from 0.14.0, and so does every plate whose key holds the
boundary. The Chinese editions of the six works are rebuilt once and compared with the same works built from the
lane's base.

Queue: `line-table`.
