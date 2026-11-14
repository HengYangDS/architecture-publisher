# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic Versioning]. Versions below `1.0.0`
remain pre-release contracts and may contain incompatible changes.

## [Unreleased]

### Changed

- In an edition whose language is written without spaces between words, Chinese in either script, a part's details are
  set as a justified paragraph is, on strip and card plates: they break wherever the script allows, inside a list's
  item as between two, a last line takes the unit before it rather than hold one character alone, and each line except
  a detail's last is spread to the measure the details wrap to, so a part's details share one right edge as the
  edition's readings do. A line whose slack is more than a tenth of an em for each place it opens, such as one broken
  before a long word, stays flush left. Details in English, Spanish and Korean editions stay flush left with their
  items whole.
- In such an edition a part's details are filled by the width Typst sets their lines in. A line of Han and letters
  was measured in the CJK face alone, which is wider, and broke about a character early; it now holds what its
  measure takes. A strip part's counts end at its box's edge for the same reason.
- The engine measures Source Sans 3 and Source Serif 4 with their own pair kerning, as Typst sets them, so most runs
  of letters measure a little narrower, in every language. A part's box may move by a step of the grid, and a plate
  that only just could not take a larger type step, or set a tier on one row, may now do so.
- The README's plate is built by 0.13.1, which justifies a plate's reading; it showed a 0.11.0 plate.
- The install guide says that mise holds a release back for its first day and how to take the newest at once, and
  names the Homebrew formula and the npm package.
- A plate's key is set by its baseline, at 850 points on every plate, and each of its marks is centred on the middle
  of the label beside it. Marks stood on an edge 2 points below the baseline, so a band sat 2 points under its
  label's middle and the hub's line 6, like an underline; and the key's tallest mark decided where its text stood,
  846 points on a strip plate and 849 on a card plate.
- A strip plate's key shows the hub by a line of the plate's own weight that ends in its arrowhead, and names the
  mark: `dark lines lead to Supplies`, where it read `draws on Supplies` beside a bare stroke.

### Fixed

- An edition whose figure text holds letters Typst kerns apart, as `format: (json)` or `package.json`, is no longer
  refused with `edition_text_wider`. The font reader does not read the lookups where the house faces keep their
  kerning, so the engine measured such a run narrower than Typst set it.
- A plate's key longer than the body is wide ran past the margin and off the page. It now breaks between two entries
  onto a second line, the two set about the key's line, and a key that needs a third line, or holds an entry wider
  than the body, is refused with `edition_key_too_long`.

## [0.13.1] - 2026-11-13

### Security

- Development, CI and the release archives run Node.js 26.13.1, a security release of the Node.js 26 line. The
  archives carry the Node.js runtime the lock pins, so this release is how readers of the archives receive it.

### Changed

- The repository runs ETHOS 0.2.0-beta.9 through its published release declaration, locked like every other tool,
  with 0.2.0-beta.6 kept as the rollback. The publisher's behaviour, model format and manifest do not change.

## [0.13.0] - 2026-11-13

### Added

- A model may choose how its print edition draws its parts and in which palette, in an optional `edition` object:
  `marks` (画法), 条带 `strip` or 卡片 `card`, and `palette` (配色), one of 靛蓝 `indigo`, 柿漆 `persimmon`, 松烟 `soot`
  and 铜绿 `patina`, or one of its own. A palette of its own is held to contrast, chroma, lightness and hue rules, its dye steps turning
  through at most 60° of hue, and refused with `model_palette_rejected` at the colour that fails, with its measure
  and the bound. The reference gives two traditional palettes that pass them as examples.
- With `strip` marks, the new default, each part is a strip as long as its code on one scale for the edition, with
  one segment per file it owns, sized by the file's share of its bytes and dyed by its age band; every strip has one
  thickness, and no strip is shortened to fit: a view's columns are at least as wide as its longest strip. The
  largest part is 360 px long, or 240 px in an edition one of whose views cannot hold its strips at 360 px. Every
  edition uses the same age bands, changed within a week, within three months and earlier, counted
  back from the pin. Each relation carries one tick per file it cites, up to five; the build checks that a cited file
  exists, not that it proves the relation. The relations into a view's hub are drawn in the oldest dye, and a strip
  plate's key shows the age bands with the pin's date, a scale bar and the ticks.
- `archpub accept` sets a colophon page, `colophon.pdf`, beside the delivery: one page in the edition's size and
  language with a round acceptance mark in cinnabar, the publisher's word for accepted and the date on its rim and the
  reviewer's name across its band, and beside it an acceptance slip naming the reviewer, the time in UTC, the subject,
  the commit, the manifest's SHA-256, the signing key or "Unsigned" and the note, with the sentence that acceptance
  records who accepted which bytes and when and does not certify that the architecture is correct. No artifact of the
  delivery changes. A long name wraps to two lines inside the band before it shrinks. `--seal-name` sets another name
  on the mark; a name with a character no house face draws is refused with `acceptance_name_unset`, and one that does
  not fit the band with `acceptance_name_too_long`.
- `archpub accept --sign <private key>` signs the exact bytes of `acceptance.json` with `ssh-keygen -Y sign` in the
  namespace `archpub-acceptance` into a detached `acceptance.sig`, and the record names the key's fingerprint; a key
  ssh-keygen cannot use is refused with `acceptance_sign_failed` before anything is written.
- `archpub verify <delivery> [--allowed-signers <file>]` checks every artifact against the manifest, the acceptance
  record against the manifest and the colophon page, that `acceptance.sig` is present exactly when the record names a
  signer, and with allowed signers the signature for the reviewer, and refuses at the first link that fails.

### Changed

- **Breaking**: the manifest is version 7. Each cited file records its size and the date of its last change at the
  pin, and its `style` records the edition's marks, the palette's id or `custom` with its Chinese and English names,
  its resolved roles, and with strips the age bands' spans, the pin's date and the length its largest part is drawn
  at. Every default plate changes: a build that reads a checkout draws
  strips in indigo; one that reads none, or a model that claims no files, draws cards and warns `marks_fallback`,
  and a model that names `strip` without them is refused with `marks_need_files`. A model that wants cards sets
  `"edition": {"marks": "card"}`; the plates of 0.12 are not reproduced. On strip plates relation labels are set in
  the regular weight.
- An overview composition is set in the edition's palette: `green` is the palette's oldest dye and `ochre` its
  accent.
- **Breaking:** the acceptance record is an [in-toto Statement v1] whose subjects are `manifest.json` and
  `colophon.pdf` by SHA-256 and whose predicate, `https://github.com/HengYangDS/architecture-publisher/acceptance/v2`,
  names the reviewer, the optional seal name and note, the time of acceptance, the model and the optional signing key.
  `verify` and `publish` refuse a record of an earlier release with `acceptance_version_unsupported`; remove it and
  accept the unchanged delivery again. Published versions keep their records.
- `publish` copies the colophon page and any `acceptance.sig` with the delivery and refuses a page that is not the one
  the record names. A record that is not an acceptance Statement or names another manifest is refused with
  `acceptance_invalid` or `acceptance_manifest_mismatch`; `publish_unaccepted` now means only that the delivery has no
  record.
- The edition's foot names the commit as 提交 in Chinese and 커밋 in Korean, no longer 修订, 修訂 or 리비전.
- The specifications are validated with OpenSpec 2.0.0, which keeps the workflows and the validation; its
  changes to agent skills and slash commands do not apply, as the repository configures no OpenSpec tool.

