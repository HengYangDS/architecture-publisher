---
subject: architecture-publisher:development
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Development and verification

Use the repository-pinned Node/npm line and lockfile:

```sh
mise run bootstrap
mise run check
```

`npm run check` is the repository's fail-closed quality entry. It composes
generated-input checks, Prettier and Taplo, zero-warning ESLint, checked
JavaScript types, module boundaries, dead-code analysis, Markdown and strict
OpenSpec validation, the test suite with at least 95 percent coverage in every
dimension, and packed-package validation. Vendored Archify, font, house face,
measuring, icon and LikeC4 supply stay outside first-party rewrite and coverage; their pinned
bytes are verified by the supply checks and behavior tests.

## Toolchain and supply

Development and CI use the exact Node.js and independently selected npm versions
owned by `.config/mise/config.toml` and its lockfile, not Node's bundled npm,
and the official Typst 0.15.1 that typesets the print edition.
Native `devEngines` admission rejects another development Node or npm before
installation or scripts. Every CI job uses the same locked selection in its own
ignored tool cache. The installed package itself needs only Node.js 22.13 or
later.

`npm run check:package` invokes npm's selected absolute CLI entrypoint to pack
with lifecycle scripts disabled, then checks the resulting archive through
publint's tarball API. Its temporary archive is removed on success or failure.
Run it through npm so Node's bundled npm cannot replace the selected version.

The supply checks bind each bundled supply to its recorded identity:
`node tools/supply/likec4.mjs --check` and `node tools/supply/icons.mjs --check`.
Archify's complete release archive is retained under `tools/supply/archives/`,
and the fonts, the house faces, the opentype.js measuring library and the icons
carry their licenses and digests in their `supply.json`.

The LikeC4 parser supply is rebuilt from the npm lockfile. npm `overrides`
hold glob, KaTeX, minimatch and Markdownlint's `re2js` past their advisories;
an override stays only while `npm audit` reports an advisory without it.

On 2026-10-25 the lock audit reported six affected development-package entries,
one high, one moderate and four low, from four distinct advisories in npm's
bundled `ip-address` and `undici` and in Markdownlint's KaTeX. The human
accepted those findings for trusted development input, isolated execution and
disabled installation scripts. The 0.4 retirement has since removed packages
from the lock; rerun `npm audit` before a release and reassess any change.

## Bootstrap

Development bootstrap is `mise run bootstrap`. It installs the locked npm
inputs with lifecycle scripts disabled, then runs `npm run generate`, which
reproduces the LikeC4 parser offline from locked inputs. Its output has an exact
ignore rule and remains included by the package's native `files` selection.
Generation is explicit: there is no `pretest` or `posttest` hook.

## Formatting and lint

Prettier is the sole Markdown spacing owner. `npm run format` fixes maintained
files; `npm run check:format` verifies the same inputs without changing them.
Markdownlint owns structural lint, not a second spacing grammar. Captured
research figures, vendor supply and archived specifications keep their recorded
bytes. Native tool policy lives under `.config/checks/<tool>/`; each npm script
passes its exact carrier. See [configuration ownership](configuration.md).

## Tests and coverage

The coverage gate selects every `.mjs` module under `src/`
and requires 95 percent of statements, lines, branches and functions. The suite
covers the model, source binding, reading plan, layout, plates, the print
edition, the page's
diagrams and its delivery through the vendored Archify, deliveries, acceptance,
publication, the
LikeC4 importer, the command line, the packed and installed package, module
boundaries, the version projection and the CI projection.

One test needs an explicit selection and otherwise skips; a skip is not
evidence. `tests/map-browser.test.mjs` opens delivered pages in Chromium at
1440 × 900 and measures the component labels of every preview and every full
viewer. It uses `ARCHPUB_BROWSER_EXECUTABLE` when set, or Playwright's own
headless browser; CI requires it.

`.gitattributes` gives `ethos-role=test` only to the suite's `tests/*.test.mjs`
entries, which `npm test` runs; fixtures and the command journey are tooling.
ETHOS requires every test-role file to run in its proof and every module to be
exercised. The importer runs its LikeC4 worker under Node's Permission Model,
whose children write no coverage, so the worker's own test runs it as a plain
child.

## Continuous integration

`.config/ci/pipeline.cue` owns one shared execution graph for Linux ARM64, macOS
ARM64 and Windows ARM64, and `node tools/ci/projection.mjs --write` generates the
GitLab and GitHub configuration from it. GitLab and GitHub are equal optional
peers; `npm run check:ci` verifies the projections without contacting either.
Each job installs Chromium through Playwright, admits it by opening the browser
test's standalone page alone, runs the archive command journey and runs
`npm run check`, whose suite measures the delivered pages in the browser once.

Linux Docker jobs set `FF_USE_INIT_WITH_DOCKER_EXECUTOR=true` so an init process
reaps orphaned children, use a registry-verified Playwright image with a non-root
default user and keep Chromium's sandbox. The npm test environment sets
`umask 022` within its own POSIX process. Repository text checks out as LF
through `.gitattributes`; third-party supply keeps its bytes. Windows refreshes
every tracked file with `git checkout-index --all --force` before tools run.
CI keeps `MISE_DATA_DIR` and `MISE_CACHE_DIR` inside the job-owned tool cache.
Actual hosted job results, not configuration, qualify each platform.
