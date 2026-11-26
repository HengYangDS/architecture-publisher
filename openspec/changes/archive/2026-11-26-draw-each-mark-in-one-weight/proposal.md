## Why

A census of the edition's pages found two kinds of untidiness that no gate holds: more stroke weights or text styles
on a page than a budget, and one mark drawn in two weights. The queue item `compositions` asks that each becomes a
gate or is dropped with its reason. On dev the second is real, and its cause is in the sources: 34 stroke widths are
written as numbers across the figure's JavaScript and the class's Typst, so one mark can be drawn at two widths. A
station's ring is stroked at 1.4 pt on a stretch of parallel tracks and at 1.7 pt elsewhere; the key draws an outside
part's sample at 0.7 pt where the figure strokes a card at 0.8 pt, and a planned or retired status's sample at 1 pt
where the figure draws a relation's line at about 1.07 pt.

Queue: `compositions`.

## What Changes

- `src/house.json` gains `strokes`, the figure's widths in pixels that are not a line of the table of lines: a card's
  outline, a tier's ring and bracket, a kind's icon. Its `weights` gain a weight for each mark the pages stroke that
  had a number: the cover's rule, a fact's rule on the colophon, and the overview's course, tracks, smaller rings,
  stems, spurs, further courses, asides and lines between points. Its `seal` gains the seal's three strokes as
  shares of the seal's size.
- The figure and the class read every stroke from those tokens. A station's ring is stroked at the house's weight of
  a ring on a track as on the course. The key draws an outside part's sample at a card's width and a planned or
  retired status's sample at a relation's line's width, as the figure draws them.
- A test refuses a stroke width that holds a number of its own anywhere under `src/`, and a Typst mark left to
  Typst's own width, naming its file and line.
- The overview's check that no text lies under a ring reads each ring's width as the drawing records it, not the
  house's heaviest. The tests' reading of the source without its comments drops a line that is a comment first, so
  that a `/*` it quotes hides no code.
- The class's unused `tick` goes.
- The census's budget is dropped with its reason, recorded in the research page on tidiness.
- `compositions` moves before `page-figures` in the queue: `page-figures` still waits for a release of Archify, and
  `compositions` needs nothing from it, by the rule the contract already states for an outside wait.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `value-table`: a requirement is added: every width the edition strokes outside the table of lines is a token of
  the house named by its mark, none holds a number of its own, and a key's sample of a card or a line is drawn at the
  figure's width.

## Impact

`src/house.json`, `src/poster/part.mjs`, `src/poster/figure.mjs`, `src/overview/house.typ`, `src/overview/drawn.typ`,
`src/overview/checks.mjs`, `src/edition/colophon.typ`, `tests/one-weight.test.mjs` (new),
`tests/one-source-tokens.test.mjs`, `tests/overview-lines.test.mjs`, `tests/overview.test.mjs`,
`tests/fixtures/source.mjs`, `docs/reference/development.md`, `docs/reference/lines.md`, `docs/research/tidiness.md`,
`docs/research/second-proof.md` and `docs/product-contract.md`.

No model is accepted or refused differently. The bytes of existing deliveries change, so the release is a breaking
one: an overview with a stretch of parallel tracks draws its rings there at 1.7 pt where it drew 1.4 pt; a plate's
key draws the sample of an outside part at 0.8 pt where it drew 0.7 pt, and that of a planned or a retired status at
about 1.07 pt where it drew 1 pt, its dashes and gaps longer by the same share; so the overview's page, the edition
and the page images of such a plate change, and so does its figure alone (`figures/`), which carries the key. No
other drawn width changes. The manifest's digests of the class's inputs, `edition.house` and `overview.house`,
change: they cover the edited class, drawing and tokens.