## [0.12.0] - 2026-11-12

### Added

- `archpub <command> --help` prints that command's usage, what it does and the options it takes, and a usage error
  answers with the command's own usage. The usage block is derived from the command table.
- `archpub skill` prints the agent Skill that ships in the package and every archive. The Skill describes the print
  edition, the overview, the guide, re-pinning and acceptance, and a test holds every command, option and refusal
  code it names to the source.
- A model may name its `$schema` for its editor, and an unknown field names the nearest field of its object, such as
  `is not a model field; did you mean label?`.
- `check` and `build` warn with `repo_unused` when `--repo` names a checkout but the model claims and cites no file,
  so none is verified; results carry `warnings`, and text output prints each on its own line.
- Release archives for Linux and Windows on x86-64, verified by GitHub's CI on `ubuntu-24.04` and `windows-2025`, so a
  release has five archives. `mise use -g github:HengYangDS/architecture-publisher` installs the one for the machine.
- A tag publishes the package to npm with provenance through GitHub's OIDC once the protected jobs pass, when the
  repository variable `NPM_PUBLISH` is `enabled`; the package names its repository.
- A tutorial, how-to guides and a glossary. The README shows a plate, installs in one line and lists the published
  works; CONTRIBUTING gains a path for outside contributors, a private vulnerability report and a conduct section; issue
  forms and a pull request template join the repository.

### Changed

- Every reading of the print edition is justified like its prose, hyphenated in the model's language: a summary beside
  a figure is no longer set flush left in a column under 24 ems, and a summary above a figure is justified within 32
  ems when that takes no more lines than the engine reserved, and otherwise keeps the engine's lines, flush left.
- `check` counts one view in the singular, and the package's description names the print edition.

## [0.11.0] - 2026-11-11

### Added

- A view whose figure wires worse at 80 percent of the body keeps the full width and sets its summary above the
  figure, when the figure wires no worse in the height left below it: at 17 points of Source Serif 4, flush left
  within 32 ems in the title's column, without the heading for where each part lives or the paths. `archpub check`
  and the manifest record such a plate's reading as set above the figure. On the six published works, 16 of the 21
  plates that left their summary out set it above the figure; plates that set it beside the figure are typeset as in
  0.10.2.
- The engine breaks a summary above its figure as Typst sets it, with a quarter em between Han and the letters and
  digits beside it and full-width marks at half their width at a line's ends and side by side. It reads no kerning
  from the faces, so a line of Latin text can break a little earlier than Typst would; a line Typst sets wider than
  32 ems is refused with `edition_text_wider`.

### Changed

- The development and CI supply moves to the latest stable releases public for a day: knip 6.44.2, lucide-static
  1.70.0 and playwright-core 1.65.0 with their transitive updates, and the CI's mise 2026.11.5 with
  `jdx/mise-action` 5.2.7. The bundled icon artwork follows Lucide 1.70.0: 30 icons are added and none is removed.

## [0.10.2] - 2026-11-09

### Fixed

- A plate whose summary and paths are taller than the body sets its summary alone, without the heading for where
  each part lives or the paths, where 0.10.1 refused the edition with `edition_reading_too_long`. A summary alone, or
  paths beside no summary, taller than the body is still refused, since text is never shrunk. Plates whose readings
  fit are typeset as in 0.10.1.

## [0.10.1] - 2026-11-08

### Fixed

- The overview's masthead in the print edition sets its build line in the model's language, as the contents page
  does: a Chinese edition reads 构建于 and the revision, where 0.10.0 printed "As built at". A model that pins no
  revision gets no build line, where 0.10.0 printed a bare "As built at"; the overview checked alone keeps its
  English line.
- A cover title that holds Han, Kana or Hangul text and is wider than its column breaks at the space whose two lines
  both fit and whose wider line is narrowest, or else into lines of balanced width, so no line holds one character
  alone: 数据部门工作指南 is set as 数据部门 and 工作指南, AIGW 客户端投影 as AIGW and 客户端投影. Titles in other
  scripts break at their spaces as before.

## [0.10.0] - 2026-11-08

### Added

- The print edition: `<model id>.pdf`, typeset by Typst 0.15.1 with the house class. A title page of the work's name,
  question and summary over a byline of its release, editors, licence and publisher; contents that link to every page
  beside the edition's facts, scope, limits and a reading note; the overview set in place, its text still text; and
  one plate per view under a frame shared by every page, with a key of what it shows. Plates set their text live in
  Source Sans 3 and Noto Sans CJK SC, card titles link to the file each component was read from when the model names
  `repository.browse`, and the PDF conforms to PDF/A-3a and PDF/UA-1 with the model attached. Text Typst would set
  wider than the engine measured it is refused with `edition_text_wider`, and a plate title longer than its line with
  `edition_title_too_long`.
- Model version 3 names `editors`, each with an optional URL, a `license` as an SPDX expression and
  `repository.browse`. `archpub migrate` converts version 1 and 2 models, and refuses `attribution_not_migrated` until
  a model's editors are declared beside its attribution.

### Changed

- A delivery is named for its work: `<model id>.pdf`, `<model id>.html` and, in `images/`, `00-overview.png` and
  `NN-<view>.png` at 2400 px and `-<width>` at other widths. `--media` takes `edition` and `page`, `--png` names the
  edition's image widths, and the manifest is version 6, recording the edition, its plates and the date that dated it:
  the revision's commit, `SOURCE_DATE_EPOCH` or the time of typesetting.
- Each view is composed alone as a plate for the edition's body and admitted when some composition lays it out; a view
  none does is refused with `plate_unfittable`. A plate's page is its figure and its view's reading: a figure gives
  up width where it keeps its wiring and its view has a summary, or files to list, and the plate sets the summary and
  where each component lives beside it, justified or flush left by its column; a reading too tall for the body is
  refused with `edition_reading_too_long`. `archpub check` reports each plate's share of the body, its reading and the
  gates it misses. A planned view carries only its own summary; the model's is the title page's. A plate records the balance gates it misses rather than being refused,
  and the reviewer weighs them at acceptance.
- Figure text is measured in the house faces, Source Sans 3 and its semibold, with Noto Sans CJK SC for Han, and
  figures are drawn in the house palette, read with the class from one token file, `src/house.json`. opentype.js has a
  supply of its own, and Noto Sans has left the font supply.
- Development uses npm 12.2.2, and the mise lock names a checksum for every archive it installs, so mise 2026.11.2
  installs the toolchain in its safe and locked modes. The npm lock moves `@napi-rs/wasm-runtime` to 1.2.7, and a
  lock of npm 12.2.0 that no configuration read is gone.

### Removed

- The posters: `page-<n>.svg` and its PNGs, `overview.svg`, the page archetypes, grouping, heads, legends, notes,
  drafts, `poster_unbalanced` and the other `poster_*` refusals. `--media posters` and `--media overview` are gone.
- resvg, its Rust and `wasm-bindgen` build, the sax supply, the raster rebuild journey and the `raster_*` refusals;
  Typst renders every image. Pixi's Linux compiler and xz, which only the Rust build needed, and their CI steps are
  gone too.

## [0.9.0] - 2026-11-06

### Added

