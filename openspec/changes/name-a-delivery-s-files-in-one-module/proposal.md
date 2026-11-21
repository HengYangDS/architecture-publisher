## Why

On 2026-11-20 the owner made one source for each fact a hard requirement of everything built here. The census of
that day (`docs/research/one-source.md`, "Names the source forms") found the names of a delivery's files formed in
up to six modules each: the four files named by the model's id, `manifest.json`, the acceptance record, its
signature and the colophon page, the delivered `model.json`, the directories `images/` and `figures/`, a number set
in two digits in eight lines of six modules, a plate's key in two, a revision cut to seven characters in five lines,
and the Typst version as a constant in one module and a literal in another. A name changed in one place would leave
the others delivering, listing or reporting the old one, and nothing would say where.

## What Changes

- A unit `names` (`src/names.mjs`), which imports nothing, states each name a delivery's files take and forms the
  names made from a value: the four files of a model's id, a number in two digits, a page's name `NN-<view>` with its
  image and figure files, a plate's key and the number it carries, and a revision cut to seven characters. It states
  the Typst version, and the staged `model.json` under a name of its own.
- Every module that formed or restated one of them takes it from the unit: the build, the manifest, the pinned
  edition and its data and reader file, the delivery's acceptance, the edition's record, typesetting and colophon,
  the plates' warnings, the overview's typesetting and the command line's reports, comparison and help. The page's,
  image's and figure's names leave the edition's typesetting for the unit, and the manifest no longer imports the
  edition.
- The refusal of a model id that would give two files one name is derived from the names, not listed by id. The
  colophon's note in five languages and the help of `accept` and `verify` take the file names as arguments.
- `tests/one-source.test.mjs` refuses a module other than the unit that writes one of its names again, and holds
  each name the unit forms to the name deliveries carry.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement changes: every delivery, page, image, figure, manifest, reader file, colophon page, refusal and
help text is what it was.

## Impact

New: `src/names.mjs`. Changed: `src/build.mjs`, `src/manifest.mjs`, `src/projection.mjs`, `src/delivery.mjs`,
`src/pinned/reader.mjs`, `src/pinned/data.mjs`, `src/edition/record.mjs`, `src/edition/typeset.mjs`,
`src/edition/colophon.mjs`, `src/edition/words.mjs`, `src/cli/report.mjs`, `src/cli/comparison.mjs`,
`src/cli/run.mjs`, `src/poster/compose/plates.mjs`, `src/overview/typeset.mjs`; `tests/one-source.test.mjs`,
`tests/module-boundaries.test.mjs`, and the import of a name in `tests/overview.test.mjs` and
`tests/colophon.test.mjs`; `docs/reference/development.md` where it names the units, and `CHANGELOG.md`. Untouched:
every Typst file, `src/house.json`, the model's schema, the manifest's format and every delivered byte. The staged
names and the labels that the JavaScript and the Typst class share are a later Change of the item.

Queue: `one-source`.
