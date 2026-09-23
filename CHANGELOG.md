# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog], and this project adheres to
[Semantic Versioning]. Versions below `1.0.0` remain pre-release contracts and
may contain incompatible changes.

## [Unreleased]

### Fixed

- Executable Provider conformance now relocates the exact Publisher package
  required by allowed public-contract imports, while rejecting undeclared or
  ambient dependency resolution.

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
[Unreleased]: ../../compare/v0.3.0-alpha.1...main
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