- A release delivers the `archpub` command as one archive for each platform the CI verifies, Linux, macOS and
  Windows on ARM64, with its own Node.js 26.13.0 and Typst 0.15.1, the package and their licenses; it needs only Git.
  The release's `architecture-publisher-<version>.mise.toml` names each archive with its SHA-256, so mise installs it
  as `http:archpub`. `tools/release/archive.mjs` assembles the archives deterministically and writes the declaration,
  and each CI platform builds a work with its own archive, byte-identical to the checkout's build.

### Fixed

- A browser that takes longer than two minutes to close no longer fails its test. Closing is cleanup: the test notes
  the delay and passes, and Playwright ends the browser when the test process exits, so a hung browser still cannot
  hold its runner. A loaded Windows runner failed the 0.8.0 proposal this way after every check of its pages had
  passed.

## [0.8.0] - 2026-11-05

### Added

- `archpub check --against <revision>` reports a re-pin worklist: per component, the owned files modified, moved with
  the component their new path falls to, or deleted, and the files its claims take in; per relation, the cited files
  that changed; the claims and relation files a build at the revision would refuse; the files that newly fall under no
  claim; and, for a model with a guide, each cited range as the same, shifted with its lines at the revision, moved,
  touched or gone. The JSON result holds it in `coverage.currency.worklist`.
- `archpub migrate <model> --out <file>` writes a version 1 model as version 2: each component claims the files its
  sources named, in their order, and each relation cites its sources' files. A file that several components cited
  stays with the first, and the command names it.
- The guide: a model may name an Archify explainer draft as `guide`, and the page is that guide. The build stages the
  draft and the local files it names and refuses a link, another path, a missing file or a draft for another
  repository. With `--repo` it has Archify verify every repository source the guide cites at the model's revision,
  through a temporary clone of the checkout, and pin its code excerpts. Archify's writing checks are strict at
  `showcase` and warnings at `standard`. The manifest records the draft's and each file's digest, the writing level
  and whether the sources were verified. `archpub scaffold guide` writes the generated page as a starting guide; a
  model without a guide keeps its generated page.
- The overview: a model may name a Typst composition, which the build typesets with the house class into
  `overview.svg` and PNG at the `--png` widths. The house class sets one 16:9 page in Source Serif 4 and Source Sans 3
  with Noto Sans CJK SC for Han characters, four type sizes and the house palette; its masthead and imprint name the
  model, its revision and the revision's date. A page is refused when text leaves its area or lies over other text,
  when a character no face draws, a component the model lacks, a package, a plugin or a size, face or colour of the
  composition's own appears, or when Typst warns. Building an overview needs Typst 0.15.1; the other media do not.
- Source Serif 4 4.005 and Source Sans 3 3.052, unmodified with their licences, as the house supply.
- A model may declare `coverage`: the repository paths it describes and those it leaves out, each with a reason. A
  path may be a glob, with `*` within one path segment, `**` across segments and `?` and `[…]` one character, so
  `**/*_test.go` leaves out the tests beside the code; Git matches it at the model's revision, case-sensitively on
  every platform.
- `archpub check` lists the components and relations that no planned view draws and those that cite no source. With
  `--repo` it reports the model's coverage of the repository at its revision: files and bytes in scope, cited,
  uncovered and excluded, and the largest directories that hold no cited file. With `--against <revision>` it reports
  the commits since the model's revision and whether each cited file is unchanged, modified, moved or deleted. The
  reports are counts and never refuse a model.

### Changed

- **Breaking:** model version 2. A component claims the repository paths it owns in `files`, a directory ending in `/`
  or one file, each claimed once; a file in the coverage scope belongs to its most specific claim. A relation cites in
  `files` the files that evidence it. The `sources` catalog, its ids and authored digests are removed, and a version 1
  model is refused with the command that converts it. With `--repo`, ownership is resolved at the model's revision;
  a claim that owns no file in the scope or a relation file the revision lacks refuses the build with
  `files_unresolved`. The manifest, now version 5, records every cited file with its digest, its owner and the
  relations that cite it. The coverage report counts owned files, the generated page numbers its sources `source-1`
  onward and cites each component's first file, and `check` lists the components and relations without files.
- A page of more than four views lists no panels beside its conclusion, whose reasons Archify caps at four; its panels
  stay numbered in the plan's order.
- The development and CI supply moves to the latest stable releases: `globals` 17.14.0, re2js 2.9.1 and minimatch 11.0.4
  through their overrides, and 31 locked packages to the newest releases their ranges allow. The lodash-es override,
  which no longer changed the lock, is retired. The LikeC4 parser supply is rebuilt from the refreshed lock. The Linux
  CI image is rebuilt on the re-published Playwright 1.64.1 image. `npm audit` reports no advisory, and the published
  package declares no dependency.
- The raster renderer is rebuilt from the relocked source closure `0.49.0-f55157d60abd`: crc32fast 1.5.4 and
  unicode-script 0.5.9 within resvg 0.49.0 and `wasm-bindgen` 0.2.130. The closure is in the GitLab package registry and
  a GitHub release, the canonical renderer pair is held in Git custody, and its macOS, Linux and Windows ARM64 native
  rebuilds are admitted witnesses.
- The development and CI supply moves to `semver` 7.8.6 and `jdx/mise-action` 5.2.6, which ends a step that hung for up to
  ten minutes when a cache restore failed.
- The GitLab project moved to `dig/misc/tools/architecture/architecture-publisher`, beside the group's other tools.
  The raster renderer's source record names the closure's package registry there, the supply manifest derives the
  closure's location from that record, and the links to the early tags follow it.

### Fixed

- On Windows, an overview refusal names the composition's line instead of the temporary file Typst read.
- An overview composition that the model names but that is not there is refused with `overview_composition_missing`,
  naming the model's `overview` and the path looked at, instead of with Typst's error about a temporary file or a bare
  `ENOENT`.

### Removed

- **Breaking:** the four-view limit. A model declares any number of views, and an automatic overview plans one view for
  every group. The refusals `model_views_exceeded` and `plan_views_exceeded` and the LikeC4 import warning
  `likec4_view_limit` no longer occur.

## [0.7.0] - 2026-10-31

### Changed

- The raster renderer is rebuilt from resvg 0.49.0 with `wasm-bindgen` 0.2.130 on Rust 1.99.1, and the icon supply carries
  the complete Lucide 1.66.0 artwork. The source closure `0.49.0-3772b25b2c10` is in the GitLab package registry and a
  GitHub release, the canonical renderer pair is held in Git custody, and its macOS, Linux and Windows ARM64 native
  rebuilds are admitted witnesses. The five editions' posters and pages are byte-identical to 0.6.0; their manifests
  name the new publisher version and supply digests.
- The development and CI supply moves to the latest stable releases: Node 26.13.0, ESLint 10.14.0, Knip 6.44.1,
  OpenSpec 1.16.0, `@types/node` 26.6.6, Mise 2026.10.25 and `jdx/mise-action` 5.2.5. Overrides take glob 14.0.3,
  minimatch 11.0.3 and KaTeX 0.19.1 past their advisories, and the npm package, whose bundle carries advisories no
  override reaches, is no longer a development dependency, so publint lints the package directory instead of packing
  it; `npm audit` reports no advisory. The published package declares no dependency and is unchanged.
- The channel solver and the page composer are split by responsibility into modules under `layout/channel-solver/`
  and `poster/compose/`, each within the 500-line code ceiling that ETHOS 0.2.0-alpha.23 sets, and the repository's
  512-line ESLint budget, which restated that ceiling, is retired. Deliveries are byte-identical.

