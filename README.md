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
npm ci --offline --ignore-scripts
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

Every page runs the native checks and must match its selected expected HTML
hash. Existing output is never overwritten. A failed build retains its partial
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
before the final publisher may consume observations. The browser runner and
qualified publisher migration are still incomplete; a passing input test is not
browser acceptance.

## Qualified paired publication

`architecture publish ethos plan ./pair-input.json` composes the existing
atlas, retained review, static evidence and browser-report consumers. The input
contains `review`, `staticArtifact`, `browser` (checker and reports) and
`deployment` (two target directories and a recovery directory). Relative input
paths resolve against that file. Missing current browser reports fail before
writing either target. The actual browser runner remains pending.

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
The installed command uses pinned resvg WASM, SAX and OpenType components, not
system fonts, a browser, an ETHOS checkout or the interactive rendering modules.
Their exact inventories and notices are under `assets/raster/`; OpenType's
bundled tiny-inflate notice is retained separately. The identified
`pathfinder_content` source headers and unchanged dual-license texts are retained
under `assets/raster/resvg/pathfinder/`; its notice states the exact comparison
scope and unavailable recorded revision. The broader transitive WASM
license/source inventory audit remains open before release.

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

The installed raster command and negative cases ran on macOS Node 26.8.2 and
isolated Linux Node 24.19.0. Both complete 165-test suites and syntax checks
passed. Linux had no network or host mounts; the installed static test removed
interactive/ETHOS modules from its disposable copy and used empty HOME/PATH.
These observations qualify those tested cases, not every SVG or platform.

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
6000-pixel PNG remains the accepted raster deliverable. Portable raster
qualification and recoverable paired installation remain open.

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
Transitive raster supply closure, portable static appearance, full-product
platform parity and final source-release closure remain separate obligations.

This repository is a new implementation baseline. Original architecture
repositories and their histories remain preserved, not merged or rewritten.
The project-level decision remains in the retained Archify repository's
`docs/architecture-product-design.md`. This is a migration design reference,
not an installed runtime dependency or another mutable source of product meaning.

### Architecture evolution

The target is reusable publication, not permanent replay of a frozen drawing.
A source change must explicitly select new source bytes, identify changed
entities, relationships and obligations, and produce a new authored edition.
Source meaning remains with its source owner; each medium owns its expression.
Static and interactive outputs share semantic identity, not layout coordinates.

The current ETHOS reader is intentionally bound to an accepted edition and exact
artifact hashes. It must reject an unqualified candidate instead of calling it
an automatic update. New-candidate compilation, semantic coverage comparison and
dependency-scoped evidence invalidation remain planned work. Renaming example
titles does not establish semantic evolution or low-cost adaptation.

Installation replay is also distinct from edition replacement. A stored plan can
resume its own operation; a new plan currently rejects occupied managed payload
paths. Safe upgrades must bind prior ownership and exact preimages, preserve
unknown or modified files, qualify new outputs and recover interrupted switches.
Disabling collision checks is not an upgrade implementation.

### Publication and storage

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

## Development

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
