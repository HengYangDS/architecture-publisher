# Spec Delta

## MODIFIED Requirements

### Requirement: Self-hosted publication remains distinct from adoption proof

ETHOS Architecture SHALL be able to publish a source-bound architecture of its
own product through the same public semantic contract. Its self-hosted edition
SHALL use selected repository bytes and SHALL NOT require a project-specific
branch in generic composition code. A caller MAY select an absolute absent
output path through a filesystem alias whose physical parent already exists;
the self-host entry SHALL bind every emitted path to the physical directory it
created while preserving the generic writer's canonical-parent checks.
Self-hosting SHALL be recorded separately from independent non-ETHOS adopter
evidence.

#### Scenario: The product publishes its own architecture

- **WHEN** selected ETHOS Architecture source bytes and authored projections are compiled
- **THEN** the normal public command emits complete independent static and interactive media
- **AND** the result proves self-use but does not satisfy the independent-adopter claim

#### Scenario: The selected self-host path uses a filesystem alias

- **WHEN** an absolute absent self-host output path has an existing parent that resolves through a filesystem alias
- **THEN** the self-host entry creates the output and emits source, authoring and plan paths under its canonical physical directory
- **AND** the generic bundle writer remains strict for non-canonical parents supplied directly to its public contract