### Fixed

- The GitLab jobs run again. The Linux job extends its image's `PATH` in its script, because GitLab does not expand
  `$PATH` in a job variable and the job's shell then found no `rm`; the Windows job writes Mise shims as command
  files, because its runner refused Mise's copies of `mise-shim.exe`.
- The protected GitLab Windows job links the raster renderer again. Under its build directory a Rust standard library
  file in the workspace's tool cache took 260 characters, a path the MSVC linker cannot open, so the Windows jobs keep
  the Rust toolchain under the runner's builds directory.

## [0.6.0] - 2026-10-31

### Changed

- **Breaking:** Posters of an unchanged model are drawn differently. A relation label on its own run less than 48 px
  above or below another relation's turn reads as that wire's label, and is a route defect the channels avoid. A
  poster wire that passes a row through a gap where every offset runs as short takes the middle of the gap, and a page
  that would set its tier labels nearer than three gutters to the text of a rail beside them is not drawn. The AIGW
  overview, the self model's overview and grid layout, the browser-use overview and the context-mode sandbox posters
  change.

## [0.5.0] - 2026-10-31

### Changed

- **Breaking:** Posters of an unchanged model are drawn differently. Two relations' runs in line on one row, less
  than 400 px apart across a third relation's wire, read as one line unless both leave or both enter one card, and
  two wires closer than 40 px that each turn inside the other's length hook past each other; both are route defects
  the channels avoid. A card's one port stands 40 px off its centre where that centre lines up with a wire into the
  card across the channel that its own wire does not enter, and a figure whose channels turn no wire beside another
  card than its own wins a tie in route defects. The ETHOS overview, intent and hook posters, the context-mode
  retrieval poster and the self model's grid layout poster change; the grid layout prints its five mechanisms in one
  row on a sparse page.

### Fixed

- A browser test fails after two minutes instead of hanging while the browser starts, opens the standalone page or
  closes, and every test file exits when its tests end; one hosted Windows run had spent its time limit on a hung
  browser test.

## [0.4.0] - 2026-10-30

### Added

- A model may name its language: English, the default, Simplified or Traditional Chinese, Spanish or Korean. The
  words the publisher writes itself, its note headings, legend, derived details and summaries, and how it punctuates
  a list or a sentence, follow it, and the page and its diagrams speak it. `archpub import likec4 --locale` sets it.
- Lines break where the text's writing system allows: at spaces, and between Han and Kana characters, with closing
  marks kept at the end of a line and opening marks at the start of the next. A no-break space keeps the words beside
  it on one line, on the posters and the page.
- Noto Sans 2.015 follows Noto Sans CJK SC for the Latin, Greek and Cyrillic letters the CJK face lacks. Text in a
  right-to-left or shaped script is refused with `script_unsupported` rather than drawn unjoined.
- `archpub build` and `check` take `--media` to deliver the posters, the page or both, `--png` for the poster PNG
  widths, from 1 to 6000 px, and `--quality standard` to deliver the closest pages as drafts. `archpub --help` and
  `--version` print the usage and the version.
- Architecture Publisher is released under the MIT License.

### Changed

- **Breaking:** Architecture Publisher is now a general model-to-media publisher. One Architecture Model, a JSON file
  written by a person or an agent or imported from LikeC4, becomes posters of its views, one interactive page and a
  manifest through `archpub check`, `build`, `import likec4`, `accept` and `publish`. A model declares at most
  four views. The Source Bundle, Claim
  Model, Edition, Candidate, Provider, Qualification and publication-plan inputs and commands are removed; earlier
  releases keep them.
- **Breaking:** A grid-first layout replaces the ELK composition. Cards sit on shared row lines of one column
  lattice, each poster card as wide as its text and the cards of one column one width; placement is exact, relations
  run as buses, corridors, lanes and straight arrows through the channels between rows, and a layout with a diagonal,
  a shared segment, a wire through a card or a touching label is never drawn: a view that no layout draws is refused.
  A refusal names every view it refuses. Rows that a view does not declare minimize the rows their relations skip.
- **Breaking:** Posters are 16:9 pages of 2400 × 1350 px with no text below 14 px, delivered as `page-<n>.svg` and as
  PNG at 2400 px or the widths a build names. A page holds one to three views as plates under a masthead, beside a rail
  of text, or with its text set in the corners its figure leaves free. Cards are as large as their text, a sparse view
  is set at a larger type step of up to 1.8 times, tier labels stand in one column before the figure, or before the edge
  each tier starts at when no page with one column balances, a tier that wraps has its label level with its first row
  beside a bracket over its rows, and the edition is grouped into the fewest crossings and route defects, then the fewest
  pages that miss the balance gates for the largest empty area, blank bands, holes and centre of mass, each page
  preferring the composition with the fewest crossings and route defects. A page whose figures already stand at the
  largest type step, or at the largest step they fit at with only its largest blank area or a blank band over the gate,
  is delivered as sparse, since its model has too little to fill it; a build at standard quality delivers any other
  closest page as a draft; otherwise a view no passing page holds is refused with `poster_unbalanced` and its closest
  page's measures. The manifest records every page's admission and misses, and per-relation evidence moves to it.
- **Breaking:** The interactive medium is one vendored, unmodified Archify 3.2.0 explainer page that answers the model's
  question view by view: its conclusion beside a list of its panels, then one panel per view with its native
  architecture diagram, named by the view, which opens Archify's full viewer, and steps that light each component and
  cite its first source at the pinned revision. Each diagram is chosen on Archify's own routes from three widths and
  three row wrappings, with the grid's connection sides and with Archify's own side planning. It never takes routes a
  reader reads as one, side by side, lined up end to end or two cards' routes into one point, or a route along a card's
  or the boundary's edge, while another passes without; then it takes the fewest crossings, the fewest labels a reader
  takes for another route's, a card's or another label's, one of which comes nearer than 8 px or than one and a half
  times the label's own route, or set between two routes with its text not clearly nearer its own, then a preview
  beside its steps, routes doubled into one line, routes over two bends, crowded labels and crowded route ends. A view
  that stands above its steps is also tried in rows of two, narrow enough to stand beside them. The connections
  involved take other sides while that improves the diagram, and a label still misplaced, or on another route's line
  past its corner, is pinned on or beside its own route in up to three rounds, by an offset from where Archify anchors
  it, which keeps the route's ends spread.
  A card shows a detail whole or not at all, and the steps carry every detail. The diagram passes Archify's checks at
  the build's quality profile, showcase unless the build asks for standard, or the build is refused with a `page_*`
  code and Archify's findings.
  Sources Archify will not cite, such as files under a secrets directory, are withheld and recorded in the manifest.
- A failure that is not a refusal or usage error exits with status 3 and an `internal_error` JSON body. Git and
  Archify run with only the caller's path, home and temporary-directory variables, and `SystemRoot` on Windows.
- Deliveries are staged and byte-reproducible on one platform. The manifest keeps each poster page's measures, each diagram's route
  measures and the details, statuses and sources of every component and relation. `archpub accept` records a reviewer against the manifest digest, and
  `archpub publish` copies only an accepted delivery and never replaces a different published one.
- `VERSION` is the only maintained product version. Required package versions and internal pins are generated from
  it; qualification rejects stale projections without changing package or lock bytes.
