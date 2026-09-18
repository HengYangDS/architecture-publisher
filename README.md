# Architecture publishing

An independently usable architecture publication tool under construction.
ETHOS is its first full application, not a required product runtime dependency.

## Available now: data-only source verification

The source-intake and offline ETHOS-reader slices are tested on macOS with
Node 26.8.2 and on isolated Linux with Node 24.19.0, using their bundled npm.
Both consume the same real accepted ETHOS bundle through an installed archive
with empty HOME and no Git/Python/ETHOS executable lookup. `.node-version` records the
development toolchain. The package declares Node >=22; the minimum version and
other operating systems are not yet qualified.
No runtime npm dependencies, ETHOS, Python, Git checkout, credentials or agent
session are required for the installed verification commands. Explicit source
import has the separate tool and trust requirements below.

```sh
npm ci --ignore-scripts
npm test
npm run check
npm pack --ignore-scripts --pack-destination build
# Install the resulting archive in a consumer project, then:
architecture source verify /chosen/input/manifest.json --sha256 <selected-digest>
```

The caller selects the manifest's SHA-256. A minimal file envelope is:

```json
{
  "schema": "architecture.source-bundle/v1",
  "source": {"id": "example:service", "revision": "release-1"},
  "files": [{"path": "source.json", "bytes": 123, "sha256": "<actual-sha256>"}]
}
```

Replace the illustrative size and digest with actual member identities. Members
are relative to the manifest directory, not the invoking shell. The directory
must contain only the manifest and declared regular files. Symlinks, escaping
or ambiguous portable paths, extra/missing files and changed bytes are rejected.
Bounds are 1 MiB for the manifest, 32 MiB per member, 128 MiB total payload,
4,096 members, 8,192 directory entries and 32 member path components.
Member paths have at most 2,048 UTF-8 bytes, with at most 255 bytes per component.

The command emits JSON and exits 0 for verified file integrity, 1 for verification
failure, or 2 for usage failure. Success does **not** establish semantic truth,
official source replay, diagram quality or safe installation. Verified bytes
are returned in memory to programmatic consumers; later file reads are not
covered. Inputs should remain immutable during verification; this slice does
not protect against a hostile concurrent writer with equal OS privileges.

### Package selected files through the installed CLI

`architecture source pack ./pack.json --sha256 <selected-plan-digest>` prepares
the same portable bundle from explicitly selected local files. It is also the
local packaging entry for rendered HTML, SVG, PNG and required licenses; it does
not grant release or installation approval.

```json
{
  "schema": "architecture.pack-input/v1",
  "source": {"id": "example:service", "revision": "release-1"},
  "files": [{"input": "./authored.svg", "path": "diagram.svg", "bytes": 123, "sha256": "<actual-file-sha256>"}],
  "output": "./new-bundle"
}
```

Replace the illustrative size and digest, then select the plan's own SHA-256.
`input` and `output` resolve relative to the plan; `path` is the portable name
inside the new bundle. Each input must be a regular file with matching bytes and
digest, without symlink ancestors. The shared limits above apply. No directory
discovery, source execution, Git metadata, ETHOS or agent credentials are used.
The existing writer refuses occupied output and writes `manifest.json` last.
An interrupted write may leave incomplete output; it is not promoted or silently
deleted. The returned `manifestPath` and `manifestSha256` feed `source verify`
or a rendering plan. Member identities do not contain input or output host paths.

## ETHOS input: offline reading and explicit replay

Consume a selected bundle without an ETHOS installation or source checkout:

```sh
architecture source ethos verify /chosen/input/manifest.json \
  --sha256 <selected-manifest-digest> --projection <selected-projection-digest>
```

This preserves the entire `projection.input/v2` projection and bound source
documents, checking their declared identities and exact bundle membership.
It does not reinterpret project rules or establish semantic acceptance. An
offline read always reports `officialReplay: not-performed`.

Creating a bundle from source is an **opt-in execution** of caller-trusted code:

```sh
architecture source ethos import /chosen/import-plan.json
```

The plan contains exactly these fields; paths resolve from the plan's directory:

```json
{
  "repository": "./source-checkout",
  "revision": "<full-selected-commit-id>",
  "projectionDigest": "<selected-projection-sha256>",
  "exporterSha256": "<selected-exporter-sha256>",
  "ownerSha256": "<selected-policy-owner-sha256>",
  "git": "/chosen/toolchain/git",
  "python": "/chosen/toolchain/python3",
  "output": "./new-source-bundle"
}
```

Replace placeholders with the actual trusted identities and tool locations.
Git and a Python version compatible with the selected exporter must be provided;
the adapter does not discover sibling repositories, install ETHOS or borrow
developer configuration. It checks code identities before invoking the unchanged
committed exporter, verifies the output digest, and writes a new closed bundle.
The returned manifest digest selects later offline consumption. Existing output
is never overwritten; its physical parent must already exist. Failed writes are
retained as incomplete, not silently deleted.

