# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog], and this project adheres to
[Semantic Versioning]. Versions below `1.0.0` remain pre-release contracts and
may contain incompatible changes.

## [Unreleased]

### Changed

- Reconciled current Provider v2 and source-adopter migration guidance with the
  signed `v0.3.0-alpha.4` release, without treating Publisher release as source
  acceptance or independent off-host recovery.
- Moved the recorded typography reader from the SVG renderer surface to the
  Scene authoring surface as `createRecordedMetricReader`. Existing signed
  releases retain their original API and bytes.
- Moved Build Request joining to private compiler input coordination and
  removed its low-level Provider export. The public `archpub edition build`
  operation remains the complete consumer path.
- Moved authored Scene pre-render geometry rules to the Scene owner and emitted
  SVG-path inspection to Qualification. The compiler coordinates both without
  defining either predicate.

### Removed

- The unselected alternate interactive layout and its automatic
  camera behavior. The standalone reader keeps one complete graph, source
  lists, pan, zoom, and explicit Fit.

## [0.3.0-alpha.4] - 2026-09-28

### Added

- Added exact-subject, non-authorizing diagnostics for invalid selected Claim
  Model applicability and unanswered Edition view questions.
- Added one versioned Build Request and Edition Project path for direct,
  declarative-Provider, and executable-Provider input selection through the
  existing `archpub edition build` command. Selected bytes, source claimants,
  derivations, and unresolved dependencies remain distinguishable.
- Added a bounded LikeC4 importer for supported native constructs. Unsupported
  or opaque meaning is rejected or disclosed; generated parser identities do
  not become source or editorial authority.
- Added independently composed static SVG/selected-width PNG and standalone
  interactive HTML from one selected Edition, including source-owned,
  data-only visual refinement and a first-party installed self-Edition. One
  authored static canvas can cover all ordered static views; a selected
  relation supplies its exact endpoint members without duplicate selections.
- Added Candidate v2 binding for the exact input lock, selected semantic and
  medium-specific supplies, scenes, and artifacts. Candidate replay and the v2
  Qualification Set bind submitted observations without authenticating a
  claimant, verifier, or accepter.
- Added an optional qualified local publication path with separately named
  acceptance and effect authorization, exact prestate checks, replacement, and
  recovery. It does not publish Git or Forge refs or establish off-host custody.

### Changed

- The first-party self-Edition now authors portable inputs for the generic
  compiler rather than owning a parallel build engine. Source products retain
  their own claims, Edition choices, acceptance, and release decisions.
- Neutral interactive geometry uses pinned Dagre layout and Cytoscape
  interaction, with selected-source and visible-carrier checks; static and
  interactive media do not share geometry or approval.
- Updated the official OpenSpec development validator to `1.13.2`; this
  tooling update does not change compiled runtime or historical release bytes.
- An installed build proves only its selected inputs and effects, not complete
  upstream read closure, source-domain truth, adopter acceptance, hosted
  release, or independent off-host recovery.

### Removed

- Removed the displaced self-only build engines and live Atlas composer from
  the successor path. Historical signed artifacts and valid v1 input meanings
  remain unchanged.

### Fixed

- Qualified Edition file plans, journals, and receipts retain `static` and
  `interactive` media keys; the raw file-integrity pair retains `native` and
  `atlas` without sharing media slots.
- Kept source-selected text-to-geometry clearance distinct from text-to-text
  spacing. Historical scene audits retain their overlap-only text-pair rule;
  successor authored canvases still enforce an explicit five-unit floor.
- CoreText request preflight can be exercised without macOS host tools;
  unsupported hosts still reject actual measurement.
- The first source-list jump now centers its selected graph element after zooming from a fitted overview.
- Standalone interactive HTML now declares an inline empty favicon so a local
  reader does not make an implicit `/favicon.ico` request.
- Authored static canvases now reject near-contact text as well as strict glyph
  overlap. The compiler applies a technical font, owner-inset, text-to-paint,
  and terminal-route floor; passing it does not imply visual acceptance.
- Current installed-package content is reported as separate build/replay
  execution evidence, not Candidate identity or original-builder provenance.
  Policy-backed qualification reports remain exactly derivable from their
  selected Candidate, Qualification Set, and Policy.
- Missing selected renderer inputs, Archify supply members, or output parents
  now fail with scoped diagnostics before any final HTML is created.
- A destination parent removed or replaced after publication planning now fails
  before writer-lock preparation, without recreating it or touching foreign bytes.

### Security

- Executable Provider process-tree supervision bounds ordinary descendants
  but is not an operating-system, filesystem, network, or credential sandbox.

## [0.3.0-alpha.3] - 2026-09-24

### Fixed

- Corrected the release-date mismatch caught by the signed-tag CI gate for
  `0.3.0-alpha.2` without changing that immutable tag or its source bytes.

## [0.3.0-alpha.2] - 2026-09-24

### Status

- Signed candidate tag only. The tag pipeline rejected a mismatch between its
  September 24 tagger date and the Changelog's former September 23 date. No
  GitLab Release or package assets were published; this candidate is superseded
  by `0.3.0-alpha.3`.

### Changed

- The self-Edition binds its product version to the explicitly selected core
  package source instead of a hard-coded release string.

### Fixed

- Executable Provider conformance now relocates the exact Publisher package
  required by allowed public-contract imports, while rejecting undeclared or
  ambient dependency resolution.