- Refresh the locked development and CI supply: Node 26.12.1, npm 12.2.1, OpenSpec 1.15.0, Knip 6.43.0, Pixi 0.83.0
  and Mise 2026.10.19. The remaining development-tool advisories keep their explicit trusted-input,
  isolated-execution and disabled-install-script acceptance.
- Admit the observed macOS, Linux and Windows ARM64 Raster witnesses for Rust 1.99.1 and `wasm-bindgen` 0.2.129 after
  two relocated frozen builds and canonical behavior comparison. Packaged renderer bytes remain unchanged.

### Removed

- The ELK, Dagre, libavoid and SVG pan-and-zoom supplies, the custom interactive renderer, JetBrains Mono, the
  generated validators and the research-only composition tooling.

### Fixed

- Posters render on Windows: the raster renderer and the typefaces load through file URLs.
- LikeC4 errors name their file relative to the workspace on Windows too.
- The page chooser measures each candidate diagram once per process, and CI admits the browser by opening one
  standalone page instead of building the browser test's pages twice, which hosted Windows runs had spent their
  time limit on.
- A poster wire no longer turns just beside a card it does not connect when a channel can take another label row
  instead, so it does not read as that card's; such turns, and two wires within 40 px of each other for more than
  96 px, are counted as route defects.
- A poster channel takes the routing whose own wires make the fewest route defects, measured as the page measures
  them: two wires into one card from one side turn on two label rows instead of running side by side on adjacent
  tracks, and a wire that turns on a label row keeps 48 px from a card it does not connect. A view is printed on a
  sparse page when that wires fewer faults than every balanced page of it.
- The raster rebuild journey renders a poster the current publisher composes and extracts the frozen source where
  Windows tar can.
- Locked CI Rust installation reconciles the required `cargo`, `rustc` and host standard library components in
  retained tool caches.
- Native CI retains only each job's verified tool cache across checkout, confines Mise's package store to the job,
  enables Git long paths on Windows through job-scoped configuration and selects a registry-verified non-root
  Playwright image on Linux.
- Native CI admits locked rootless Linux compiler and xz prerequisites through Pixi and discovers the Windows Visual
  Studio tools before frozen Raster rebuilding.
- Raster source verification uses a platform-native, read-only Node entry; native Cargo and `wasm-bindgen` own
  compilation, and frozen renderer bytes and historical release artifacts remain unchanged.

## [0.3.0-alpha.15] - 2026-10-04

### Added

- Bounded independent interactive appearance with native style and light/dark choices, preserving selected source
  meaning, typography and authored geometry.
- Native exploration over checked logical relations and scene occurrences, with neutral Inspect identity retained where
  grouping or repetition limits queries.

### Fixed

- Query sharing remains selected when the reader opens Export. Copied native reading links address the standalone
  publication and its exact page.
- Back, Forward, reload and rapid page changes restore the native addressed selection without hidden iframe history
  entries or automatic playback.
- Every physical relationship carrier remains inspectable even when a shared logical route has already supplied its
  label.
- Static view classification follows its own selected assertions, not unrelated sibling selections. Pure claim text uses
  bounded content-dependent flow.
- Static line breaks preserve source whitespace; fragment bounds exclude notes that are independently composed and
  checked by the complete figure.
- Native relationship captions use readable text paint across offered styles without changing source geometry or the
  native reader's control ownership.
- Clipboard actions respect the document's effective permissions policy; opaque readers use native text-copy fallback
  without invoking a forbidden API.
- Inspect cards retain readable title and detail colors in idle, hover, selected and keyboard-focus states across every
  offered style and light/dark theme.

## [0.3.0-alpha.14] - 2026-10-03

### Changed

- Native qualification uses two concurrent test files through Node's existing runner. All test files, offline
  installation checks, child deadlines and four coverage floors remain; no runtime scheduler or persistent cache is
  added.
- The CoreText asynchronous font-binding counterexample rejects an originally mismatched digest before compilation.
  Actual native font, request and output snapshot checks remain in the existing measurement case.

## [0.3.0-alpha.13] - 2026-10-03

### Fixed

- Raster third-party source notices identify the selected source archive and Cargo.lock instead of stale predecessor
  bindings. Required license text and renderer runtime bytes are preserved; supply checks reject mismatched headers.

## [0.3.0-alpha.12] - 2026-10-03

### Fixed

- Static qualification respects explicitly unarrowed segments: short junction bridges retain their actual shaft, without
  an invented arrowhead or arrow terminal minimum. Arrowed and historical default-arrow checks, attachment, source-route
  direction and glyph clearance remain enforced.

## [0.3.0-alpha.11] - 2026-10-03

### Fixed

- Authored static and interactive labels can declare their scene-local node owner. Exact structural membership and
  measured containment are checked; unrelated nodes, internal primitive boundaries, text, routes and arrowheads remain
  obstacles. Ownerless scenes retain their existing behavior.

## [0.3.0-alpha.10] - 2026-10-02

### Fixed

- Native verification preserves setup timeout errors, signals and diagnostics instead of reporting a missing exit status
  without its cause. Disposable offline supply installation avoids unnecessary manifest and lock writes without changing
  sequential installation, runtime deadlines or coverage.

### Changed

- Canonical specifications carry the complete authored qualification and single-parent stage-deadline contracts. General
  SDD research resides with the ETHOS topic owners; publication keeps its own custody decisions.
- Closeout separates completed archive prerequisites from later native lifecycle effects, without declaring an
  unexecuted archive or retirement.

## [0.3.0-alpha.9] - 2026-10-02

### Added

- Explicit authored Claim and editorial statement text in both independent media. Opaque original statements need no
  fabricated document box; typed Claims retain exact structural owners. Required text cannot silently fall back to a
  shared subject label, and existing valid anchored v1 inputs retain their meanings and limits.
- Measured standalone statement text in the Archify adapter, with exact bundled font bytes, native desktop readability
  and geometry checks, page-local runtime receipts, and source/Edition-separated keyboard inspection. Wording remains
  unverified rather than pretending identity coverage proves a paraphrase.
- Finite circle, rectangle, line and polyline painting in authored media. Derived ink bounds remain separate from
  semantic ports; checked geometry-only adornments add no source coverage or inspection. Cancelling filled contours,
  false envelopes, mixed legacy painting and excessive path budgets are refused.
- Exact ordered relation and Edition-owned editorial routes over shared literal segments. Physical junctions remain
  geometry, each source reference retains independent inspection, and every route checks actual contacts, terminal
  direction, selected stroke and arrow paint without transitive source claims.
- Exact authored font resources across direct, declarative and executable inputs. Selected static TTF faces, weights and
  distribution references bind native shaped ink, exported fonts and independent SVG/PNG/HTML painting; absent glyphs,
  changed pins and unsupported text fail without ambient fallback.

### Fixed

- CoreText stages use one parent-owned execution deadline and native tree reclamation, without a competing Worker
  timeout. Diagnostic-read failures remain separate from the primary timeout; stage ceilings and fail-closed cleanup are
  unchanged.
- Authored static and interactive diagrams retain every graphic occurrence of one selected semantic member without
  cloning source entities or relations. Claim anchors remain bound at each site; inspection rejects conflicting facts
  and duplicate reference/graphic pairs.
- Static typed Claims retain both visible text and every exact structural owner; neither proof replaces the other. A
  missing relation or subject owner is refused without substituting another anchor.
- Aggregate connectors reject reversed or ambiguous source relations even when another member points forward. Internal
  context remains bound to its owning node rather than borrowing the connector's arrow direction.
