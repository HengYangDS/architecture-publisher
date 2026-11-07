## Why

A delivery is one edition of a work, but its static media do not read as one.
The overview is set by Typst in the house faces and palette. The posters are
set by the publisher's own engine in Noto Sans, on their own type scale and
colours, outlined and rasterized through a renderer built from Rust. Each
poster repeats its own head, legend and notes. No single publication collects
them.

The owner asked on 7 November for a print edition like a formal booklet:
contents with links at the front, pages that read like slides, and one
coherent typographic design. The owner approved one layout for every view and
a division of labour among three tools. The publisher lays the figures out,
Typst sets every word and prints, and Archify serves the screen. The owner set
every work's editor to Yang HENG and its licence to MIT.

Prototypes measured this design before this Change:

- Every view composed for one body field and was chosen by the fewest wiring
  faults, then the largest type. Across 12 targets and 59 views, every view
  fit, no view's type got smaller and no view gained crossings.
- Figure text set live by Typst at the engine's positions was never wider than
  the engine measured, in 51 of 51 runs.
- Prose justified with limited spacing and tracking kept every word space within
  1.37 times its natural width.
- The booklet passed PDF/A-3a and PDF/UA-1 and rebuilt byte-identical.

## What Changes

- **BREAKING** A build delivers the print edition, `<model id>.pdf`, in place of
  posters: a title page, linked contents with the edition's facts, the overview and one plate per view, typeset by the bundled Typst. Each page after the title page has
  one head, one key line and one foot.
- **BREAKING** The engine composes each view alone for the edition's body
  field, chosen by the fewest wiring faults and then the largest type. It no
  longer groups views, picks page archetypes or sets heads, legends and notes.
  Balance is measured and recorded, not refused, and each figure takes the largest type it fits, so plates fill their pages.
- Figure text is live. The engine supplies shapes and positioned text runs, and
  Typst sets the runs in the house faces. When the model declares how to browse
  its repository, each card title links to the first file the component cites
  at the pinned revision.
- **BREAKING** The house faces and palette apply to everything printed. One
  token source feeds the class and the engine. The raster renderer, its Rust
  toolchain and Noto Sans leave the product, and the text-measuring library
  gets a supply of its own.
- **BREAKING** Static files are named for what they show: `00-overview.png` and
  `NN-<view>.png`, rendered by Typst from the edition's pages. SVG files are
  not delivered. `--media` takes `edition` and `page`, and the manifest moves
  to version 6.
- **BREAKING** The model moves to version 3. `editors` and `license` replace
  `attribution`, `repository.browse` is optional, and `archpub migrate`
  converts version 2.
- Prose is justified on optimized lines, with hyphenation, limited spacing and
  tracking, and at most 32 em to a line. Figure text keeps the engine's ragged
  lines.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: editors, licence and a browse template, in model
  version 3.
- `poster-composition`: one view per plate, composed for the edition's body; live text; balance recorded. The capability keeps its id.
- `edition-delivery`: the print edition, its typography and composition, media,
  file names and manifest version 6.
- `overview-page`: the overview in the print edition and its image named
  `00-overview.png`; Typst required for print.
- `product-identity`: the self-contained command delivers the edition and the
  page.

## Impact

The poster engine is reduced to plate composition. The overview class gains the
edition. The build, the manifest, the model schema and migration, and the
supplies change, and the raster supply and its tooling, the Rust toolchain and
its CI steps are removed. Tests, fixtures and documentation follow. Every work in
Architecture Publications must migrate its model and rebuild, in that
repository's own Change. The interactive page and its Archify style are out of
scope.
