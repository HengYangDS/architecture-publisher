## Why

Architecture Publisher is a general publisher. A model is written outside the
repository it describes, read against a pinned read-only checkout, and published
to a root the caller chooses. This repository's own layout does not follow that
position:

- Its one package sits in a private workspace shell, so one product has two
  manifests, two READMEs and two licenses, and every tool and test names
  `packages/publisher`.
- It keeps a publication input of its own, the model of itself in
  `editions/self/`. That model is a work like the others and now lives with
  them in architecture-publications. Kept here, it could only pin an earlier
  commit of this repository.
- The samples a reader needs live only among test fixtures, beside copies of
  real models whose origin is not recorded.

## What Changes

- The package moves to the repository root: `src/`, `renderers/` and
  `supplies/` beside `tests/`, `tools/` and `docs/`, with one `package.json`,
  one README and one license. The workspace shell is removed. The published
  package keeps the same files; only `package.json`, the merged README and the
  Raster source record with its supply digest change.
- The canonical raster pair is held in custody at its new path, so bootstrap
  restores it there.
- `examples/` holds the documented samples, the C4 Big Bank model and the LikeC4
  shop workspace, each with a README. The documentation and the tests read them
  there.
- `tests/fixtures/models/` keeps the copies of real models that the tests use as
  a corpus. Its README records each copy's origin: repository, revision and why
  it is in the corpus. The publisher's former self model joins the corpus as a
  copy.
- `editions/self/` is removed; the model is the work `architecture-publisher`
  in architecture-publications.
- A root `CONTRIBUTING.md` gives maintainers one entry for setup, verification,
  commits, landing and releases, as ETHOS's root rules from 0.2.0-alpha.26
  require of every governed repository.

No poster or page changes: the published AIGW, ETHOS and former self works
build byte-identical posters and pages.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The layout of the repository is not a product requirement; this Change
uses the official no-spec marker.

## Impact

Every path under `packages/publisher/`, the manifests and lock, the tool
configuration under `.config/`, `.gitattributes`, `.gitignore`,
`.ethos/profile.toml`, the CI source and its projections, `tools/`, `tests/`,
`docs/reference/`, the README and the new `CONTRIBUTING.md`. Out of scope: the content of the moved model,
shipping the Skill in the package, the stale research pages and the checks and
records that the next Change in this lane corrects.
