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

The package has four runtime dependencies: commander and `@clack/prompts`, which
the command line is built on, and `fast-wrap-ansi` and `fast-string-width`,
which wrap and measure a report's text and are clack's own dependencies at the
versions the lock already held. `package.json` lists the four under
`dependencies` and `bundleDependencies`, so `npm pack` puts them, with the three
packages they depend on, into the package; the lock marks each as `inBundle`
with its integrity. `tests/module-boundaries.test.mjs` admits the first two in
modules under `src/cli/`, the other two in `src/cli/report.mjs` alone, and
refuses all four in every other unit, `tests/installed-cli.test.mjs`
holds the packed package to the lock's bundled entries, each with its licence,
and the release archive copies each bundled licence into `archpub/licenses/`.

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
bundled `ip-address` and `undici` and in Markdownlint's KaTeX. The owner
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
covers the model, source binding, the measured facts, reading plan, layout, plates, the print
edition, the page's
diagrams and its delivery through the vendored Archify, deliveries with their data and reader file, acceptance,
publication, the
LikeC4 importer, the command line with its reports and its progress, the packed
and installed package, module boundaries, the version projection and the CI
projection. The unit `facts` (`src/facts`) measures every fact a plate draws that its
author did not state; `tests/module-boundaries.test.mjs` lets it import no other unit, lets
no unit that draws import it or `sources`, and refuses a measure of its catalogue defined or
called anywhere else. The unit `house` (`src/house.mjs`) is the one module that reads the house
tokens of `src/house.json`, as one read-only object, and imports no other unit;
`tests/one-source.test.mjs` refuses a module that reads the file again or restates a face's name or
a page's measure that it states. The tokens hold the measures the house class sets its pages by:
the pitch and the leading of text, the baselines of a page's head, a view summary's size and pitch, a
key mark's gap and middle, and the weights of a rule, a hair rule and a ring; the seal's cinnabar; and
the dash of a planned and a retired row's sample in the key. The unit derives the body's box, where a
plate's figure stands, from the page and the edition. The class reads the tokens once, the drawing and
the colophon page take them from it, and `tests/one-source-tokens.test.mjs` refuses a value written
again: a measure as a number, in the Typst always and in the JavaScript when no other measure has that
number, the cinnabar's hexadecimal, and a dash's name in the Typst; it refuses too a key of the tokens
that no file of `src/` reads. The unit `names` (`src/names.mjs`) imports no other unit and is the one
module that names a delivery's files, forms a page's and a plate's names, a number in two digits and a
revision cut to seven characters, and states the Typst version; `tests/one-source.test.mjs` refuses a
module that writes one of them again. It reads the table `src/shared.json`, which the overview stages
beside the house class: the files staged for the class and their directory, the delivered model's name,
under which the class attaches the model to the edition, the labels the class sets for the publisher to
query, and what a plate's key begins with. The class reads the table by its own name, and the test
refuses a name of it written again in the JavaScript or the Typst. The unit `pinned`
(`src/pinned`) writes the data and the reader file of a
delivery, builds the evidence table and a plate's face, and holds the three invariants of
projection; it imports `house` for the body's box, `locale`, `names` and `refusal` alone and is handed
everything else as values. Two flat
units stand beside the build: `manifest` (`src/manifest.mjs`) assembles the manifest and the summaries a
check reports, and `projection` (`src/projection.mjs`) gathers the pinned edition from what the build
prepared, has `sources` read at the pin the files only the guide cites and refuses a model id that takes a
delivery's file name. `projection` is the one unit that imports `pinned`. They are flat modules, and no
`src/build/` directory, because `.gitignore` holds an unanchored `build/`, which Git and the format
check would then pass over. `tests/evolution-queue.test.mjs`
holds every active Change to the queue of the product contract, and the design
of a queue item's Change to a page of `docs/research/`;
`tests/model-states-no-position.test.mjs` refuses a model schema that says
where anything stands; and
`tests/role-neutral-wording.test.mjs` refuses wording that presumes who holds a
role.

One test needs an explicit selection and otherwise skips; a skip is not
evidence. `tests/map-browser.test.mjs` opens delivered pages in Chromium at
1440 × 900 and measures the component labels of every preview and every full
viewer. It uses `ARCHPUB_BROWSER_EXECUTABLE` when set, or Playwright's own
headless browser; CI requires it.

The suite's files are processes of their own and build the same fixtures. Unless
the caller names a directory of Archify's answers, the environment fixture
names `archpub-test-answers` in the system's temporary directory
(`tests/fixtures/archify-answers.mjs`, through `ARCHPUB_ARCHIFY_ANSWERS`) and
keeps it between runs, so a candidate diagram is measured once on a machine
until its answer is a week old. An answer is kept by everything it answers (the
supply's digest, Node.js, the platform, the kind, the quality and the
document), so a changed candidate is asked again. Three tests count work and no seconds:
`tests/channel-conflicts.test.mjs` the reads of the channel solver's check,
`tests/page-single-run.test.mjs` the runs of Archify a build and a check start
for a page, and `tests/archify-answers.test.mjs` the runs a question starts
with an answer kept and with none.

`.gitattributes` gives `ethos-role=test` only to the suite's `tests/*.test.mjs`
entries, which `npm test` runs; fixtures and the command journey are tooling.
ETHOS requires every test-role file to run in its proof and every module to be
exercised. The importer runs its LikeC4 worker under Node's Permission Model,
whose children write no coverage, so the worker's own test runs it as a plain
child.

## Continuous integration

`.config/ci/pipeline.cue` owns one shared execution graph for Linux and macOS on
ARM64, which GitHub also runs for Linux on x86-64, and `node
tools/ci/projection.mjs --write` generates the GitLab and GitHub configuration
from it. On a release tag, once the protected jobs pass, GitHub
publishes the package to npm through its OIDC trust when the repository variable
`NPM_PUBLISH` is `enabled`. Its owner first publishes the package and names
`.github/workflows/verify.yml` as its trusted publisher on npm. GitLab and GitHub are equal optional
peers; `npm run check:ci` verifies the projections without contacting either.

GitLab runs no pipeline for a tag or a push of `dev`. Its holder publishes `dev`
only at a commit that a proposal branch's pipeline has run with the same commands:
ETHOS lands by fast-forward, and where several lanes land one after another, the
last one's proposal holds them all. A release commit is verified again when `main`
moves. Before a
release its holder starts one pipeline of `dev` through GitLab's API, which runs
the protected jobs, and releases only when it passes. GitHub, which does not run
on this host's guests, runs no workflow for a push of `dev` either, and runs on
every other push and on every tag.
Archify's answers to the suite's candidate diagrams stand in the tool cache,
kept between a guest's jobs and restored on GitHub from its cache.
Each job installs Chromium through Playwright, admits it by opening the browser
test's standalone page alone, runs the archive command journey and runs
`npm run check`, whose suite measures the delivered pages in the browser once.

Linux Docker jobs set `FF_USE_INIT_WITH_DOCKER_EXECUTOR=true` so an init process
reaps orphaned children, use a registry-verified Playwright image with a non-root
default user and keep Chromium's sandbox. Every platform keeps Chromium in the
job's tool cache, which a job's clean spares, so a move of `playwright-core`
costs one download a runner; the Linux image supplies Chromium's system
libraries. The npm test environment sets
`umask 022` within its own POSIX process. Repository text checks out as LF
through `.gitattributes`; third-party supply keeps its bytes. CI keeps `MISE_DATA_DIR` and `MISE_CACHE_DIR` inside the job-owned tool cache.
Actual hosted job results, not configuration, qualify each platform.