Only that executed import reports `officialReplay: performed`. Neither that
field nor a stored success report substitutes for later verification. Explicit
trusted replay is not a sandbox for arbitrary source code. Full-source importer
and offline-consumer platform qualification are separate: real-source replay was
executed on macOS; importer execution tests on Linux use a synthetic committed
exporter. No real-source Linux replay or Windows claim is made. Raw
projection/source bundles are inputs, not installed runtime code.

## Offline diagram rendering

Render explicit typed JSON through the pinned Archify backend:

```sh
architecture render architecture ./service-topology.json \
  --sha256 <input-file-sha256> --output ./new-service.html
architecture render lifecycle ./job-lifecycle.json \
  --sha256 <input-file-sha256> --output ./new-lifecycle.html
```

The package includes both examples, the unchanged Archify 2.16.0 rendering
runtime and its MIT license, plus JetBrains Mono 2.304 fonts and OFL license.
It needs Node only: no ETHOS runtime, Git repository, source checkout, browser,
tar executable, credentials or global package is required to render. JSON and
output paths resolve from the CLI's current directory. `meta.output` never
selects the final target; the explicit `--output` does.

The public types are `architecture`, `workflow`, `sequence`, `dataflow` and
`lifecycle`, using Archify's native schema. Set `meta.quality_profile` to
`showcase`. Native schema and nine artifact checks must pass with no composition
errors or warnings. Unsupported source-repository metadata and remote brand
retrieval are rejected before execution; they are not silently discarded.
The lifecycle format has a native ordered phase rail as well as authored
transitions; it is not a general unconstrained state-machine renderer.

The HTML embeds font bytes and its viewer/export code. The private runtime
template is adapted **before** native rendering and checking; packaged upstream
files are never patched in place. Source entities and geometry are not rewritten
by this font adapter. No CDN font request or system font installation is needed.
Glyphs outside the bundled font's coverage are not cross-platform qualified.

The caller selects an existing physical output parent and an absent target.
Input (maximum 4 MiB) is frozen into a private scratch directory before native
execution; final output (maximum 32 MiB) is copied exclusively after its receipt
and hash match. Existing content is preserved, including a target that appears
during execution. The renderer removes only its own scratch directory. It does
not implement overwrite, paired publication or crash-recovery installation.

Success reports `status: rendered`, input/output hashes and native check scope;
native failures retain diagnostics. Exit codes remain 0/1/2 for success,
operation failure and usage failure. Native checks do **not** prove source
meaning, browser behavior, actual text paint or visual approval. Rendering and
installed-package tests are not runtime browser qualification.

The original backend qualification used macOS Node 26.8.2 and isolated Linux
Node 24.19.0. Both installed packages rendered the two included examples and
title-only variants with empty HOME/PATH. Each example's repeated HTML was deterministic
and byte-identical across those two environments. This limited observation does
not establish all-input, all-platform or browser-rendering parity.

Both examples also include independently authored static SVG views. The guide
in `examples/README.md` explains explicit font inputs, source/view editing,
installed PNG/HTML rendering, local bundles and relocated replay. This is a
bounded pair of examples, not a generic semantic compiler or browser approval.
The current update fixtures add an independent audit consumer and remove a
redundant ready state while changing retry routing and conditions. Their authored
JSON and SVG views are checked together and rendered through installed commands.
This tests bounded semantic changes, not automatic cross-media compilation or
layout adaptation. The original title-only observations remain historical.

## Source-bound ETHOS atlas

```sh
architecture atlas ethos ./atlas-plan.json
```

The plan contains exactly these fields. Paths resolve from the plan's directory,
not the caller's current directory:

```json
{
  "sourceManifest": "./source/manifest.json",
  "sourceSha256": "<selected-source-manifest-sha256>",
  "projectionDigest": "<selected-projection-digest>",
  "editionManifest": "./edition/manifest.json",
  "editionSha256": "<selected-edition-manifest-sha256>",
  "output": "./new-atlas"
}
```

`editions/ethos/authoring/` ships the selected thirteen-page authoring bundle.
It includes the user-requested Runtime subtitle correction: every page uses
only the source maturity notice. Runtime's title, view notes and protocol cards
retain its coordination, reclamation and independent-admission explanations.
The other twelve pages are unchanged from the preceding accepted edition.
Supply its selected source bundle separately; the package does not find an
ETHOS checkout or execute the exporter during rendering. The compact real-source
fixture is test data and is excluded from the installed archive. The edition's
source and expected HTML identities deliberately freeze a publication snapshot;
they do not designate the current ETHOS implementation or automatically follow it.

