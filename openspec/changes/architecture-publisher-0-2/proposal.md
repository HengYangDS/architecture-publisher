# Proposal

## Why

The repository currently identifies itself as `ethos-architecture` even though
ETHOS is one edition and adopter rather than the product owner. Its alpha.7
self-host publication proves portable, source-bound dual-medium delivery, but
only describes eight selected implementation modules and therefore cannot serve
as the product's complete public self-portrait or flagship quality reference.
The product needs one truthful identity and one explicit compilation boundary
from source claims through audience-specific editions, independent media,
qualification, publication, and evolution.

## What Changes

- **BREAKING** Rename the product and repository identity to **Architecture
  Publisher**, the package to `architecture-publisher`, and the command to
  `archpub`; do not retain a parallel `architecture` command, compatibility
  wrapper, duplicate package identity, or ETHOS-branded product identity.
- Preserve the complete Git history and immutable `v0.1.0-alpha.0` through
  `v0.1.0-alpha.7` releases while publishing the redesigned product as a new
  `0.2.0` prerelease line.
- Replace the implementation-module self-host example as the public product
  portrait with a first-party `architecture-publisher` Edition. Retain a small
  structural example only as an explicitly bounded example.
- Extend the semantic contract from unqualified entity/relationship records to
  source-bound claims that distinguish intended, implemented, observed,
  governed, and published planes and preserve scope, condition, maturity,
  provenance, unknowns, and contradictions.
- Make `Edition` the first-class publication unit: audience, questions,
  required claims, omission policy, reading order, visual grammar, independent
  static and interactive scenes, and qualification obligations.
- Make the distributable `architecture-publisher` package domain-neutral. A
  project repository is a source selected outside the compiler, not a runtime
  dependency. The Publisher self-Edition remains with its source product;
  ETHOS and AIGW live Editions move to their own source repositories. They
  depend on the generic product and never enter its package or `archpub`
  command surface. Existing central extension directories are migration
  staging, not the terminal ownership model.
- Produce an independently composed 6000-pixel flagship static overview and a
  standalone interactive atlas. They share semantic identities, not geometry,
  DOM, screenshots, or a common presentation layout.
- Add conservative source-to-claim-to-view dependency analysis so an exact
  semantic change identifies affected editions and views without editing
  generated artifacts or treating regeneration as approval.
- Qualify three first-party consumers—Architecture Publisher self-use, ETHOS,
  and AIGW—through the same public contracts while keeping adapters, renderers,
  Skills, Git, OpenSpec, and ETHOS below their proper authority boundaries.
- Add semantic, geometry, browser, accessibility, installed-use, replacement,
  recovery, and explicit human visual acceptance gates. Automated scores may
  reject defects but may not manufacture aesthetic approval.
- Rename the local and GitLab repository only after accepted source closeout,
  preserving history and updating verified remotes. Independent off-host
  disaster recovery remains outside this Change until an operator selects its
  destination, custody, and credentials.

## Capabilities

### New Capabilities

- `product-identity`: Canonical product, package, command, repository, and
  edition identities plus the migration and no-compatibility-residue contract.
- `edition-publication`: First-class audience-specific Edition compilation with
  independent static and interactive scenes and conservative evolution impact.
- `flagship-qualification`: Hard semantic and visual gates plus bounded human
  acceptance for flagship publications.
- `ecosystem-adoption`: One public contract exercised by self-use, ETHOS, and
  AIGW without importing their authority or lifecycle.

### Modified Capabilities

- `semantic-compilation`: Add typed claim planes, conditions, scope, maturity,
  unknown and contradiction handling, and explicit claim correspondence.
- `semantic-publication`: Replace the bounded eight-module self-host portrait
  with a complete first-party Edition and independent medium-specific scenes.
- `publication-contract`: Bind product identity, edition qualification, release
  identity, replacement, and recovery without a second command or truth plane.

## Impact

- Public package, CLI, repository/profile, documentation, Skill, generated
  examples, tests, release metadata, GitLab project path, and local checkout
  path change.
- Semantic document and publication inputs change incompatibly; the accepted
  alpha.7 artifacts and tags remain immutable historical releases.
- Generic semantic, composition, verification, and publication owners are
  reorganized by responsibility. ETHOS- and AIGW-specific behavior becomes a
  source-owned live Edition in the corresponding product repository and is
  exercised here only through portable standard values or an independently
  installed package selected by exact identity.
- The core package accepts exact Source Bundle, Claim Model, Edition, build,
  qualification, and publication values. Compilation emits an unqualified
  Edition candidate; only a later qualified and authorized effect is a
  publication.
- A new `editions/self` source becomes the canonical product self-portrait.
  Static and interactive outputs are built and accepted independently. Compact
  conformance fixtures remain here; mutable adopter copies do not.
- The active implementation occurs in one ETHOS-owned Work Lane and one
  OpenSpec Change. No predecessor repository, generated output, or compatibility
  facade becomes a parallel authority.
