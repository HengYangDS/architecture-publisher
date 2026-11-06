## Why

A delivery is one edition of a work, but its static media do not read as one.
The overview is set by Typst in the house faces and palette, while the posters
are set by the poster engine in Noto Sans, with their own type scale and colours.
The static pages are loose files named by mechanical numbers, and no single
publication collects them. The owner asked on 7 November for a print edition
like a formal booklet: contents with links at the front, and pages that read
like slides. The owner also set every work's editor to Yang HENG and its licence
to MIT.

A prototype for filmkit typeset that booklet in one pass with the bundled Typst:
title page, linked contents, the overview, six plates and a colophon. Typst
checked it against PDF/A-3a and PDF/UA-1 while compiling, and it rebuilt
byte-identical. A measured spike set the posters in the house faces. Every work
and fixture still composed except one view of the ETHOS work.

## What Changes

- **BREAKING** The posters are set in the house faces: Source Sans 3 for text,
  Source Serif 4 Subhead for titles, Noto Sans CJK SC for Han, and the house
  palette. One token source feeds the overview class and the poster engine.
- The poster engine gains edition plates. A page's figures are laid out for the
  edition's body and drawn without a head, legend or notes, and the engine
  reports each plate's legend.
- A build that delivers posters also delivers the print edition,
  `<model id>.pdf`. It holds a title page, linked contents, the overview compiled
  in place, one plate per poster page and a colophon. Typst sets every word
  outside the figures, and the model is attached to the file.
- **BREAKING** The model moves to version 3: `editors` and `license` replace
  `attribution`, and `archpub migrate` converts version 2 models.
- **BREAKING** Static files are named for what they show: `00-overview.png`,
  then `NN-<views>.png` in reading order. The SVG files are no longer delivered,
  because the PDF is the vector form. The manifest moves to version 6 and
  records the house supply.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: editors and a licence replace the attribution, in model
  version 3.
- `poster-composition`: house faces and palette, and edition plates laid out for
  the booklet's body.
- `edition-delivery`: the print edition, semantic file names and manifest
  version 6.
- `overview-page`: the overview set in place in the print edition, and its file
  named `00-overview.png`.

## Impact

The poster engine's typefaces, tokens and composer; the overview class; the
build and its manifest; the model schema and migration; the house supply; the
tests, fixtures and documentation. Every work in Architecture Publications must
migrate its model and rebuild, in that repository's own Change. The interactive
page and its Archify style are out of scope here.
