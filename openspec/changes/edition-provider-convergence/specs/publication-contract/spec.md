# publication-contract Specification Delta

## MODIFIED Requirements

### Requirement: One publication admission predicate

Generic and Edition-specific publication adapters SHALL use one exact-field,
subject-product identity, Edition, qualification, custody, and plan-bound
decision predicate. Edition-specific evidence and source-product authority
checks SHALL remain explicit extensions rather than being weakened into the
shared core. Publication SHALL distinguish semantic ownership, transformation,
preparation, accepted source, artifact qualification, installation, hosted
availability, release authorization, custody, recovery, and feedback.

#### Scenario: A decision names another plan

- **WHEN** a generic or qualified publication decision does not bind the selected
  plan digest, Edition identity, subject-product identity, custody target, or
  applicable qualifications
- **THEN** the operation fails before filesystem, Git, package, or forge effects

#### Scenario: A valid artifact lacks flagship qualification

- **WHEN** a technically valid artifact has no applicable human visual decision
- **THEN** it may be published only under a non-flagship scope
- **AND** no surface describes it as the accepted flagship Edition

#### Scenario: Publisher and subject product are distinct

- **WHEN** Architecture Publisher builds qualified media for ETHOS or AIGW
- **THEN** the manifest records Architecture Publisher as the transformation
  producer and the source product as semantic and release owner
- **AND** artifact storage does not transfer either authority
