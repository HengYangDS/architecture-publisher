# product-identity Specification

## Purpose

Define one truthful product identity and migration boundary for the independent
system-architecture publication product and its project-specific Editions.

## Requirements

### Requirement: One canonical product identity

The product SHALL identify itself as `Architecture Publisher`, its distributable
package as `architecture-publisher`, its public command as `archpub`, and its
canonical repository as `architecture-publisher`. ETHOS SHALL be represented as
an Edition and adopter, not as the product owner or product name.

#### Scenario: A reader inspects a current product surface

- **WHEN** a reader inspects package metadata, CLI help, README, Skill guidance,
  repository profile, generated product self-portrait, or release metadata
- **THEN** every current surface uses the canonical product identity
- **AND** `ETHOS Architecture` appears only where the ETHOS Edition or its
  published artifacts are the subject

### Requirement: No parallel compatibility identity

The migration SHALL remove the former `architecture` executable and current
runtime references that present `ethos-architecture` as the product. It SHALL
NOT retain aliases, wrappers, fallback executables, duplicate package names, or
parallel mutable repositories solely for compatibility.

#### Scenario: A caller invokes the former command

- **WHEN** an installed current release receives `architecture`
- **THEN** no product-owned compatibility command handles the invocation
- **AND** current usage names `archpub` as the sole command

### Requirement: History-preserving repository rename

The repository rename SHALL preserve commit history, signed historical tags,
and immutable alpha.7 release evidence. The local checkout and GitLab project
SHALL be renamed only through an explicit bounded migration after accepted
source closeout, with remote and path readback.

#### Scenario: The current product is renamed

- **WHEN** the accepted 0.2 source is migrated to the new repository identity
- **THEN** every historical commit and tag remains reachable
- **AND** the selected local path, remote project path, default branch, package
  metadata, and clone URL are verified independently

#### Scenario: Historical release content is inspected

- **WHEN** a reader selects an alpha.7 tag or immutable release asset
- **THEN** its historical names and bytes remain unchanged
- **AND** current documentation identifies it as a predecessor product identity

### Requirement: Edition identities remain subordinate

Each Edition SHALL be an Architecture Model with a stable owner and identity
distinct from the product, package, repository, renderer and source project
identities, and SHALL be kept outside the core package.

#### Scenario: ETHOS and Architecture Publisher editions coexist

- **WHEN** both models are built with the same installed core
- **THEN** neither model changes the product identity
- **AND** their source, model and delivery identities remain independently
  selectable

### Requirement: The core distribution is domain-neutral

The `architecture-publisher` package and `archpub` command SHALL depend only on
the generic model, source-binding, reading-plan, poster, page and delivery
contracts. A concrete repository or Edition MAY be developed in the same
monorepo, but SHALL be a model outside the core package and SHALL NOT be
included in or required by it.

#### Scenario: A caller installs only the core package

- **WHEN** no Edition model is present
- **THEN** the installed build, check, import, accept and publish journeys
  remain available offline
- **AND** `archpub --help` contains no ETHOS, AIGW, repository-specific, or
  renderer-vendor command

#### Scenario: A concrete Edition evolves

- **WHEN** the ETHOS, AIGW or Architecture Publisher model changes
- **THEN** it can be rebuilt without changing the core package unless a public
  contract itself changed
- **AND** the dependency direction remains from the model to the core
