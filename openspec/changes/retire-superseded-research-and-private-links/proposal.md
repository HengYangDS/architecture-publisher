## Why

The owner asked for an inventory of every tracked file unchanged for over a week, and for what is stale or badly
placed to be handled. Of 798 tracked files 550 are that old. Most are not stale: 142 are received material pinned
by digest, 315 are archived Changes, and some sixty are source, tests and tools that still have a consumer and say
what the code does. The rest is this Change:

- `docs/research/` holds seven pages and 22 captures from September and October. Each page is marked `active`,
  and each describes the design the product contract replaced or renderers the product never adopted; one says the
  product delivers no PDF. Nothing outside the directory reads them but two index lines. They also hold every link
  to a private network address in the repository's prose, and `CHANGELOG.md` holds 25 more, as targets of the
  alpha releases' headings. The owner has said such an address does not belong in public files.
- `.config/ci/supply/` holds an image recipe no script, pipeline or test reads; the configuration reference calls
  it a failed experiment.
- `src/importers/model.mjs` migrates a model from an earlier version. It is no importer, and the model's schema,
  loader and paths live in `src/model/`.

## What Changes

- `docs/research/` leaves the tree; Git keeps it. The one statement there that still binds the product and stands
  nowhere else, what the product must not become, moves into the product contract's boundaries.
- `CHANGELOG.md` keeps the alpha releases' headings as plain text, without links to a private address.
- A test refuses a tracked text file that names a private IPv4 address.
- The unused CI image recipe leaves the tree, with the ignore line for a directory that does not exist.
- The model migrator moves to `src/model/migrate.mjs`.
- The configuration reference names `.editorconfig`, which Prettier reads, and drops what it said of the research
  captures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-identity`: tracked files name no private network address.

## Impact

`docs/research/` (removed), `docs/product-contract.md`, `docs/README.md`, `docs/reference/configuration.md`,
`CHANGELOG.md`, `.config/checks/format-selection/policy.toml` (removed with the captures it listed),
`.config/checks/prettier/prettierignore`, `.config/ci/supply/` (removed), `src/importers/model.mjs` (moved),
`src/cli/run.mjs`, the tests of the migrator and of the CI projection, and one new test. The publisher's behaviour,
model format and deliveries do not change. Earlier commits and released archives are not rewritten.