- Browser test resources release dependants before HTTP servers through native async disposal. The repository uses its
  existing process-isolated Node test workers, without another scheduler or relaxed coverage floor.
- One native Markdownlint configuration covers maintained Markdown, rejects extra simple-list spacing, and preserves
  embedded-language, raw HTML, historical archive and supplier bytes.
- Native measurement reply admission has one private protocol owner with direct portable counterexamples.
  Invalid-response fixtures preserve a finite live Worker for reclamation; actual premature exit remains cleanup
  uncertainty. Coverage scope and all four 95-percent thresholds remain unchanged.

## [0.3.0-alpha.8] - 2026-10-02

### Changed

- Development and CI select Node.js 26.10.0 and npm 12.2.0 through native `devEngines` admission. The installed Core
  still supports Node.js 22 and later; known npm bundled-dependency advisories remain subject to the scoped CI
  exception.
- The repository coverage gate uses one native c8 configuration and emits a fresh JSON summary for all four 95-percent
  thresholds.
- The development workspace uses OpenSpec 1.14.0. A relocated task fixture verifies the official apply instruction's
  source path and one-based checkbox line. This development-tool upgrade leaves the released product unchanged.

### Fixed

- CoreText workers retain a finite live lifetime after their reply so parent group reclamation cannot race natural
  worker exit. Coverage is flushed before forced termination; stage ceilings and strict cleanup failures remain
  unchanged.
- Installed-use tests invoke the selected native npm CLI instead of a Windows command shim. Post-execution identity
  tests retain the existing Provider bound rather than an accidental two-second fixture limit; timeout tests remain
  bounded.
- Repository checkout preserves generated and supplier bytes independently of host CRLF settings. Native Windows CI
  clones rather than retaining a previous fetch checkout with transformed files; generation comparisons remain exact.
- ELK layout workers retain a bounded live root after both success and error replies and flush enabled coverage before
  native reclamation. Root loss still rejects cleanup; layout geometry, stage ceilings and static media are unchanged.
- File publication flushes owner, payload and metadata files through writable handles instead of reopening the owner
  file read-only. Effect results declare unsupported Windows directory flush and unqualified power-loss recovery;
  required flush errors still reject installation.
- Native-platform tests distinguish filesystem paths, import URLs, npm command shims and interruption exit observations.
  Historical Windows repacks verify complete source file sets and bytes without claiming POSIX TAR-header equality.
- Raster execution classifies a nonzero exit without reply bytes as process failure, preserving malformed-reply and
  explicit worker-error diagnostics.

### Added

- Native Windows ARM64 CI shares the complete repository gate. Linux, macOS and Windows review/protected projections
  select distinct Runner trust roles.

## [0.3.0-alpha.7] - 2026-10-01

### Fixed

- CoreText compilation and measurement use separately bounded owned process groups. The parent reclaims each group
  before the next stage or scratch removal, retains bounded primary diagnostics and cleanup uncertainty, and preserves
  exact tool selection and the existing 120-second/30-second limits.
- Native macOS CI uses one project-local GitLab resource group while retaining separate review and protected Runner
  identities. This removes job overlap, not every possible compiler stall; original failing jobs remain evidence.

## [0.3.0-alpha.6] - 2026-10-01

### Added

- Native macOS ARM64 CI runs the existing repository gate, including CoreText tests, with separate review and protected
  Runners selected by GitLab ref protection. CI jobs use a reproducible artifact permission mask for historical
  npm-package replay.
- A finite static responsibility form composes editor-attributed roles and handoffs with exact source relations, linked
  Claims, qualifiers, and limits through its own SVG/PNG Scene. Unsupported forms fail before Candidate output; traffic
  is not reinterpreted as authority or source endorsement.

### Changed

- Current Edition guidance starts with the selected-input Project and a concrete field-to-reader-choice map, separating
  retained historical v1 input from new authoring. Package guidance explains inputs, the build command, output records,
  and the limits of question coverage; export research is not advertised as implemented PDF or PowerPoint support.
- Neutral interactive graph pages carry measured, wrapped relation wording directly on their routes. Compact source
  Claims retain visible applicability; full records move to Inspect without duplicating primary graphic identities. The
  existing font measurer is reused and its selected supply is recorded.
- Replaced the unreleased neutral interactive Cytoscape path with pinned ELK geometry, exact SVG painting, and
  viewport-only pan/zoom. Parallel relations, cycles, self-loops, group containment, full arrow bounds, and cached-page
  restoration have explicit regressions. Eligible long causal graphs can use ELK wrapping; static geometry remains
  independent. The unreleased library export is now `renderers/interactive`, with no compatibility facade.
- Interactive responsibility pages now present roles, selected source nodes and relations, editorial handoffs, and
  linked Claims in one bounded visual map. A selected predicate keeps its spelling; an unlabeled source relation gains
  no invented predicate caption. Page-local SVG identifiers keep titles, descriptions, and arrow markers distinct across
  pages.
- Current product documentation separates Candidate construction from qualification, named acceptance, and local effect
  authorization; historical release references use absolute Forge tag URLs rather than invalid local filesystem-relative
  paths.
- Interactive responsibility pages now use a higher-contrast source-relation metadata tone. A source-preserving
  four-role trial exposed a WCAG AA failure in the former tone; the corrected neutral renderer changes interactive bytes
  only and does not transfer prior media approval.
- Successor builds no longer execute a Provider solely because its manifest is named by an input file. Executable
  materialization now requires the invoker's separate exact `--execute-providers` selection; direct and declarative
  builds need no such option. Historical released v1 input behavior is unchanged.
- The first-party self Edition now authors one Edition Project directly. Its static overview selects structural
  assertions, while the eight interactive views select the exact Claim facts. Preparation no longer emits an editable
  legacy Edition or a self-only publication plan; signed historical releases retain their original files and meanings.
- Corrected the current self-model's authoring schema and direct Build Request selection. The generated Source Bundle
  remains audit evidence, not a second selected build input; a formerly asserted Bundle-to-Build edge is removed.
- Kept dated ETHOS and AIGW handoffs as historical conformance fixtures, not live authorities for the self-Edition. Its
  successor adopter relations now describe targets requiring source-owner acceptance; removed the obsolete `0.2-pending`
  publication condition. The changed packages use a new `0.3.0-alpha.6` identity without altering the signed alpha.5
  release.
- Neutral interactive source controls now project the diagram's selected node or relation through `aria-pressed` and a
  per-page `role=status` live region without moving keyboard focus. This does not qualify a source Edition's static text
  alternative or prove a particular screen reader's behavior.
- Neutral interactive pages with typed source claims but no graph now retain editor-attributed assertions in Page
  evidence instead of hiding them. Source quantifiers and stronger editorial propositions remain visibly distinct; this
  does not validate either proposition's underlying truth.
- Authored static Scenes may select a description distinct from the visible subtitle. SVG exposes name and description
  separately; the self-Edition now authors a target-flow alternative. Missing adopter-specific descriptions remain an
  accessibility acceptance limit, not inferred Publisher content.
- An Edition view may declare reasoned source-qualified member pairs that must not appear in one visual group. The
  compiler rejects a conflicting group before layout instead of presenting a misleading aggregation.
- An authored static canvas now records visible free wording as unverified even when its source-to-graphic bindings
  pass; exact geometry is not a judgment about the wording's meaning.
