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
- `openspec/changes/archive/` holds 36 Changes archived before 0.4.0 replaced the whole product. They specify
  parts that no longer exist, and nothing reads them.
- `.config/ci/supply/` holds an image recipe no script, pipeline or test reads; the configuration reference calls
  it a failed experiment.

## What Changes

- `docs/research/` leaves the tree; Git keeps it. The one statement there that still binds the product and stands
  nowhere else, what the product must not become, moves into the product contract's boundaries.
- `CHANGELOG.md` keeps the alpha releases' headings and drops their links to a private address.
- A test refuses a tracked text file that names a private IPv4 address.
- The 36 Changes archived before the first public release leave the tree; Git keeps them.
- The unused CI image recipe leaves the tree, with the ignore line for a directory that does not exist.
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
`.config/checks/prettier/prettierignore`, `.config/ci/supply/` (removed), `openspec/changes/archive/` (36 early
Changes removed), the
test of the CI projection, and one new test. The publisher's behaviour,
model format and deliveries do not change. Earlier commits and released archives are not rewritten.
