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
dimension, and packed-package validation. Vendored Archify, font, icon, raster
and LikeC4 supply stay outside first-party rewrite and coverage; their pinned
bytes are verified by the supply checks and behavior tests.

## Toolchain and supply

Development and CI use the exact Node.js and independently selected npm versions
owned by `.config/mise/config.toml` and its lockfile, not Node's bundled npm.
Native `devEngines` admission rejects another development Node or npm before
installation or scripts. Every CI job uses the same locked selection in its own
ignored tool cache. The installed package itself needs only Node.js 22.13 or
later.

The supply checks bind each bundled supply to its recorded identity:
`node tools/supply/likec4.mjs --check`, `node tools/supply/icons.mjs --check`
and `node tools/supply/resvg.mjs --check`. Archify's complete release archive
is retained under `tools/supply/archives/`, and the fonts and icons carry their
licenses and digests in their `supply.json`.

The LikeC4 parser supply is rebuilt from the npm lockfile. Chevrotain 11.0.3
declares an older `lodash-es` exactly, so the workspace uses one npm
`overrides` entry to select patched `lodash-es` 4.18.1 until upstream removes
that constraint.

On 2026-10-25 the lock audit reported six affected development-package entries,
one high, one moderate and four low, from four distinct advisories in npm's
bundled `ip-address` and `undici` and in Markdownlint's KaTeX. The human
accepted those findings for trusted development input, isolated execution and
disabled installation scripts. The 0.4 retirement has since removed packages
from the lock; rerun `npm audit` before a release and reassess any change.

## Native raster source rebuild

Development bootstrap is `mise run bootstrap`. It installs the locked npm
inputs with lifecycle scripts disabled, restores the exact canonical prebuilt
Raster pair through the native `raster-supply` task, then runs `npm run generate`.
The LikeC4 parser is reproduced offline from locked inputs, and the Raster pair
is checked against `source.json` before preparation. The three runtime outputs
have exact ignore rules and remain included by the package's native `files`
selection. Generation is explicit: there is no `pretest` or `posttest` hook.

`ARCHPUB_RESVG_PREBUILT` may select a caller-owned directory containing the exact
`index.mjs` and `index_bg.wasm` pair. Both must pass their recorded size and digest
before either is prepared. Without that selection, generation checks the pair
already prepared by bootstrap. The native Git task retains one immutable source
revision; it never fetches a missing object or changes the index. Source custody
on a remote Forge remains separately unproved until its exact full-history clone
has completed bootstrap.

The installed raster renderer uses packaged Wasm; ordinary users need neither
Rust nor a platform shell. Source rebuilding uses native archive extraction,
Cargo and `wasm-bindgen`, with the exact toolchain and digests selected
by `packages/publisher/renderers/resvg/supply/resvg/source.json`.

In a caller-owned disposable directory:

1. Download the selected source archive through its native registry consumer.
2. Run `node tools/raster/resvg/verify.mjs --archive <archive>` before extraction.
3. Extract the verified archive with the platform's native archive tool. Keep
   the original extracted Cargo manifest and vendored dependencies unchanged.
4. Run `node tools/raster/resvg/verify.mjs --inputs <absolute-source-root>`.
5. Select the manifest's already installed Rust toolchain/target and matching
   `wasm-bindgen` without replacing another installation owner. From the extracted
   source root, execute the two native commands:

   ```text
   cargo build --release --target wasm32-unknown-unknown --offline --frozen
     --config 'build.rustflags=["--remap-path-prefix=<absolute-source-root>=/workspace"]'

   wasm-bindgen
     target/wasm32-unknown-unknown/release/architecture_publisher_resvg_wasm.wasm
     --target bundler --out-name index --out-dir native-output
     --no-typescript --omit-default-module-path
   ```

6. Observe `rustc -vV`, `cargo -vV` and `wasm-bindgen --version` from the selected
   executables. The native journey records their exact host, release and commit
   identities in caller-owned JSON; it is evidence, not another configuration owner.