- Static and interactive media now visibly attribute free title and summary text to the Edition editor and state that
  source endorsement is not evidenced by the diagram. The wording still requires semantic and human review.
- Neutral static SVG/PNG retains reader-question limits and source status but no longer prints compiler method-limit
  codes as figure copy. Each exact method limitation remains in the Candidate and interactive disclosure; neither medium
  gains acceptance from this presentation change.
- Claim Model entity and relation views may omit editorial visual groups. The selected Dagre supply renders their flat
  structure without inventing group membership; claim-only views retain their separate claim-card composition.
- A sole neutral raw entity/relation view now uses the same question-led figure composition as multiple views, rather
  than placing its question and source notes in a separate side rail. An upstream authored view retains its own selected
  layout. This changes affected static media bytes.
- Neutral structural nodes now share one measured, 32-unit-grid box size per view. Dagre prefers regular-row alignment
  and falls back to balanced placement only when a relation caption cannot clear the regular routes. Longer labels still
  require sufficient space rather than smaller text.

## [0.3.0-alpha.5] - 2026-09-29

### Changed

- Updated the pinned development image to Node.js 26.10.0 and the direct `@types/node` and Prettier dependencies to
  their latest stable releases. The Core package still supports Node.js 22 at runtime.
- Updated the selected offline Archify renderer from 2.16.0 to 3.0.1. The adapter binds Archify's required `meta.output`
  to a private candidate slot while preserving the caller's input digest and explicit destination. It disables Archify's
  update check during rendering and uses the release's self-contained, licensed font bytes instead of injecting a second
  font set. Interactive artifact bytes change and require new exact-byte acceptance.
- Replaced the interactive reader's dead-end source-code placeholder and page-wide fact dump with one reversible
  `Inspect` state. It indexes visible subjects, preserves every selected record, distinguishes source identity from
  source content, and returns keyboard focus to the invoking graphic or control.
- Reconciled current Provider v2 and source-adopter migration guidance with the signed `v0.3.0-alpha.4` release, without
  treating Publisher release as source acceptance or independent off-host recovery.
- Moved the recorded typography reader from the SVG renderer surface to the Scene authoring surface as
  `createRecordedMetricReader`. Existing signed releases retain their original API and bytes.
- Moved Build Request joining to private compiler input coordination and removed its low-level Provider export. The
  public `archpub edition build` operation remains the complete consumer path.
- Moved authored Scene pre-render geometry rules to the Scene owner and emitted SVG-path inspection to Qualification.
  The compiler coordinates both without defining either predicate.
- Separated bounded file input and strict protocol values from Source Bundle meaning. Independent editors receive two
  file-input operations; the Source subpath no longer exports generic file and validator primitives.
- Moved raster Source Bundle selection and CoreText result packaging to the rendering owner. Resvg and CoreText backends
  now expose byte-level operations without Source Bundle authority; the compiler no longer creates a temporary bundle to
  rasterize its already-selected SVG. The existing CLI command contracts remain, and representative raster and
  measurement outputs passed exact-byte comparison against the previous work-lane HEAD. The old direct backend function
  names are removed from this unreleased successor surface.

### Fixed

- Overrode Chevrotain's exact vulnerable `lodash-es` transitive pin with the patched 4.18.1 release and regenerated the
  selected LikeC4 parser supply and notices from the lockfile. The selected parser's executable code is unchanged; its
  provenance comment and supply identity are renewed.
- Standalone interactive composition rejects declared external page assets, including URL-bearing resource attributes
  and CSS imports or URLs, before emitting a Candidate; unsupported CSS image sets also fail. A restrictive browser
  Content Security Policy blocks undeclared network effects; browser observation still checks blocked assets, incomplete
  rendering, and executable behavior.

### Removed

- The redundant Archify-specific font injector; the verified shared font supply remains in use by the other media
  renderers.
- The unselected alternate interactive layout and its automatic camera behavior. The standalone reader keeps one
  complete graph, source lists, pan, zoom, and explicit Fit.

## [0.3.0-alpha.4] - 2026-09-28

### Added

- Added exact-subject, non-authorizing diagnostics for invalid selected Claim Model applicability and unanswered Edition
  view questions.
- Added one versioned Build Request and Edition Project path for direct, declarative-Provider, and executable-Provider
  input selection through the existing `archpub edition build` command. Selected bytes, source claimants, derivations,
  and unresolved dependencies remain distinguishable.
- Added a bounded LikeC4 importer for supported native constructs. Unsupported or opaque meaning is rejected or
  disclosed; generated parser identities do not become source or editorial authority.
- Added independently composed static SVG/selected-width PNG and standalone interactive HTML from one selected Edition,
  including source-owned, data-only visual refinement and a first-party installed self-Edition. One authored static
  canvas can cover all ordered static views; a selected relation supplies its exact endpoint members without duplicate
  selections.
- Added Candidate v2 binding for the exact input lock, selected semantic and medium-specific supplies, scenes, and
  artifacts. Candidate replay and the v2 Qualification Set bind submitted observations without authenticating a
  claimant, verifier, or accepter.
- Added an optional qualified local publication path with separately named acceptance and effect authorization, exact
  prestate checks, replacement, and recovery. It does not publish Git or Forge refs or establish off-host custody.

### Changed

- The first-party self-Edition now authors portable inputs for the generic compiler rather than owning a parallel build
  engine. Source products retain their own claims, Edition choices, acceptance, and release decisions.
- Neutral interactive geometry uses pinned Dagre layout and Cytoscape interaction, with selected-source and
  visible-carrier checks; static and interactive media do not share geometry or approval.
- Updated the official OpenSpec development validator to `1.13.2`; this tooling update does not change compiled runtime
  or historical release bytes.
- An installed build proves only its selected inputs and effects, not complete upstream read closure, source-domain
  truth, adopter acceptance, hosted release, or independent off-host recovery.

### Removed

- Removed the displaced self-only build engines and live Atlas composer from the successor path. Historical signed
  artifacts and valid v1 input meanings remain unchanged.

### Fixed

- Qualified Edition file plans, journals, and receipts retain `static` and `interactive` media keys; the raw
  file-integrity pair retains `native` and `atlas` without sharing media slots.
- Kept source-selected text-to-geometry clearance distinct from text-to-text spacing. Historical scene audits retain
  their overlap-only text-pair rule; successor authored canvases still enforce an explicit five-unit floor.
- CoreText request preflight can be exercised without macOS host tools; unsupported hosts still reject actual
  measurement.
- The first source-list jump now centers its selected graph element after zooming from a fitted overview.
- Standalone interactive HTML now declares an inline empty favicon so a local reader does not make an implicit
  `/favicon.ico` request.
- Authored static canvases now reject near-contact text as well as strict glyph overlap. The compiler applies a
  technical font, owner-inset, text-to-paint, and terminal-route floor; passing it does not imply visual acceptance.
- Current installed-package content is reported as separate build/replay execution evidence, not Candidate identity or
  original-builder provenance. Policy-backed qualification reports remain exactly derivable from their selected
  Candidate, Qualification Set, and Policy.
- Missing selected renderer inputs, Archify supply members, or output parents now fail with scoped diagnostics before
  any final HTML is created.
- A destination parent removed or replaced after publication planning now fails before writer-lock preparation, without
  recreating it or touching foreign bytes.

### Security

- Executable Provider process-tree supervision bounds ordinary descendants but is not an operating-system, filesystem,
  network, or credential sandbox.

