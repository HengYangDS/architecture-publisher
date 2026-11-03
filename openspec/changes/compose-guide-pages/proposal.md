## Why

Every interactive page published from 0.4.0 to 0.7.0 is one byte-identical
file. The page is generated from the model's components, relations and views,
so it repeats the posters, and nothing in the product lets a work explain how
its system behaves, what it guarantees or what a reader should do with it. The
vendored Archify already draws sequences and workflows, sets tables, charts,
callouts, checklists and code excerpts pinned to a commit, and checks the
writing; the generated page uses one architecture diagram per view and turns
the writing checks off. An AIGW guide authored with those forms passed
Archify's strict writing checks and its browser readability checks.

## What Changes

- A model may name `guide`, an Archify explainer draft relative to the model and
  within its directory, as it names `overview`.
- When a model names a guide, the page is the guide. The publisher stages the
  draft and the files it references, has Archify verify every repository source
  at the model's revision through a clone whose `origin` is the model's
  repository, and delivers it as `index.html`, with Archify's writing checks
  strict at the showcase quality and warnings at the standard quality. A draft
  that names another repository or revision is refused.
- `archpub scaffold guide <model.json> --out <directory>` writes the page the
  publisher generates today as a starting guide: its draft and one architecture
  document per view.
- The manifest records the guide's path and digest, each staged file's digest,
  the writing level and whether the guide's sources were verified.
- A model without a guide keeps today's generated page, byte for byte.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: a model may name a guide.
- `interactive-map`: the page is the work's guide when it names one, and a
  scaffold writes a starting guide.
- `edition-delivery`: the manifest records the guide's inputs.

## Impact

`src/model` (paths, load, schema), a new `src/map/guide.mjs`, `src/map/explainer.mjs`,
`src/build.mjs`, `src/cli/run.mjs`, their tests, `docs/reference` (model and
operations), `docs/product-contract.md`, the README, the product skill and the
changelog.