The edition checks the complete catalog, page/source bindings, required detail
sections, and selected fonts before reserving output. Its active view adapters
are separated from the generic renderer and their original committed provenance
is recorded in `editions/ethos/migration.json`. One shared loader supplies font
bytes; one source integration owns projection validation. Input cannot select
executable adapters. Other projects and generic rendering do not load this edition.

Every page runs the native checks. Frozen replay inputs must match their selected
expected HTML hashes; explicitly typed candidates emit new identities without
pretending they were previously accepted. Existing output is never overwritten. A failed build retains its partial
new directory without a completion manifest. The final scan checks the file set
and rehashes all pages before writing `manifest.json` last. The complete folder
includes the original HTML pages plus Archify/font license files. This detects
observed drift; it does not isolate files from a hostile equal-privilege writer
after verification and is not crash-recoverable installation.

Success means exact, checked reproduction, not new browser or semantic approval.
The published source still selects and qualifies each edition independently;
changing expected hashes is not a substitute for reviewing a redesigned diagram.

### Read an existing atlas without rendering it

`architecture atlas ethos verify ./read-plan.json` consumes the same explicit
source/edition identity fields as rendering. Replace `output` with
`outputManifest` and its independently selected `outputSha256`.
Paths are relative to that plan. The current `architecture.atlas-output/v1`
manifest is consumed directly; no legacy sidecar or original checkout is needed.

The read-only consumer checks the complete file set, exact source and edition,
all page bytes and required license bytes through the shared bounded file reader.
Its result is **artifact-file-integrity**, not semantic review, browser execution
or permission to publish. It returns observations of bytes already read, not a
lease on future file contents. The publisher still needs applicable review,
current browser evidence and effect-time revalidation before installation.

### Retained review applicability

`architecture atlas ethos review ./review-plan.json` observes whether a frozen
review still applies within its original scope. Its explicit inputs are an
`atlas` verification plan, digest-selected `evidenceBundles`, historical path
roles under `history`, and exact `editorial` selections. Original report,
subject, prompt/log, visual acceptance and predecessor records remain unchanged.
Evidence files are ordinary source bundles; historical scripts are bytes only.

Unchanged pages must match exactly. The only editorial continuation supported
here removes an extra subtitle suffix to restore the source maturity notice,
while preserving graph specifications, bindings and all other HTML bytes. It
requires exact old/new identities and selected change-basis documents. The
result preserves prior review limitations and explicitly reports no new browser
or publication acceptance. Caller-selected hashes establish identity, not an
independent trusted signature or permission to install.

### Current browser obligations and reported evidence

`architecture atlas ethos browser-plan ./read-plan.json` accepts the current
atlas verification plan and derives required document/Present, story, export
and disclosure observations from the actual HTML and source-owned quality
contract. It does not launch a browser. No host browser path, adjacent checkout
or agent credential is loaded by this command.

The edition's reported-evidence reader requires all declared viewports, exact
artifact/source/quality identity and byte-bound screenshots/exports. Evidence
paths are bundle-relative; explicit synthetic evidence, stale reports, missing
beats and reused output files are rejected. These checks do not authenticate
execution: an allowed actual browser run and checker identity remain required
before the final publisher may consume observations. The selected frozen edition
has completed real browser observation and qualified installation. The installed
CLI consumes those explicit observations; it is not itself a browser runner, and
a passing input test is not browser acceptance for a new edition.

## Independent paired-file installation

`architecture publish files plan ./files.json` exposes the existing file
installer without loading ETHOS edition or integration modules. It returns
`status: PLANNED`, `scope: file-integrity`, `semanticAcceptance: not-performed`
and a `plan` object. Save that object unchanged for application and recovery.
Planning reads selected inputs and inventories targets but does not install.

The input has exactly `options`, `source`, `payload`, `entries` and `dependencies`:

```json
{
  "options": {
    "sourceRoots": ["./artifacts"],
    "destinations": {"native": "./delivery/static", "atlas": "./delivery/interactive"},
    "recoveryRoot": "./recovery"
  },
  "source": {"id": "example:service", "revision": "r1"},
  "payload": [
    {"medium": "native", "path": "figure.svg", "source": "./artifacts/figure.svg", "bytes": 123, "sha256": "<actual-file-digest>"},
    {"medium": "atlas", "path": "page.html", "source": "./artifacts/page.html", "bytes": 456, "sha256": "<actual-file-digest>"}
  ],
  "entries": {
    "native": {"index.html": "<a href='figure.svg'>Diagram</a>", "README.md": "Static files"},
    "atlas": {"index.html": "<a href='page.html'>Diagram</a>", "README.md": "Interactive files"}
  },
  "dependencies": []
}
```

