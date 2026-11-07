# Architecture Publisher

Architecture Publisher draws the architecture of any repository from an
explicit model. Describe the components, the relations between them and the
files that support them in one JSON model, or import a LikeC4 workspace, and
`archpub` builds a print edition with one plate for each view, one interactive
page that answers the model's question and a manifest that binds every byte to
its inputs. The page
is the guide the work's author writes, checked by the vendored Archify against
the repository at the model's revision; a model without a guide gets a page
that answers its question view by view.

## Quick start

```sh
archpub check model.json --repo ../my-repository
archpub scaffold guide model.json --out guide
archpub build model.json --repo ../my-repository --out build/my-repository
archpub accept build/my-repository --reviewer "Your Name"
archpub publish build/my-repository --to <publication-root>
```

`check` validates the model, resolves the files each component claims at the
pinned revision and verifies their digests, composes every plate and checks
every diagram and the page with Archify, without writing a delivery. `build` writes the delivery. A person
accepts it, and only an accepted delivery is published, under
`<publication-root>/<model id>/<version>/` in any directory you choose.

A minimal model looks like the one below; the [examples](examples/) hold larger
ones. Three components leave most of a plate blank, so the manifest records the
balance gates it misses:

```json
{
  "format": "architecture-publisher.model",
  "version": 3,
  "id": "shop",
  "title": "Shop",
  "question": "How does an order reach the warehouse?",
  "editors": [{ "name": "Shop team" }],
  "license": "MIT",
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
language the model is written in, its editors and licence, kinds and their
icons, details, statuses, the files components claim and relations cite, the
coverage scope, groups and views. `archpub migrate model.json --out model-3.json`
converts a version 1 or 2 model once its editors are declared.

## What a delivery contains

- **Print edition:** `<model id>.pdf`, typeset by Typst 0.15.1 on 1600 × 900
  point pages: a title page with the work's question, summary, editors and
  licence; contents that link to every page beside the edition's facts, scope
  and limits; the overview its author composes, when the model names one; and
  one plate per view, its figure with each component's icon and details and a
  key of what it shows. Its text is text, each card title links to the file it
  was read from when the model names a browsable repository, and the PDF
  conforms to PDF/A-3a and PDF/UA-1 with the model attached.
- **Images:** in `images/`, the overview's page as `00-overview.png` and each
  plate's page as `NN-<view>.png` at 2400 px, and at the other widths `--png`
  names.
- **Page:** `<model id>.html`, a standalone native Archify explainer that answers
  the model's question with one panel per view: the view's diagram, which opens
  Archify's full viewer, and steps that light each component and cite its
  first file at the pinned revision.
- **Manifest:** `manifest.json`, the digest of the model, every cited file with
  its owner, every bundled supply and every artifact, each plate's composition,
  measures and the balance gates it misses, each diagram's route measures and
  the details, statuses and files of every component and relation. Building the
  same model with the same version on one platform reproduces every byte when
  the edition is dated by the revision's commit or `SOURCE_DATE_EPOCH`.

`--media edition` or `--media page` builds one medium alone. The publisher sets
its own words, such as the edition's contents and facts and the key, in the
model's language: English, Simplified or Traditional Chinese, Spanish or Korean.

Layout is a grid: cards on shared row lines of one column lattice, each card on
a plate as wide as its text, wires that are only horizontal or vertical, and no
shared segment, wire through a card or touching label. A layout that breaks
this is never drawn, and a view no layout draws is refused, never shrunk or
cropped. Each plate takes the fewest crossings and route defects, then the
largest type it fits, and records the balance gates it misses for the reviewer.

## Commands

```sh
archpub check model.json [--repo <checkout>]
archpub build model.json --out <new-directory> [--repo <checkout>]
  [--media edition,page] [--png 2400,6000] [--quality showcase|standard]
archpub import likec4 <workspace> --out model.json --id <id> [--locale <tag>]
archpub migrate model.json --out <new-model.json>
archpub accept <delivery> --reviewer <name>
archpub publish <delivery> --to <root>
archpub --help | --version
```

Every command accepts `--json` and exits with 0 on success, 1 on a refused
input, 2 on a usage error and 3 on any other failure. The
[operations reference](docs/reference/operations.md) describes each command,
the build and every refusal.

## Install

Each release has an archive for Linux, macOS and Windows on ARM64 that holds the
`archpub` command with its own Node.js and Typst; it needs only Git. Pin it with
mise from the release's `architecture-publisher-<version>.mise.toml`, or unpack
it and put its `archpub/bin` on the path.

The release's `architecture-publisher-<version>.tgz` is the same command as an
npm package for a machine with Node.js 22.13 or later, and Typst 0.15.1 for the
print edition. In a checkout, `mise run bootstrap` installs the locked inputs
and prepares the bundled LikeC4 parser; then `node src/cli/main.mjs` runs the
command.

## Documentation

- [Product contract](docs/product-contract.md): inputs, outputs, quality floor and boundaries.
- [Model reference](docs/reference/model.md): the Architecture Model format.
- [Operations reference](docs/reference/operations.md): commands, layout, the delivery and refusals.
- [Development and verification](docs/reference/development.md): toolchain, checks and supply.
- [Contributing](CONTRIBUTING.md): set up, verify, commit, land and release.
- Examples: the [Big Bank model](examples/big-bank/README.md) and the
  [LikeC4 shop workspace](examples/likec4-shop/README.md) to start from.

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
bundled fonts, icons, measuring library, Archify and LikeC4 parser keep their
own licenses, which ship beside them.
