# Design

## Context

Commit `eeb81be83e42b571c964b730f045c97ec75cb022` is accepted on local and
GitLab `main`/`dev`; both hosted pipelines succeeded. It adds independent static
and interactive composition, a source-bound self-host edition, AIGW initial and
evolved dual-medium publication, stronger glyph/stroke/endpoint checks and
self-contained SVG fonts. Package version `0.1.0-alpha.6` still names earlier
bytes.

Release qualification found one portability defect before publication. On
macOS, an absolute temporary path may be spelled through `/var` while resolving
to `/private/var`; the installed self-host entry forwarded the alias spelling to
the strict bundle writer and failed with `output_parent_invalid`. A portable
symlink-parent regression now reproduces that boundary on any supported host.

## Goals / Non-Goals

**Goals:**

- Bind these accepted publisher bytes to one signed version and tag.
- Rebuild and install the package offline from the exact release commit.
- Publish checksums and a qualification record that names current evidence and
  its limits.
- Verify every uploaded alpha.7 byte by downloading it again.

**Non-Goals:**

- Change the accepted ETHOS reader or upload duplicate reader assets.
- Treat GitLab source/package storage as an independent failure domain.
- Convert local self-hosting into independent-adopter evidence.
- Claim independent review, universal semantic inference or arbitrary layout.

## Decisions

- `package.json` remains the authored version; `package-lock.json` is its exact
  projection. No additional version owner is introduced.
- The self-host entry creates its requested absent output directory and resolves
  that directory once to its physical path before constructing source, authoring
  and publication plans. The shared writer continues rejecting non-canonical
  parents supplied directly to its public contract.
- The protected-tag allowlist appends only `v0.1.0-alpha.7`; every earlier tag
  remains immutable.
- The release package contains source, selected supplies, examples, Skill and
  documentation already selected by `package.json`. Generated browser runs and
  recovery directories remain outside the npm archive.
- Alpha.7 links the existing alpha.5 reader URLs and exact hashes. The release
  uploads only the new npm archive, `qualification.json` and `SHA256SUMS`.
- Reader identity has four explicit roles: alpha.5 is the immutable published
  reader, `ETHOS-architecture-viewing/README.md` is the local candidate
  viewing-copy entry, the two named Documents files are preserved convenience
  deliveries with their own hashes, and alpha.3 is the complete recovery entry.
  Portable product documentation does not embed a host username or require
  those local paths. None inherits another role's evidence.
- Reader identity has four explicit roles: alpha.5 is the immutable published
  reader, `Documents/ETHOS-architecture-viewing/README.md` is the candidate
  viewing-copy entry, the two top-level Documents files are preserved local
  convenience deliveries with their own hashes, and alpha.3 is the complete
  recovery entry. None inherits another role's evidence.
- Qualification distinguishes local proof, pinned Linux execution, hosted CI,
  AIGW adoption, self-hosting, reader reuse and disaster-recovery limits.

## Risks / Trade-offs

- **Release metadata can diverge from bytes** -> build only after the release
  commit, upload exact files, download all three and compare SHA-256.
- **A source projection looks like a backup** -> retain the explicit failure
  domain limit; no disaster-recovery claim is made without a selected independent
  target.
- **Administrative commits can repeat expensive checks** -> freeze product inputs
  before the final matrix and reuse only byte-identical evidence while running
  fresh exact-commit admission where required.
- **Path normalization could weaken writer checks** -> normalize only the
  self-host directory that this example just created; keep the generic writer
  and all other public inputs unchanged.

## Migration Plan

Commit the release metadata, run source/package/container checks, prove and land
the exact release commit, then archive this source Change. The native release
transition owns the subsequent signed tag, package upload, release links and
download comparison. Prior versions remain rollback points. The source Change
records readiness for that transition; it does not claim the later external
effects before they occur.

## Observed candidate acceptance

- The filesystem-alias installed self-host regression failed before the repair
  with `output_parent_invalid`, then passed after entry-point normalization. A
  further 58 source-reader and writer tests passed without weakening strict
  parent admission.
- macOS Node 26.9.0: 530 tests, 521 passed, 9 explicit input-selected skips and
  0 failed. Syntax checks passed.
- Pinned Linux Node 26.9.0 Bookworm: 530 tests, 515 passed, 15 explicit
  platform/input skips and 0 failed. Syntax checks passed with network disabled
  and the lock-selected local dependency closure.
- Installed package journeys: 7 passed and 0 failed, covering AIGW source
  evolution, relocated offline input, release projection and self-host
  publication.
- Candidate npm archive: 191 files, 2,333,075 compressed bytes and 8,511,013
  unpacked bytes. Generated `build/` evidence is excluded.
- Independent reviewer acceptance remains unavailable because two read-only
  review attempts failed at tool-stream decoding. No independent review claim
  is made.
- GitLab remains the source/package projection and hosted-CI platform; its
  physical storage and failure-domain independence remain unproved.