Replace illustrative sizes and digests with actual identities. Optional dependency
members have exactly `file` and `sha256`. All source, dependency and target paths
resolve relative to the input file, not the calling directory. Targets must share
an existing physical parent and must not overlap sources or recovery. `native`
and `atlas` are the two existing file slots, not required ETHOS content types.
Inputs must be regular non-symlink JSON files at most 4 MiB.

After explicitly reviewing the exact plan and targets, supply an authorization
file containing `{"decision":"AUTHORIZED","planSha256":"<plan.sha256>"}`.
The tool does not create this authorization or infer it from a successful check.

```sh
architecture publish files apply ./plan.json ./authorization.json
architecture publish files recover ./plan.json ./authorization.json
```

Emitted plans bind absolute physical targets. Moving a plan file does not change
those targets. Application rechecks input identities and current prestates;
recovery checks the original operation. Unrelated content is preserved; payload
collisions are rejected. Successful replay reports `ALREADY_INSTALLED`.
This is raw file installation, not semantic, visual, browser or ETHOS-qualified
publication. Replay does not upgrade an existing edition; replacement requires
the explicit previous-plan selection described under Architecture evolution.

## Qualified paired publication

`architecture publish ethos plan ./pair-input.json` composes the existing
atlas, retained review, static evidence and browser-report consumers. The input
contains `review`, `staticArtifact`, `browser` (checker and reports) and
`deployment` (two target directories and a recovery directory). Relative input
paths resolve against that file. Missing current browser reports fail before
writing either target. Actual browser execution remains an external, explicit
qualification step, not an implicit effect of planning.

The generic two-target installer is migrated from the existing file engine,
not implemented a second time. Its version-two file plan uses explicit
`sourceRoots` instead of assumed native/atlas checkout roots. It preserves
unrelated files and old root entry metadata, records switch intent and supports
bounded process-interruption recovery. It does not claim global atomicity,
power-loss durability or protection from hostile filesystem races. The retained
control-directory namespace preserves cooperating-writer exclusion.

`architecture publish ethos apply <plan.json> <acceptance.json>` requires
exact plan acceptance plus an explicit observed-browser-run reference bound to
the artifact, checker and reports. It rederives qualification before invoking
the file engine. This operator assertion is not a cryptographic proof of browser
execution and must never be generated from a passing parser alone.
`architecture publish ethos recover <plan.json> <acceptance.json>` uses the
persisted file plan without needing changed source inputs to pass again.

Reader-facing static HTML, SVG and PNG files retain their original relative paths
under `terminal/`; the atlas retains its complete output layout and license files
under `atlas/`. Static construction records, authored source, review records and
browser screenshots/exports are qualification inputs, not installed reader payload.
All selected manifests and members remain exact effect-time dependencies. Their
exclusion from the delivery directory does not weaken qualification or allow stale
evidence. The delivery manifest records installed file identities; do not copy a
full static input manifest into a directory containing only its reader subset.
File-effect tests alone do not qualify semantic, visual or browser acceptance.

## Offline SVG rasterization

Rasterize an authored SVG through a separate public entry:

```sh
architecture raster ./raster-plan.json
```

Its plan selects a closed source bundle and resolves filesystem paths relative
to the plan file, not the caller's current directory:

```json
{
  "manifest": "./input/manifest.json",
  "manifestSha256": "<selected-manifest-sha256>",
  "svg": "figure.svg",
  "fonts": [{"path": "font.ttf", "family": "JetBrains Mono", "weight": 400}],
  "width": 1200,
  "output": "./new-figure.png"
}
```

`svg` and font paths are members of that verified bundle. Supply every selected
font's bytes with permission to use them; a shape-only SVG uses `"fonts": []`.
The installed command uses a repository-owned narrow binding over resvg 0.48.1,
plus pinned SAX and OpenType components. It uses no system fonts, browser, ETHOS
checkout or interactive rendering modules. `assets/raster/resvg/source.json`
binds the exact Rust source archive, Cargo lock, stable toolchain, build recipe
and generated JavaScript/WASM identities. `tools/raster/resvg/build.sh` rebuilds
the selected archive offline and fails unless its digest, tracked binding inputs
and generated outputs all match. The 61 locked third-party Rust packages and
their required license texts are enumerated in
`assets/raster/resvg/THIRD-PARTY-NOTICES.txt`; OpenType's bundled tiny-inflate
notice remains separate. The current source archive belongs in the private GitLab generic package
`architecture-raster-resvg-source/0.48.1-9c1219f8e903`, not bulk Git history.
The prior `0.48.1-76f1a4a8e1d2` closure remains an immutable release dependency. It updates the compatible
`cfg-if`, `syn` and `unicode-ident` packages while keeping resvg 0.48.1,
Rust 1.98.1 and wasm-bindgen 0.2.128. The offline reconstruction command checks
the current manifest, not a remembered archive name. SAX is pinned to 1.6.1,
including strict rejection of invalid XML character references.

