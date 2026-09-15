# Architecture publishing

An independently usable architecture publication tool under construction.
ETHOS is its first full application, not a required product runtime dependency.

## Available now: data-only source verification

Use Node 26.8.2 (the currently exercised toolchain) and its bundled npm.
The package declares Node >=22; this is not a substitute for runtime testing. Other
versions and operating systems are not yet qualified by this implementation slice.
No runtime npm dependencies, ETHOS, Python, Git checkout, credentials or agent
session are required to use the installed command.

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

The command emits JSON and exits 0 for verified file integrity, 1 for verification
failure, or 2 for usage failure. Success does **not** establish semantic truth,
official source replay, diagram quality or safe installation. Verified bytes
are returned in memory to programmatic consumers; later file reads are not
covered. Inputs should remain immutable during verification; this slice does
not protect against a hostile concurrent writer with equal OS privileges.

## Product boundaries

The intended complete product accepts explicit source-bound input and authored
views, produces static and interactive editions, verifies scoped properties,
and installs exact artifacts with recoverable effects. Source adapters, project
meaning, geometry, reader behavior, observation and publication stay separate.

The current slice does not yet render or reproduce the accepted ETHOS poster
or thirteen-page atlas. Linux execution, full semantic transformations, renderer
migration, browser qualification and recoverable installation remain unfinished.

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

`openspec/changes/portable-source` owns this slice's intent and progress. Tests
exercise the installed archive under a relocated path with empty HOME and no
Git/Python/ETHOS available through PATH. Raw observations are ignored under
`build/`; they must not be reclassified as source or full-product acceptance.
