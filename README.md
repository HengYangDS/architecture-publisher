# Architecture Publisher

Architecture Publisher draws the architecture of any repository from an
explicit model. Describe the components, the relations between them and the
files that support them in one JSON model, or import a LikeC4 workspace, and
`archpub` builds posters of its views, one interactive page that answers the
model's question view by view, and a manifest that binds every byte to its
inputs.

## Quick start

```sh
archpub check model.json --repo ../my-repository
archpub build model.json --repo ../my-repository --out build/my-repository
archpub accept build/my-repository --reviewer "Your Name"
archpub publish build/my-repository --to <publication-root>
```

`check` validates the model, verifies each declared source at the pinned
revision, composes every poster page and checks every diagram and the page with
Archify, without writing a delivery. `build` writes the delivery. A person
accepts it, and only an accepted delivery is published, under
`<publication-root>/<model id>/<version>/` in any directory you choose.

A minimal model looks like the one below. Three components cannot fill a 16:9
page, so its poster is printed as a sparse page and the manifest records the
balance gates it misses; [`editions/self/model.json`](editions/self/model.json)
is a complete model whose pages are balanced:

```json
{
  "format": "architecture-publisher.model",
  "version": 1,
  "id": "shop",
  "title": "Shop",
  "question": "How does an order reach the warehouse?",
  "components": [
    { "id": "web", "label": "Web shop", "kind": "frontend" },
    { "id": "orders", "label": "Order service" },
    { "id": "db", "label": "Order store", "kind": "store" }
  ],
  "relations": [
    { "id": "web-orders", "from": "web", "to": "orders", "label": "places orders" },
    { "id": "orders-db", "from": "orders", "to": "db", "label": "writes" }
  ],
  "kinds": {
    "frontend": { "label": "web application", "category": "frontend" },
    "store": { "label": "database", "category": "database" }
  }
}
```

The [model reference](docs/reference/model.md) describes every field: the
language the model is written in, kinds and their icons, details, statuses,
sources, groups and up to four views.

## What a delivery contains

- **Posters:** 16:9 pages of 2400 × 1350 px, each holding one to three views,
  as `page-<n>.svg` and as PNG at 2400 px, or at the widths `--png` names,
  with no text below 14 px: title, question, summary, the figures, one legend
  and notes with the scope and source revision. Each page is composed so that
  its figure fills it.
- **Page:** `index.html`, a standalone native Archify explainer that answers the
  model's question with one panel per view: the view's diagram, which opens
  Archify's full viewer, and steps that light each component and cite its
  source at the pinned revision.
- **Manifest:** `manifest.json`, the digest of the model, every source, every
  bundled supply and every artifact, each page's measures and the gates it
  misses, each diagram's route measures and the details, statuses and sources
  of every component and relation. Building the same model with the same
  version on one platform reproduces every byte.

`--media posters` or `--media page` builds one medium alone. The publisher sets
its own words, such as the notes' headings and the legend, in the model's
language: English, Simplified or Traditional Chinese, Spanish or Korean.

Layout is a grid: cards on shared row lines of one column lattice, each poster
card as wide as its text, wires that are only horizontal or vertical, and no
shared segment, wire through a card or touching label. A layout that breaks
this is never drawn, and a view no layout draws is refused, never shrunk or
cropped. A page whose figures are set at the largest type step and still leave
it partly blank is printed as sparse; any other page that misses a balance
gate is refused, unless `--quality standard` asks for drafts that record what
they miss.

## Install

The product is the `architecture-publisher` package in `packages/publisher`.
It needs Node.js 22.13 or later and has no runtime npm dependencies. From a
checkout, `mise run bootstrap` installs the locked inputs and prepares the
bundled raster renderer and LikeC4 parser; then pack and install the package:

```sh
mise run bootstrap
npm pack --ignore-scripts --workspace architecture-publisher --pack-destination build/artifacts
npm install --global --ignore-scripts build/artifacts/architecture-publisher-<version>.tgz
```

In the checkout itself, `node packages/publisher/src/cli/main.mjs` runs the same
command.

## Documentation

- [Product contract](docs/product-contract.md): inputs, outputs, quality floor and boundaries.
- [Model reference](docs/reference/model.md): the Architecture Model format.
- [Operations reference](docs/reference/operations.md): commands, layout, the delivery and refusals.
- [Development and verification](docs/reference/development.md): toolchain, checks and supply.
- [Self edition](editions/self/README.md): this repository described by its own model.

## Development

```sh
mise run bootstrap
npm run check
```

`npm run check` runs formatting, lint, types, module boundaries, dead code,
Markdown, OpenSpec, the test suite with coverage of at least 95 percent in
every dimension and package validation. `VERSION` is the only maintained
product version; after changing it, run `node tools/release/version.mjs --write`.
The [changelog](CHANGELOG.md) records each release.

## License

Architecture Publisher is released under the [MIT License](LICENSE). The
bundled fonts, icons, renderer, Archify and LikeC4 parser keep their own
licenses, which ship beside them.
