# ecosystem-adoption Specification

## Purpose

Prove that the public Architecture Publisher contracts support materially
different products without importing their intent, governance, or runtime.

## Requirements

### Requirement: Three independent first-party consumers

The current product line SHALL exercise its public source, semantic, Edition,
composition, qualification, and publication contracts through Architecture
Publisher self-use, an ETHOS Edition Provider, and an AIGW Edition Provider.
Each consumer SHALL cross the same versioned provider and downstream public
contracts. Product-specific behavior SHALL remain in source-owned providers and
Editions rather than branches in the generic kernel.

#### Scenario: A generic kernel module is evaluated for product-specific logic

- **WHEN** behavior names ETHOS, AIGW, or Architecture Publisher presentation
  semantics
- **THEN** the behavior is rejected from the generic owner unless it implements
  an explicitly shared public invariant demonstrated by all required consumers

#### Scenario: First-party consumers use different delivery modes

- **WHEN** AIGW selects a declarative provider and ETHOS selects an executable
  provider
- **THEN** both materialize the same public Source Bundle, Claim Model, Edition,
  and optional evolution contracts
- **AND** the common conformance predicates remain identical

### Requirement: ETHOS remains the repository-governance authority

The ETHOS adapter SHALL consume an exact source-owned projection and SHALL NOT
compile Commitment, issue repository permissions, manage lanes, run CAS effects,
or reinterpret ETHOS acceptance.

#### Scenario: An ETHOS Edition is rendered

- **WHEN** selected ETHOS projection bytes and Edition inputs are valid
- **THEN** Architecture Publisher may publish their declared visual projection
- **AND** the result neither changes ETHOS state nor proves an ETHOS transition

### Requirement: Live Editions are source-owned

Each mutable first-party adopter Provider and Edition SHALL live with the source
product whose architecture it states. The Architecture Publisher repository MAY
retain its own self-Edition, compact immutable fixtures, and exact conformance
receipts, but SHALL NOT retain a second mutable ETHOS or AIGW Provider or Edition
after source-owned parity is proved.

#### Scenario: A central migration package reaches source-owned parity

- **WHEN** the source repository Provider produces the same immutable candidate
  digests or an explicitly reviewed semantic successor
- **THEN** the central mutable adapter and Edition are removed
- **AND** conformance retains only the exact provider identity, portable inputs,
  compact fixtures, and qualification evidence needed to reproduce the claim

### Requirement: Cross-repository conformance is portable

An adopter SHALL cross the product boundary through an exact Edition Provider
manifest of portable standard values or an independently installed package.
Publisher runtime and release tests SHALL NOT import adjacent checkouts, search
sibling repositories, hardcode workstation user paths, or infer adopter identity
from repository names. Package identity SHALL distinguish the selected release
asset's exact archive digest from its portable uncompressed tar-content digest.

#### Scenario: An installed adopter is relocated

- **WHEN** its provider manifest, selected Source Bundle, Claim Model, Edition,
  package if applicable, and renderer supply are copied to an isolated directory
  with empty user configuration
- **THEN** the same candidate is produced offline
- **AND** the source repository remains unnecessary to the runtime invocation

#### Scenario: Package compression differs across platforms

- **WHEN** two supported hosts pack identical provider package content but their
  gzip implementations emit different archive bytes
- **THEN** their archive identities remain distinct and exact
- **AND** their uncompressed tar-content identities compare equal

#### Scenario: Cross-platform package content is compared

- **WHEN** a selected package is reconstructed across supported hosts
- **THEN** conformance compares portable content identity
- **AND** it does not claim gzip-byte equivalence across implementations

### Requirement: AIGW remains a distinct adopter

The AIGW Edition SHALL use the same generic claim and Edition contracts to
express a materially different architecture and real semantic evolution. It
SHALL NOT depend on ETHOS-specific renderer or Edition modules.

#### Scenario: AIGW adds or changes a routing capability

- **WHEN** the selected AIGW claim model changes at an exact revision
- **THEN** the affected views and media are rebuilt and requalified
- **AND** unrelated ETHOS and self Editions remain unchanged

### Requirement: Skills and renderers are replaceable capabilities

Skills, Archify, SVG, rasterization, browser automation, and CI SHALL consume
public contracts and SHALL NOT own semantic truth, Edition acceptance, product
lifecycle, or publication authority.

#### Scenario: A renderer is replaced

- **WHEN** a compatible renderer consumes the same selected scene contract
- **THEN** its artifacts require their own medium qualification
- **AND** no source claim or Edition meaning changes merely because the backend changed

### Requirement: Cross-product evidence preserves authority and time

The current first-party contract matrix SHALL distinguish immutable
interoperability baselines from current Publisher release evidence. It SHALL
bind an asserted Publisher release to its exact signed tag, release commit,
release manifest, package-identity record, qualification set, and human review.
It SHALL NOT claim the current migration, acceptance, or publication state of an
external source product.

#### Scenario: Publisher release completes before adopter acceptance

- **WHEN** the selected Publisher release and self-Edition are published and
  qualified while ETHOS or AIGW acceptance remains source-owned
- **THEN** the matrix records the exact Publisher release evidence
- **AND** each adopter entry records only its delivery contract and external
  authorization owner
- **AND** no pre-release or Publisher-owned adopter-progress statement remains
