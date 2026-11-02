## Why

The posters are card grids that every work shares, and the owner rejected that
form for the static picture. After the owner chose an editorial page like the
6000 reference, three pages were set by hand in Typst, one per work, each with a
main figure drawn from that system's own structure. They exist only as spikes
outside the product: their faces are host fonts, their text is typed by hand,
and nothing checks them.

## What Changes

- A model may name an overview composition: a Typst file beside the model that
  states its work's page with archpub's house class.
- archpub ships the house class: the 16:9 page of 1600 by 900 points, the
  palette, Source Serif 4 for titles and heads and Source Sans 3 for text, with
  Noto Sans CJK SC for Han characters, four type sizes, and the primitives the
  three pages use. Its masthead and imprint print the model's title, revision
  and the revision's date.
- A new medium, `overview`, compiles the composition with the pinned Typst into
  `overview.svg` and one PNG per `--png` width. It uses only the bundled faces,
  reads only the composition's Typst files, the class and the model, and refuses
  a page whose text leaves its area, lies over other text, holds a character no
  face draws, names a component the model lacks, sets its own type size, face or
  colour, or makes Typst warn.
- Source Serif 4 4.005 and Source Sans 3 3.052 join a house font supply,
  unmodified, with their licences.
- Typst 0.15.1 joins the pinned toolchain. Building an overview needs that
  version on the path; the other media do not.

## Capabilities

### New Capabilities

- `overview-page`: the composition, the house class, the checks on the typeset
  page and its files.

### Modified Capabilities

- `architecture-model`: the optional overview composition.
- `edition-delivery`: the `overview` medium in the build options, the staged
  output and the manifest.

## Impact

The model and its schema, the build and check commands, a new overview module
beside the poster and the map, the font supply, the toolchain, their tests and
the model, operations and development references, the product contract, the
README and the changelog. Models that name no composition build as before, so
the corpus deliveries stay byte-identical.

Out of scope: retiring the posters and separating the page's plan from poster
composition, which follow once the owner accepts the overviews; the three works'
compositions, which belong to the architecture-publications repository; and the
interactive atlas.
