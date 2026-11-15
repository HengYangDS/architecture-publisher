## Why

A plate draws facts its author never wrote: how much code a part owns, how old that code is, how many files a
relation cites, which part a view's relations lead to. The tool measures them, and today it measures them in four
places. `src/style.mjs` sums each part's bytes and sorts its files into age bands. `src/poster/strip.mjs` sums a
group's files, finds the edition's scale, counts a part's files and takes each file's share. The count of a
relation's cited files and the hub of a view are computed by the module that draws the lines,
`src/poster/lines.mjs`. `src/build.mjs` and
`src/sources/bind.mjs` each read the pin's date and time from Git, once for the edition's foot and once for the
key.

Nothing outside the drawing code can read these values, and nothing says which of a plate's values the author
stated and which the tool measured. The design of the queue
(`openspec/changes/archive/2026-11-14-queue-the-roadmap-and-name-roles/design.md`, called the design below) asks
for both: "Measured facts (strip length, age, citation count, hub) move out of the drawing code into a layer that
all projections read, and every value is marked stated or measured", and "Drawable values come from one property
catalogue that states name, measure, unit and source". Its test of a projection is that it "may add no fact". The
next item, `reader-and-data`, writes the pinned edition as data; it can only write measured values that exist
outside the drawing.

## What Changes

- A new unit `src/facts` measures, from the model and from what was read at the pinned revision, every fact a
  plate draws that its author did not state: for each part its owned files, their number, their bytes, each file's
  share and age band; for a group the overview draws, its members' files together; for the edition the bytes of its
  largest part, the pin's date and release and the number of files read; for each relation the number of files it
  cites; for each view its hub and the age bands its parts hold.
- Each fact carries the property it is a value of, what it is a fact of, its value, its unit and its origin:
  `measured`, from the pin or from the model, or `stated`. One catalogue in the unit lists every property once.
- The drawing code of the edition reads the layer and measures nothing. `src/poster/strip.mjs` loses its measuring
  functions and keeps the mapping from a fact to a length, a dye or a word. The edition's record and the page take
  a part's first file from the layer.
- `src/style.mjs` keeps the choice of marks and palette and no longer measures. `src/sources/ages.mjs` moves into
  the layer. The pin's date and time are read once.
- The requirement "Age bands" of `poster-composition` says which files an edition sorts into bands: the files its
  parts own, as every edition has drawn them since components claim files by path. It said "cited files". The
  edition's behaviour does not change.
- A test holds the drawing to the layer: the import table, a search for the catalogue's measures outside the
  layer, and a plate drawn from deliberately false facts, which must show the false values.
- No delivered byte changes. No file is added to a delivery, no field to the manifest or to the result of
  `archpub check --json`, and the manifest's version stays as it is. The acceptance is that `archpub compare`
  reports each of the twelve editions of the six works identical before and after.
- At its end the Change measures, without drawing and without landing code, how many of the 41 views of the six
  works do not fit when a part shows every detail its model states. The number is recorded for `one-anatomy`.

Out of scope: the single anatomy of a part, any fact no plate draws today, written statements of other kinds, any
change to the model format, the reader file and the edition as data, new marks, palettes and type sizes, and the
value table's scales and missing values.

The design gives the roadmap's third step one week for its two Changes and this one a stop line: if the layout or
the typesetting engine would need rewriting, the work stops and is estimated again.

## Capabilities

### New Capabilities

- `measured-facts`: the one layer of facts the tool measures, what each fact carries, the catalogue of
  properties, and the rule that every projection reads the layer and measures nothing.

### Modified Capabilities

- `poster-composition`: "Age bands" names the files a part owns where it named cited files. No requirement is
  added and no behaviour changes.

`edition-delivery`, `interactive-map` and `source-binding` keep every requirement as it reads: what a delivery, the
page and the binding do is unchanged.

## Impact

New: `src/facts/` (the catalogue, the age bands, the edition's facts, a view's facts) and its tests
(`tests/facts-*.test.mjs`, `tests/fixtures/record-facts.mjs`). Changed: `src/style.mjs`, `src/build.mjs`,
`src/poster/strip.mjs`, `src/poster/lines.mjs`, `src/poster/figure.mjs`, `src/edition/record.mjs`,
`src/map/explainer.mjs`, `src/sources/bind.mjs`, `tests/module-boundaries.test.mjs`, and the tests that hand the
drawing, the record or the page a style, a binding or a commit by hand: `tests/fixtures/strips.mjs`, the tests of
the style, the binding and the age bands, of the strip, the key, the spread and the lines, of the edition's front,
class and key, and of the page's draft. Their expected plates, keys, records and drafts are unchanged; the binding's
expected shape loses the pin's time and date. Removed: `src/sources/ages.mjs`. Documents: `docs/reference/development.md` where it names the units,
`docs/product-contract.md` (the queue's tick for `fact-layer`) and `CHANGELOG.md`. Untouched: `src/layout`,
`src/plan`, `src/overview`, `src/house.json`, the model's schema, the manifest's format and every delivered file.

Queue: `fact-layer`.
