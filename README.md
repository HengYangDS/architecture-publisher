# Architecture Publisher

Architecture Publisher draws the architecture of any repository from an
explicit model. Describe the components, the relations between them and the
files that support them in one JSON model, or import a LikeC4 workspace, and
`archpub` builds a poster for each view, one interactive map of the whole model
and a manifest that binds every byte to its inputs.

## Quick start

```sh
archpub check model.json --repo ../my-repository
archpub build model.json --repo ../my-repository --out build/my-repository
archpub accept build/my-repository --reviewer "Your Name"
archpub publish build/my-repository --to ~/Documents/Architecture
```

`check` validates the model, verifies each declared source at the pinned
revision and lays out every view without writing anything. `build` writes the
delivery. A person accepts it, and only an accepted delivery is published.

A minimal model:

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

The [model reference](docs/reference/model.md) describes every field: kinds and
their icons, details, statuses, sources, groups and up to five views.

## What a delivery contains

- **Posters:** one per view, as SVG and as PNG at 1800 and 6000 px. Each is 1800
  × at most 1350 px with no text below 14 px: title, question, summary, the
  figure, a one-line legend and a footnote with the scope and source revision.
- **Map:** `index.html`, a standalone native Archify document of every component
  and relation, with one guided view per poster and evidence cards listing each
  detail, status and source digest.
- **Manifest:** `manifest.json`, the digest of the model, every source, every
  bundled supply and every artifact. Building the same model with the same
  version reproduces every byte.

Layout is a grid: cards of one size on shared row lines, wires that are only
horizontal or vertical, and no shared segment, wire through a card or touching
label. A view that cannot be drawn that way is refused with the relations
concerned, never shrunk or cropped.

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