The input profile accepts declarative shapes, paths, gradients, clipping,
markers, internal references and font-bound text. It rejects scripts, event
attributes, external resources, CSS stylesheets/inline styles, images,
animation, foreign HTML, DTDs and unknown element/attribute names. The shared
attribute owner checks finite numbers, length units, enumerations, color syntax,
complete path commands and arc flags, point lists, transform arity and viewBox
values before rendering. Invalid input fails without publishing a final PNG;
it is not normalized into a different drawing. Compact path numbers, repeated
commands, explicit units, named/hex/function colors and internal references
remain supported. This is a bounded input profile, not complete SVG conformance
or proof that every accepted declaration has the intended visual effect.

Visible text must select a supplied family and upright weight, with glyph
coverage for non-whitespace characters. Internal `use` text is checked in each
effective font context; explicit declarations in the referenced subtree take
precedence over inherited properties. Undefined fonts, unsupported styles,
missing glyphs and reference cycles fail instead of silently approving font
fallback. This does not establish text shaping, kerning or visual equivalence
with another renderer.

Bounds are 16 MiB SVG, 16 fonts of at most 8 MiB each/32 MiB combined,
8,192 pixels per dimension and 32 Mi pixels total. XML depth is bounded to 128,
reference paths to 256, and elements/references/distinct font contexts to
100,000 each. The child has a 30-second deadline, a 512 MiB JavaScript heap
limit and a separate 512 MiB WASM memory limit. These are not a total process
or OS-level memory sandbox. PNG output is limited to 96 MiB and child output
to 128 MiB.

The target parent must exist physically and the output must not exist. The
command validates the actual PNG dimensions and copies it exclusively, preserving
an output that appears concurrently. It cleans only its own temporary directory;
it is not a crash-recoverable installer. A receipt records selected source,
SVG, supply and PNG identities. `rendered` does not mean semantic acceptance,
browser acceptance or permission to replace an accepted publication.

This entry rasterizes an authored SVG. Source-bound composition and explicit
legacy measurement use the separate entries below. Portable appearance of the
entire ETHOS poster remains unqualified. The original artwork is not replaced.

The source-closed replacement passed all 415 executed macOS tests, with nine
evidence-dependent tests intentionally skipped, plus syntax checks on Node
26.8.2. Two clean absolute-path offline builds reproduced
identical JavaScript/WASM bytes. A package restored from GitLab reproduced those
same bytes, and an installed package ran twice byte-identically and rejected
supply tampering in an isolated Linux Node 24.19.0 container with no network, a
read-only root filesystem and all Linux capabilities dropped. These observations
qualify only their tested cases, not every SVG or platform.

## Selected static-poster reconstruction

```sh
architecture poster ethos ./poster-plan.json
```

Use the same six plan fields as `atlas ethos`: `sourceManifest`,
`sourceSha256`, `projectionDigest`, `editionManifest`, `editionSha256`,
and an absent `output` directory. Select the poster bundle under
`editions/ethos/static/authoring/`, not the interactive atlas bundle. All paths
resolve from the plan file. Its expected source identities freeze one publication
snapshot; they do not follow the current ETHOS checkout.

This command **recompiles** the selected source with explicit historical text
measurements. It does not copy a prebuilt SVG. It produces `terminal.svg`,
`scene.json`, `text.txt`, `checks.json` and a file-integrity `manifest.json`.
Checks cover source/witness bindings, measured geometry, authored grouping,
actual emitted edge endpoints and canvas containment. Their scope is recorded;
none claims a new semantic, browser or aesthetic approval.

Missing or invalid measurements, mismatched source identities, changed expected
scene/SVG identities, undeclared members or executable adapters fail before
creating output. The reader never estimates missing glyph widths or invokes
host font services. Original module provenance is in
`editions/ethos/static/migration.json`; generic geometry does not import the
ETHOS edition.

**Exact SVG bytes are not standalone font portability.** The preserved SVG
references Avenir Next and Georgia without embedding them. A viewer still needs
appropriate fonts for matching appearance. The command explicitly reports
`measurement: recorded`, not fresh measurement, and produces no PNG. The original
6000-pixel PNG remains the accepted raster deliverable. Its qualified paired
installation and recovery are implemented; that does not qualify the changed
pixels produced by a portable rasterizer.

The installed poster entry reproduced all 180 labels and the exact selected SVG
on macOS Node 26.8.2 and isolated Linux Node 24.19.0; both 175-test suites passed.
An additional macOS installed-package run passed its generated SVG to the
original explicitly selected raster tool and reproduced the accepted 6000-pixel
PNG byte-for-byte. That last observation is legacy macOS raster qualification,
not a claim about portable font rendering or fresh measurement.

### Optional outlined projection