7. Run `node tools/raster/resvg/verify.mjs --outputs <output-root> <tool-identity.json>`.
   The source manifest selects the exact pre-admitted native Wasm witness;
   unknown identities fail without a fallback or learned hash. Without the JSON
   argument, `--outputs` checks the canonical packaged bytes. Recheck `--inputs`
   too: successful compilation cannot waive source drift. The binding always
   matches packaged `index.mjs`; native output never replaces canonical supply.
8. Repeat from a second clean extraction, using a different relocated root and
   empty Cargo target. Both builds must match the selected witness. The native
   journey also compares canonical and rebuilt imports/exports, exact PNG bytes,
   selected fonts, text measurement, declared errors and an authored static workload.
9. Preserve command/tool identities, both input/output digests and behavioral
   comparison results, then reclaim only the caller-owned disposable roots.

The command is native on each platform; placeholder resolution and command-line
quoting belong to the caller's executor, not a repository Bash or PowerShell
controller. A resolved absolute source root is required: remapping `.` produces
different Wasm bytes. Native CI supplies the execution deadline. A successful
integrity test does not prove a full source rebuild or an untested architecture.
Native witnesses do not claim cross-host Wasm byte identity or universal behavioral
equivalence. New witnesses require independent clean-build evidence and review;
the source manifest remains their sole owner, not a runtime hash-acceptance list.
The evaluated `wasm-pack` wrapper is not selected: its metadata discovery rewrites
the original lockfile before applying its later offline/frozen build options.

## Formatting and lint

Prettier is the sole Markdown spacing owner. `npm run format` fixes maintained
files; `npm run check:format` verifies the same inputs without changing them.
Markdownlint owns structural lint, not a second spacing grammar. Captured
research figures, vendor supply and archived specifications keep their recorded
bytes. Native tool policy lives under `.config/checks/<tool>/`; each npm script
passes its exact carrier. See [configuration ownership](configuration.md).

## Tests and coverage

The coverage gate selects every `.mjs` module under `packages/publisher/src/`
and requires 95 percent of statements, lines, branches and functions. The suite
covers the model, source binding, reading plan, layout, posters, the map and its
delivery through the vendored Archify, deliveries, acceptance, publication, the
LikeC4 importer, the command line, the packed and installed package, module
boundaries, the version projection, the CI projection and the file budgets.

Two tests need explicit selections and otherwise skip; a skip is not evidence:

- `tests/map-browser.test.mjs` measures the delivered map's component labels in
  Chromium at 1440 × 900. It uses `ARCHPUB_BROWSER_EXECUTABLE` when set, or
  Playwright's own headless browser; CI requires it.
- `tests/conformance/journeys/raster/rebuild.test.mjs` rebuilds the raster
  renderer from `ARCHPUB_RESVG_SOURCE_ARCHIVE` with `ARCHPUB_RESVG_BINDGEN`.

`.gitattributes` gives `ethos-role=test` only to the suite's `tests/*.test.mjs`
entries, which `npm test` runs; fixtures and the raster journey are tooling.
ETHOS requires every test-role file to run in its proof and every module to be
exercised. The importer runs its LikeC4 worker under Node's Permission Model,
whose children write no coverage, so the worker's own test runs it as a plain
child.

## Continuous integration

`.config/ci/pipeline.cue` owns one shared execution graph for Linux ARM64, macOS
ARM64 and Windows ARM64, and `node tools/ci/projection.mjs --write` generates the
GitLab and GitHub configuration from it. GitLab and GitHub are equal optional
peers; `npm run check:ci` verifies the projections without contacting either.
Each job installs Chromium through Playwright, verifies the Raster source
closure and runs `npm run check`.

Linux Docker jobs set `FF_USE_INIT_WITH_DOCKER_EXECUTOR=true` so an init process
reaps orphaned children, use a registry-verified Playwright image with a non-root
default user and keep Chromium's sandbox. The npm test environment sets
`umask 022` within its own POSIX process. Repository text checks out as LF
through `.gitattributes`; third-party supply keeps its bytes. Windows refreshes
every tracked file with `git checkout-index --all --force` before tools run.
Mise's Rust declaration includes `cargo`, `rustc` and the host `rust-std`, and
CI keeps `MISE_DATA_DIR` and `MISE_CACHE_DIR` inside the job-owned tool cache.
Actual hosted job results, not configuration, qualify each platform.
