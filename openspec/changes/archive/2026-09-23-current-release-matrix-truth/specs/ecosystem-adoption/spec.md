# ecosystem-adoption Specification Delta

## ADDED Requirements

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