```sh
architecture poster ethos outline ./outline-plan.json
architecture raster ./raster-plan.json
```

The outline plan has six fields:

- `poster`: the five source/edition identity fields above, without `output`.
- `renderer`: `{path, sha256}` selecting an installed `rsvg-convert` executable.
- `fontList`: `{path, sha256}` selecting an installed Fontconfig `fc-list`.
- `fonts`: `[{path, sha256}]` selecting the original licensed font files.
- `reference`: `{width, height, pngSha256}` selecting the prior raster to match.
- `output`: an absent directory. All input paths resolve from the plan file.

This opt-in host adapter recompiles the original poster through its existing
checks. A private Fontconfig configuration permits only the explicitly selected
files. The source raster must match the selected reference PNG exactly before
conversion; missing fonts, changed tools, wrong reference pixels and surviving
text are rejected. No system font is installed globally or copied into output.

The output bundle contains `source.svg`, the original 180-label `text.txt`,
`outlined.svg`, `observation.json` and their integrity manifest. Pass that
manifest and `svg: "outlined.svg", fonts: []` to the existing raster entry.
The observation preserves source and conversion identities, not new visual
approval. Neither the outline nor new raster bytes replace accepted artwork.

Tool executable hashes and Fontconfig inventory do not prove a complete native
library closure or isolate a malicious executable. The caller must supply a
trusted installed toolchain with the matching native dependencies. This adapter
does not promise outline generation on every host; consuming a qualified
font-free outline is separate from regenerating it using the original fonts.
Pixel, semantic and owner acceptance remain separate publication prerequisites.

The current installed package reconstructs the complete recorded-metric SVG and
all 180 label records, matches them to the selected outline's source, then renders
that outline at widths 1600, 2400 and 6000 on macOS and isolated Linux. Each PNG
is byte-identical across those executions and to the previously observed portable
output. Linux has no network, host mounts, original fonts or original checkout;
the raster journey also removes interactive and ETHOS modules from its disposable
installation. Occupied outputs and incorrect input identities are rejected.
This proves portable consumption of that exact outline, not portable creation of
a new outline, actual outlined-glyph geometry acceptance, or permission to replace
the original raster. The source metric/SVG checks do not validate every new pixel.

### Explicit fresh measurement on macOS

```sh
architecture measure coretext ./measurement-plan.json
```

The opt-in plan contains `compiler: {path, sha256}`, `sdk: {path,
settingsSha256}`, `fonts: [{id, path, sha256, postscript, cascade}]`,
`requests: [{text, size, font}]`, and a new `output` directory. Paths resolve
from the plan; the SDK identity is the hash of its `SDKSettings.json`.
The compiler path retains its driver spelling. The caller must provide and
lawfully access the selected SDK and fonts; nothing is discovered or installed
globally. This command is unsupported on non-macOS hosts.

The helper verifies actual font runs against the selected primary and ordered
fallback IDs. Missing glyphs, undeclared fallback and changed selected files
fail without publishing output. It emits reusable `metrics.json`, a distinct
fresh-run `observation.json`, and their integrity manifest. Reusing the table
later is recorded input, not another measurement. Compiler bytes and SDK
settings are checked, not the complete operating-system/toolchain closure.

The full selected poster requires Avenir Next and Georgia, plus the observed
PingFangSC-Semibold Chinese-title fallback and LucidaGrande arrow fallback.
Those system font files are **not distributed**. A fresh 364-request run
matched every historical metric and recompiled all 180 labels into the exact
selected scene and SVG; the selected macOS raster tool also reproduced the
6000-pixel PNG exactly. This is legacy reproduction, not portable rendering,
browser qualification or new visual acceptance.

## Product boundaries

The intended complete product accepts explicit source-bound input and authored
views, produces static and interactive editions, verifies scoped properties,
and installs exact artifacts with recoverable effects. Source adapters, project
meaning, geometry, reader behavior, observation and publication stay separate.

The generic backend renders typed diagrams; the ETHOS edition reproduces the
selected thirteen-page atlas and original static composition. Current-artifact
qualification and recoverable paired installation are implemented; their
acceptance applies only to the selected source, artifact, observation and
installation identities. It does not qualify arbitrary future artwork.
The renderer source closure and portable static reconstruction are qualified
within the explicit boundaries documented above. Frozen-edition recovery and
semantic example journeys are verified separately. Source acceptance, signed
release publication and installed delivery remain distinct obligations.

This repository is a new implementation baseline. Original architecture
repositories and their histories remain preserved, not merged or rewritten.
The current product design is [Product design](docs/product-design.md), included
in the installed package. Predecessor design documents remain historical decision
evidence, not another mutable design authority or a runtime dependency.

### Architecture evolution