- Executable Provider execution now supervises the selected worker and ordinary
  descendants through reply validation and bounded cleanup. Failed cleanup
  prevents a passing receipt without claiming containment of deliberate escapes.

### Security

- Bounded worker cleanup preserves unrelated processes and treats an
  unobserved owned process tree as an unsuccessful materialization.

## [0.3.0-alpha.1] - 2026-09-22

### Fixed

- Source reconstruction now treats each compressed npm archive digest as an
  exact asset observation while comparing portable package identity through the
  uncompressed tar-content digest.
- Hosted Linux verification no longer assumes that different gzip
  implementations reproduce macOS archive bytes.

## [0.3.0-alpha.0] - 2026-09-22

### Status

- Signed candidate tag only. No GitLab Release or package assets were published;
  hosted cross-platform verification failed and this candidate is superseded by
  `0.3.0-alpha.1`.

### Added

- Added the versioned Edition Provider contract with declarative and executable
  delivery modes that materialize the same Source Bundle, Claim Model, Edition,
  and optional evolution values.
- Added provider-neutral conformance journeys for exact identity, relocation,
  determinism, dependency direction, resource bounds, and rejection of
  downstream authority claims.
- Added source-owned migration contracts for ETHOS and AIGW. These are migration
  inputs only; neither source repository migration is claimed by this release.

### Changed

- The self-Edition now crosses the declarative Provider boundary and exercises
  the same public materialization path expected of other source products.
- Workspace, core package, and self-Edition versions advance together to
  `0.3.0-alpha.0` under Semantic Versioning 2.0.0.
- Direct Edition builds remain supported. A Provider is an optional,
  source-owned materialization boundary rather than a second command plane.
- This pre-release does not promise compatibility with `0.2.0-alpha.0`; callers
  must select the exact package and Provider contract identities they consume.

### Fixed

- Executable Provider selection now binds every regular package file, rejects
  undeclared external dependencies, and verifies package content immediately
  before and after execution.
- Direct-build documentation no longer implies that a Provider is mandatory.

### Security

- Executable Providers run in a bounded child process with closed input,
  explicit output limits, a hard timeout, isolated scratch state, and
  fail-closed identity checks. This boundary contains failures but is not an
  adversarial operating-system sandbox.

## [0.2.0-alpha.0] - 2026-09-22

### Added

- Added Claim Model v2, the first-class Edition contract, semantic evolution,
  independent static and interactive scenes, conjunctive qualification, and
  recoverable publication.
- Added the `architecture-publisher` package and `archpub` CLI with offline
  source, build, rendering, qualification, publication, and recovery journeys.
- Added self-host, ETHOS, and AIGW conformance evidence across the public
  product contracts.

### Changed

- Renamed the product, package, command, and repository from the earlier
  Architecture Publishing identity to Architecture Publisher.
- Split the generic core from source-owned Editions and made the Claim Model the
  sole semantic runtime authority.
- Package archive identity and portable uncompressed content identity are now
  recorded separately.

### Fixed

- Removed adopter-specific identity from generic renderer supply and tightened
  source-path, module-boundary, exact-head, and clean-clone release checks.
- Corrected self-Edition source inputs, typography, and conformance evidence.

## [0.1.0-alpha.7] - 2026-09-20

### Added

- Composed independent static and interactive artifacts into one semantic
  publication contract with separate medium qualification.

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

- Established portable, content-bound source intake and the initial
  source-preserving architecture publication pipeline.
- Added offline interactive and static rendering, explicit installed-file
  packaging, paired-file installation, recovery, and acceptance evidence.

### Fixed

- Closed filename, SVG reference, raster worker, font, renderer notice, and
  protected-branch integrity boundaries found during initial qualification.

[Keep a Changelog]: https://keepachangelog.com/en/1.1.0/
[Semantic Versioning]: https://semver.org/spec/v2.0.0.html
[Unreleased]: ../../compare/v0.3.0-alpha.4...main
[0.3.0-alpha.4]: ../../compare/v0.3.0-alpha.3...v0.3.0-alpha.4
[0.3.0-alpha.3]: ../../compare/v0.3.0-alpha.2...v0.3.0-alpha.3
[0.3.0-alpha.2]: ../../compare/v0.3.0-alpha.1...v0.3.0-alpha.2
[0.3.0-alpha.1]: ../../compare/v0.3.0-alpha.0...v0.3.0-alpha.1
[0.3.0-alpha.0]: ../../compare/v0.2.0-alpha.0...v0.3.0-alpha.0
[0.2.0-alpha.0]: ../../compare/v0.1.0-alpha.7...v0.2.0-alpha.0
[0.1.0-alpha.7]: ../../compare/v0.1.0-alpha.6...v0.1.0-alpha.7
[0.1.0-alpha.6]: ../../compare/v0.1.0-alpha.5...v0.1.0-alpha.6
[0.1.0-alpha.5]: ../../compare/v0.1.0-alpha.4...v0.1.0-alpha.5
[0.1.0-alpha.4]: ../../compare/v0.1.0-alpha.3...v0.1.0-alpha.4
[0.1.0-alpha.3]: ../../compare/v0.1.0-alpha.2...v0.1.0-alpha.3
[0.1.0-alpha.2]: ../../compare/v0.1.0-alpha.1...v0.1.0-alpha.2
[0.1.0-alpha.1]: ../../compare/v0.1.0-alpha.0...v0.1.0-alpha.1
[0.1.0-alpha.0]: ../../tree/v0.1.0-alpha.0
