## Why

The queue item `page-figures`: the page's diagrams are laid out by the publisher, and a guide's diagram file states
parts and relations with no position. Today a guide's architecture file must place every part itself, and the
authors' placing reads worse than the publisher's choice: over the 22 published architecture files, routes a reader
misreads fall from 22 to 3 and misread labels from 51 to 4 when the publisher chooses among Archify's own layouts
(`docs/research/page-figures.md`).

## What Changes

- A guide's architecture file that places nothing is laid out by the publisher: Archify's automatic layout, with its
  connections' sides and with Archify's, the repair of routes that misread and the pins of labels, ranked as the
  generated page's diagrams are.
- The chooser is split in two: the candidates of a model's view, and one choice among any candidates, which the
  generated page and the guide both use. The repair finds a card's centre in Archify's layout where the document
  places nothing.
- A file that places anything, a connection's side, route or label place included, is drawn as written; its
  refusal comes in a later Change of the item. The chooser measures at the build's quality.
- `docs/research/page-figures.md` records the works' diagram files, what Archify lays out by itself and the
  measures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interactive-map`: a guide's architecture diagram that places nothing is laid out by the publisher.

## Impact

Changed: `src/map/choice.mjs`, `src/map/guide-figures.mjs` (new), `src/map/guide.mjs`, `src/map/explainer.mjs`,
`tests/guide-figures.test.mjs` (new), `tests/guide.test.mjs`, `docs/research/page-figures.md` (new),
`docs/research/README.md` and `CHANGELOG.md`. No delivered byte changes for a model built before: every published
guide places its parts, and the generated page's choice is unchanged.

Queue: `page-figures`.