The target is reusable publication, not permanent replay of a frozen drawing.
A source change must explicitly select new source bytes, identify changed
entities, relationships and obligations, and produce a new authored edition.
Source meaning remains with its source owner; each medium owns its expression.
Static and interactive outputs share semantic identity, not layout coordinates.

Two input contracts use the same renderer: frozen accepted replay retains exact
output locks, while explicit candidates bind new source and authored inputs and
emit new output identities. Neither rendering mode supplies visual approval.

```sh
architecture atlas ethos prepare ./candidate-plan.json
architecture atlas ethos ./atlas-plan.json
architecture atlas ethos standalone ./standalone-plan.json
```

Candidate preparation takes `previous` (the five-field prior atlas selection),
`source` (`sourceManifest`, `sourceSha256`, `projectionDigest`), `authoring`,
`authoringSha256`, and an absent `output` directory. Paths resolve from the plan.
`editions/ethos/refresh.json` is the bounded authored interpretation of the real
candidate-base refresh change. The adapter supports that node's semantic change;
unrelated node, relation, assertion, contract or presentation changes require a
new explicit mapping and are rejected, not silently omitted. This is not a
universal semantic compiler.

The comparison checks complete semantic values, including conditions, direction,
scope, quantifiers and maturity. Counts do not establish equivalence. Changed
source documents conservatively require review of all pages. No incremental
execution or automatic acceptance reuse is claimed. Source identity and authored
meaning bindings are checked separately from native layout.

A poster candidate uses `architecture.ethos-poster-candidate/v1`, explicit
`source`, `metricsSha256`, `authoring`, and `scope`, without frozen `expected`
output hashes. It uses the same metric, semantic and geometry gates. The existing
`architecture poster ethos` command consumes it. New text requires measured input;
the reader never invents glyph widths. The selected refresh composition retains
the complete map and uses four additional labels rather than another diagram.

Standalone plans contain `atlas` (the seven-field output selection) and an absent
`output` HTML file. All pages, fonts, native runtime and required licenses are
embedded, with shared script/style blocks deduplicated losslessly. Navigation,
history and native `Archify` behavior remain available inside one frame. The
wrapper is not another visual layer or a set of disconnected diagram excerpts.

`architecture atlas ethos review` accepts either historical review continuity or
an explicit `current` review report with exact source, quality, edition, every
page and static artifact identities. A current review states reviewer and limits;
it does not pretend to be the user's historical visual approval or independent
execution. New bytes require new applicable browser observations.

Installation replay is distinct from edition replacement. File-publication and
qualified-publication planning now accept optional `replacement` containing
`plan` (the previous exact file plan) and `authorization` (its actual authorization).
These prior absolute coordinates are not rebased. Owned files come from prior
payload and controlled entries, never all files recorded in a receipt: inventories
also contain foreign content. Modified or missing managed preimages block before
effects; unknown contents are preserved. Unchanged removed payload is retired in
the staged copy, while the old directory remains in the existing recovery record.
The same lock, journal, local rename and compensation protocol serves installation
and replacement. Exact replay is a no-op; there is no global atomic pair switch.
Prior chains are bounded to sixteen replacements and the CLI's existing input
size limit. This is explicit local file replacement, not a live synchronization
or conflict-merging service.

Repository browser qualification uses the locked, development-only Playwright
package and an explicitly selected browser executable:

```sh
node tools/qualification/browser-run.mjs ./browser-input.json smoke
node tools/qualification/browser-run.mjs ./browser-input.json full
```

The input supplies the atlas output selection, `browserExecutable`, standalone
HTML path and digest, and an existing output parent. It serves only selected
bytes on loopback, uses a disposable background context with the browser sandbox
enabled, blocks external requests and closes owned resources. `smoke` checks all
pages at all declared viewports plus single-file navigation; it is not the full
story/export proof. `full` additionally observes every natural-clock story beat,
pause/replay/reset, disclosure and applicable native export. Installation does
not install Playwright or require a browser. This development tool does not read
personal browser profiles or credentials.

### Publication and storage

The current private GitLab project is
`dig/research/human-agent-stewardship/ethos-architecture`. Release
`v0.1.0-alpha.2` selects the `ethos-architecture/0.1.0-alpha.2` package:

| Asset | Purpose |
| --- | --- |
| `ETHOS-architecture.html` | Complete standalone interactive atlas |
| `ETHOS-architecture-6000.png` | High-resolution static overview |
| `architecture-publishing-0.1.0-alpha.2.tgz` | Exact installed publisher |
| `ETHOS-architecture-recovery.tar.xz` | Selected edition, portable input plans and qualification closure |
| `recovery-manifest.json`, `SHA256SUMS` | Member identities and release asset checksums |
| `README-recovery.md`, `qualification.json` | Recovery procedure, observed evidence and explicit limits |

