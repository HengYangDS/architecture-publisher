# Contributing

Thank you for helping. The repository holds the generic publisher only;
published works, such as the architecture of ETHOS, live in the separate
[architecture-publications](https://github.com/HengYangDS/architecture-publications)
repository.

## Report, propose or fix

- **A bug:** open an issue with the bug form. Name the version
  (`archpub --version`), the platform, the command you ran and its output with
  `--json`; a model that shows the problem is the fastest route to a fix.
- **A change in behaviour:** open an issue with the idea form before you write
  code, so the change can be agreed against the
  [product contract](docs/product-contract.md).
- **A fix or an agreed change:** fork the repository on GitHub, change it on a
  branch with a test that fails without your change, run `mise run bootstrap`
  and `npm run check`, and open a pull request. A maintainer lands it through
  the repository's governed workflow below; you need none of it.

## Report a vulnerability

Do not open a public issue. Write to the maintainer privately at the email
address on [their GitHub profile](https://github.com/HengYangDS), with the
version, what an attacker could do and how to reproduce it.

## Conduct

Be kind and assume good faith. Discuss the work, not the person; no
harassment, insults or unwelcome attention, in issues, pull requests or
anywhere the project is discussed. The maintainer may remove comments and block
people who do not keep to this. Report a problem privately to the address
above.

## Maintainers

This part is for maintainers who change, check or release Architecture
Publisher.

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

### Set up and verify

```sh
mise run bootstrap
npm run check
```

`mise run bootstrap` installs the locked Node, npm and Typst toolchains and the
locked npm dependencies, and generates the LikeC4 parser from locked inputs. `npm run check` is the fail-closed quality entry: formatting, lint,
types, module boundaries, dead code, Markdown, strict OpenSpec validation, the
test suite with at least 95 percent coverage in every dimension, and packed
package validation. `mise run fix` applies the native formatters. A local check
does not decide landing; the full ETHOS proof of the exact head does.

### Commit and land

Commit in the Work Lane with an SSH signature and a `type(scope): summary`
subject that the ETHOS commit grammar admits, such as
`fix(layout): keep wires clear of cards`. Make each commit under the active
Change named by `ETHOS_CHANGE`. Land through `ethos land` after a passing proof;
never push `dev` or `main` directly.

### Release

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
refuses any whose SHA-256 differs. A server error, a rate limit or a dropped
connection is retried at a doubling interval from 10 seconds to 2 minutes for up
to 30 minutes, so a short Forge outage does not stop a release; an archive
already in the tool cache is not downloaded again. Each CI platform builds its own archive from
the Node.js and Typst mise installed and checks that it builds what the checkout
builds.