## [0.3.0-alpha.3] - 2026-09-24

### Fixed

- Corrected the release-date mismatch caught by the signed-tag CI gate for `0.3.0-alpha.2` without changing that
  immutable tag or its source bytes.

## [0.3.0-alpha.2] - 2026-09-24

### Changed

- Signed candidate tag only. The tag pipeline rejected a mismatch between its September 24 tagger date and the
  Changelog's former September 23 date. No GitLab Release or package assets were published; this candidate is superseded
  by `0.3.0-alpha.3`.
- The self-Edition binds its product version to the explicitly selected core package source instead of a hard-coded
  release string.

### Fixed

- Executable Provider conformance now relocates the exact Publisher package required by allowed public-contract imports,
  while rejecting undeclared or ambient dependency resolution.
- Executable Provider execution now supervises the selected worker and ordinary descendants through reply validation and
  bounded cleanup. Failed cleanup prevents a passing receipt without claiming containment of deliberate escapes.

### Security

- Bounded worker cleanup preserves unrelated processes and treats an unobserved owned process tree as an unsuccessful
  materialization.

## [0.3.0-alpha.1] - 2026-09-22

### Fixed

- Source reconstruction now treats each compressed npm archive digest as an exact asset observation while comparing
  portable package identity through the uncompressed tar-content digest.
- Hosted Linux verification no longer assumes that different gzip implementations reproduce macOS archive bytes.

## [0.3.0-alpha.0] - 2026-09-22

### Added

- Added the versioned Edition Provider contract with declarative and executable delivery modes that materialize the same
  Source Bundle, Claim Model, Edition, and optional evolution values.
- Added provider-neutral conformance journeys for exact identity, relocation, determinism, dependency direction,
  resource bounds, and rejection of downstream authority claims.
- Added source-owned migration contracts for ETHOS and AIGW. These are migration inputs only; neither source repository
  migration is claimed by this release.

### Changed

- Signed candidate tag only. No GitLab Release or package assets were published; hosted cross-platform verification
  failed and this candidate is superseded by `0.3.0-alpha.1`.
- The self-Edition now crosses the declarative Provider boundary and exercises the same public materialization path
  expected of other source products.
- Workspace, core package, and self-Edition versions advance together to `0.3.0-alpha.0` under Semantic Versioning
  2.0.0.
- Direct Edition builds remain supported. A Provider is an optional, source-owned materialization boundary rather than a
  second command plane.
- This pre-release does not promise compatibility with `0.2.0-alpha.0`; callers must select the exact package and
  Provider contract identities they consume.

### Fixed

- Executable Provider selection now binds every regular package file, rejects undeclared external dependencies, and
  verifies package content immediately before and after execution.
- Direct-build documentation no longer implies that a Provider is mandatory.

### Security

- Executable Providers run in a bounded child process with closed input, explicit output limits, a hard timeout,
  isolated scratch state, and fail-closed identity checks. This boundary contains failures but is not an adversarial
  operating-system sandbox.

## [0.2.0-alpha.0] - 2026-09-22

### Added

- Added Claim Model v2, the first-class Edition contract, semantic evolution, independent static and interactive scenes,
  conjunctive qualification, and recoverable publication.
- Added the `architecture-publisher` package and `archpub` CLI with offline source, build, rendering, qualification,
  publication, and recovery journeys.
- Added self-host, ETHOS, and AIGW conformance evidence across the public product contracts.

### Changed

- Renamed the product, package, command, and repository from the earlier Architecture Publishing identity to
  Architecture Publisher.
- Split the generic core from source-owned Editions and made the Claim Model the sole semantic runtime authority.
- Package archive identity and portable uncompressed content identity are now recorded separately.

### Fixed

- Removed adopter-specific identity from generic renderer supply and tightened source-path, module-boundary, exact-head,
  and clean-clone release checks.
- Corrected self-Edition source inputs, typography, and conformance evidence.

## [0.1.0-alpha.7] - 2026-09-20

### Added

- Composed independent static and interactive artifacts into one semantic publication contract with separate medium
  qualification.

## [0.1.0-alpha.6] - 2026-09-19

### Added

- Consolidated product contracts and added source-bound structural evolution.

### Changed

- Compacted browser evidence without discarding observations.

### Fixed

- Completed raster worker input before synchronous execution.

## [0.1.0-alpha.5] - 2026-09-19

### Added

- Bound source changes to explicit visible carriers.

### Fixed

- Enforced a deadline for signal-resistant raster workers.

## [0.1.0-alpha.4] - 2026-09-19

### Added

- Compiled source-bound changes and view obligations.

## [0.1.0-alpha.3] - 2026-09-19

### Fixed

- Aligned the retirement note while preserving continuous refresh alternatives.

## [0.1.0-alpha.2] - 2026-09-18

### Fixed

- Aligned semantic reading groups and refreshed stable renderer supply.

## [0.1.0-alpha.1] - 2026-09-18

### Added

- Published source-bound candidates with recoverable Edition replacement.

## [0.1.0-alpha.0] - 2026-09-18

### Added

- Established portable, content-bound source intake and the initial source-preserving architecture publication pipeline.
- Added offline interactive and static rendering, explicit installed-file packaging, paired-file installation, recovery,
  and acceptance evidence.

### Fixed

- Closed filename, SVG reference, raster worker, font, renderer notice, and protected-branch integrity boundaries found
  during initial qualification.

[Keep a Changelog]: https://keepachangelog.com/en/1.1.0/
[Semantic Versioning]: https://semver.org/spec/v2.0.0.html
[in-toto Statement v1]: https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md
[0.13.1]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.13.1
[0.13.0]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.13.0
[0.12.0]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.12.0
[0.11.0]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.11.0
[0.10.2]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.10.2
[0.10.1]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.10.1
[0.10.0]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.10.0
[0.9.0]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.9.0
[0.8.0]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.8.0
[0.7.0]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.7.0
[0.6.0]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.6.0
[0.5.0]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.5.0
[0.4.0]: https://github.com/HengYangDS/architecture-publisher/releases/tag/v0.4.0
[0.3.0-alpha.15]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.15
[0.3.0-alpha.14]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.14
[0.3.0-alpha.13]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.13
[0.3.0-alpha.12]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.12
[0.3.0-alpha.11]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.11
[0.3.0-alpha.10]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.10
[0.3.0-alpha.9]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.9
[0.3.0-alpha.8]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.8
[0.3.0-alpha.7]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.7
[0.3.0-alpha.6]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.6
[0.3.0-alpha.5]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.5
[0.3.0-alpha.4]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.4
[0.3.0-alpha.3]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.3
[0.3.0-alpha.2]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.2
[0.3.0-alpha.1]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.1
[0.3.0-alpha.0]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.3.0-alpha.0
[0.2.0-alpha.0]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.2.0-alpha.0
[0.1.0-alpha.7]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.1.0-alpha.7
[0.1.0-alpha.6]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.1.0-alpha.6
[0.1.0-alpha.5]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.1.0-alpha.5
[0.1.0-alpha.4]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.1.0-alpha.4
[0.1.0-alpha.3]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.1.0-alpha.3
[0.1.0-alpha.2]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.1.0-alpha.2
[0.1.0-alpha.1]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.1.0-alpha.1
[0.1.0-alpha.0]: http://192.168.64.101:18086/dig/misc/tools/architecture/architecture-publisher/-/tags/v0.1.0-alpha.0
