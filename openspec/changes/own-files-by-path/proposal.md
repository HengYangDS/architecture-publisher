## Why

A model lists every file it cites in a `sources` catalog, each with its SHA-256,
and each component and relation refers to catalog ids. The catalog is about half
of each published model: 34 KB of the AIGW work's 71 KB and 84 KB of the ETHOS
work's 147 KB. Their authors generated those lists with ordered path rules kept
outside every repository, so a reviewer cannot read the rules and a re-pin
rewrites hundreds of lines. One generator's heuristic attributed eight ETHOS
package initializers against its own rules, and nothing in the model showed it.

## What Changes

- **BREAKING** Model version 2. A component claims the repository paths it owns
  in `files`: a directory ending in `/`, or one file. A relation cites the
  exact files that evidence it in `files`. The `sources` catalog, its ids and
  authored digests are removed, and a version 1 model is refused with a pointer
  to `archpub migrate`.
- A file in the coverage scope belongs to the component whose claim is most
  specific: a file claim before any directory, a deeper directory before a
  shallower one. A path claimed twice and a glob in a claim are refused; with a
  checkout, so is a claim that owns no file in the scope.
- With a checkout, `check` and `build` resolve ownership at the model's revision
  and record every cited file with its digest, its owner and the relations that
  cite it; the manifest moves to version 5. Without one, they record every
  declared path as unverified.
- The generated page cites each component's first file: the first file of its
  first claim, or the next one when Archify withholds it.
- The coverage report counts owned files, the uncited statements are the
  components and relations without files, and currency covers every cited
  file.
- `archpub migrate <model> --out <file>` writes a version 1 model as version 2:
  each component claims the files it cited, each relation cites its sources'
  files, and a file two components cite stays with the first and is reported.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: components claim files, relations cite files, version 2
  and the migration of version 1 models.
- `source-binding`: ownership is resolved at the revision and each cited file is
  bound by its digest.
- `interactive-map`: the page cites each component's first owned file.
- `edition-delivery`: the manifest's source records and evidence follow the
  claims, at manifest version 5.
- `poster-composition`: the scenario that keeps evidence off posters names
  verified files instead of declared digests.

## Impact

The model schema and loader, source binding and coverage, the build and check
results, the generated page, view planning, the command line, the LikeC4 import,
the tests and their fixture models, the model and operations references, the
product contract, the README, the product skill and the changelog. Architecture
Publications migrates its three works in its own Change; this Change does not
edit them.
