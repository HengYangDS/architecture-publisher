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

Observed qualification: 87 tests passed on macOS Node 26.8.2 and isolated Linux
Node 24.19.0. Both installed packages rendered and updated the two included
examples with empty HOME/PATH. Each example's repeated HTML was deterministic
and byte-identical across those two environments. This limited observation does
not establish all-input, all-platform or browser-rendering parity.

## Product boundaries

The intended complete product accepts explicit source-bound input and authored
views, produces static and interactive editions, verifies scoped properties,
and installs exact artifacts with recoverable effects. Source adapters, project
meaning, geometry, reader behavior, observation and publication stay separate.

The generic backend renders typed diagrams, but does not yet reproduce the
accepted ETHOS poster or thirteen-page atlas. Full semantic transformations,
ETHOS edition migration, browser qualification,
full-product platform parity and recoverable installation remain unfinished.

This repository is a new implementation baseline. Original architecture
repositories and their histories remain preserved, not merged or rewritten.
The project-level decision remains in the original Archify repository's
`docs/architecture-product-design.md` at `c23dd4cfad4feb8f1e16d10b0a0fd62653228ca1`.
This avoids copying a second design authority during migration.

## Development

Development is governed by ETHOS with native repository-owned test/syntax gates.
Use the current repository-local runtime, an owned Work Lane, official OpenSpec
Change and passing prewrite for the exact paths. `.ethos` and `openspec` are
engineering inputs, excluded from the installed package. Runtime users do not
install or invoke them.

`openspec/specs/source-intake/spec.md` owns the accepted file-envelope behavior.
The `ethos-input` capability owns the ETHOS boundary. The completed
`portable-source` Change is preserved under `openspec/changes/archive/`. Tests
exercise the installed archive under a relocated path with empty HOME and no
Git/Python/ETHOS available through PATH. Raw observations are ignored under
`build/`; they must not be reclassified as source or full-product acceptance.
