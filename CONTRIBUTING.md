# Contributing

This guide is for maintainers who change, check or release Architecture
Publisher. The repository holds the generic publisher only; published works,
such as the architecture of ETHOS, live in the separate
architecture-publications repository.

Before editing, read the [product contract](docs/product-contract.md) and the
active OpenSpec Change, run the installed `ethos status --json` in the intended
Work Lane, and obtain passing `ethos lane prewrite` admission for the exact
paths. Keep progress in that Change's `tasks.md`; the installed hooks enforce
commit and push admission.

| Your task                        | Read next                                                            |
| -------------------------------- | -------------------------------------------------------------------- |
| Set up and check a change        | [Set up and verify](#set-up-and-verify)                              |
| Commit and land a change         | [Commit and land](#commit-and-land)                                  |
| Release an edition               | [Release](#release)                                                  |
| Understand the toolchain         | [Development and verification](docs/reference/development.md)        |
| Look up commands and refusals    | [Operations reference](docs/reference/operations.md)                 |
| Change a model or start from one | [Model reference](docs/reference/model.md) and [examples](examples/) |

## Set up and verify

```sh
mise run bootstrap
npm run check
```

`mise run bootstrap` installs the locked Node, npm and Rust toolchains and the
locked npm dependencies, and restores the canonical Raster pair from Git
custody. `npm run check` is the fail-closed quality entry: formatting, lint,
types, module boundaries, dead code, Markdown, strict OpenSpec validation, the
test suite with at least 95 percent coverage in every dimension, and packed
package validation. `mise run fix` applies the native formatters. A local check
does not decide landing; the full ETHOS proof of the exact head does.

## Commit and land

Commit in the Work Lane with an SSH signature and a `type(scope): summary`
subject that the ETHOS commit grammar admits, such as
`fix(layout): keep wires clear of cards`. Make each commit under the active
Change named by `ETHOS_CHANGE`. Land through `ethos land` after a passing proof;
never push `dev` or `main` directly.

## Release

`VERSION` is the only maintained product version. After changing it, run
`node tools/release/version.mjs --write`, and date the `Unreleased` notes of the
[changelog](CHANGELOG.md) at the release cut. A release lands like any change;
`ethos land --release` then signs the `vX.Y.Z` tag at the accepted head. Each
Forge publishes and verifies its own Release.

A Release holds the npm package, the command's archives and their declaration,
with `SHA256SUMS`. On macOS, from the tag's package:

```sh
SOURCE_DATE_EPOCH=$(git log -1 --format=%ct vX.Y.Z) node tools/release/archive.mjs assemble \
  --package architecture-publisher-X.Y.Z.tgz --out build/artifacts/release-X.Y.Z --platform all --official
node tools/release/archive.mjs declare --dir build/artifacts/release-X.Y.Z --version X.Y.Z \
  --base-url https://github.com/HengYangDS/architecture-publisher/releases/download/vX.Y.Z
```

`--official` downloads each platform's Node.js and Typst at the lock's URLs and
refuses any whose SHA-256 differs. Each CI platform builds its own archive from
the Node.js and Typst mise installed and checks that it builds what the checkout
builds.