The signed tag remains bound to its original source commit; later specification
archive or documentation commits do not replace released package bytes. Recovery
qualification restores the selected archive under a relocated path with empty
HOME and an offline package install, then requalifies and regenerates its bytes.
The release's qualification record identifies the executed scope. Replaying
recorded browser evidence is not a new browser run or human visual approval.

Release `v0.1.0-alpha.1` retains its original same-version package. Release
`v0.1.0-alpha.0` retains its original reader package
`ethos-architecture/2026.09.16` and qualification package
`ethos-architecture-qualification/d1c07163f3bd8042f8321914a02d407ce1dde48f2825d4246009002971a43308`.
Those immutable prior-release inputs are not the current delivery. Recovery uses
package name, version, filename and SHA-256; transient registry numeric IDs are
not dependencies. The renderer source package is identified in the raster section
above. No predecessor repository archive is required in the remote registry.

| Role | Durable content | Boundary |
| --- | --- | --- |
| Source | Code, small authored inputs, specifications and locks in Git | No generated media, browser runs or runtime snapshots |
| Reader release | Selected standalone HTML, high-resolution PNG and checksums | A release links immutable reader assets; package upload alone is not a release |
| Qualification | Evidence consumed by the selected edition and its acceptance | Bind subjects and scope; reuse unchanged inputs instead of copying every run |
| Recovery | Current source and necessary publication inputs | Prove restoration before retiring their only remote copy |
| Local history | Preserved predecessor repositories and historical recovery material | Not a permanent dependency of the successor's remote registry |
| Disposable work | Caches, extraction trees, diagnostics and unselected trials | Stay local; no package per step or copied execution diary |

Before deleting a package, enumerate its exact files and consumers, verify the
replacement or local-only custody required by its role, update active locators
and recheck retained assets. Observe both removal and refreshed storage accounting.
Age, size, a duplicate hash or a successful source push alone is insufficient.
Do not move bulk to another project or LFS merely to hide registry growth.
Necessary qualification inputs are not reader payload, and excluding them from
delivery does not authorize deleting their recovery copy.

These are lifecycle rules for this repository's existing publication process,
not a new registry service, autonomous deletion engine or parallel evidence store.
The existing OpenSpec Changes retain execution state; package descriptions and
historical reports must not become competing completion ledgers.

The corrected static edition keeps refresh alternatives in one field, separates
pending-merge recovery, binds proposal-retirement text to its review context and
aligns scope notes. These measured relationships have explicit regression checks;
non-overlap alone is not visual acceptance. Unchanged interactive bytes retain
their exact applicable browser observations rather than inheriting approval for
changed artifacts.

## Development

Use the project selection Node 26.9.0 and npm 11.19.1. As audited on
2026-09-18, the npm registry's `latest` tag pointed to 12.0.2, but its bundled
dependencies retained reported high-severity vulnerabilities that native
`npm audit fix` could not repair. The later-published 11.19.1 includes the
corresponding upstream fixes and remains the explicit security exception to
latest-tag selection. Do not replace a host-managed npm installation, add a
second package manager or silently downgrade through `audit fix --force`.
The publisher still has no runtime npm dependencies; development locks retain
only Acorn and Playwright. Exact supply and installed behavior are verified
independently of a successful package-manager audit.

Development is governed by ETHOS with native repository-owned test/syntax gates.
Use the current repository-local runtime, an owned Work Lane, official OpenSpec
Change and passing prewrite for the exact paths. `.ethos` and `openspec` are
engineering inputs, excluded from the installed package. Runtime users do not
install or invoke them.

Run `npm ci --ignore-scripts` before the repository tests. The locked Acorn
development dependency powers the test-only module-boundary check; consumer
installation does not install it. That check scans first-party JavaScript imports,
re-exports, dynamic imports and module-relative resource URLs. Generic source,
geometry, publication and rendering owners must not depend on the ETHOS edition
or adapter; static and interactive backends remain independent. CLI and edition
composition are the explicit consumers of those separate capabilities.
Computed module dependencies and unknown owners fail rather than silently bypass
the check. This is a syntax-level dependency guard, not arbitrary data-flow or
runtime isolation proof; installed-package removal tests remain necessary.

Create publication-bound commits with the configured signing identity and verify
the exact object before native publication. A configured public key, successful
merge, local proof or accepted branch is not evidence of a commit signature.
Repository commit policy and publication admission are distinct checks. Do not
rewrite historical commits or weaken trust to conceal a failed check.

`openspec/specs/source-intake/spec.md` owns the accepted file-envelope behavior.
The `ethos-input` capability owns the ETHOS boundary. The completed
`portable-source` Change is preserved under `openspec/changes/archive/`. Tests
exercise the installed archive under a relocated path with empty HOME and no
Git/Python/ETHOS available through PATH. Raw observations are ignored under
`build/`; they must not be reclassified as source or full-product acceptance.
