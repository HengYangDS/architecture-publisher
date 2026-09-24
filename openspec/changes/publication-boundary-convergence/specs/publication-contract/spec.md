# Spec Delta

## MODIFIED Requirements

### Requirement: One publication admission predicate

Publisher SHALL use one exact-subject local-publication admission predicate
that binds Candidate, applicable qualifications, selected acceptance policy,
named accepter, custody target, and file plan. The manifest SHALL distinguish
source claimants, Edition editor, transformation producer, verifier, accepter,
release authority, and custodian even when one actor fills several roles.
An Edition spanning multiple sources SHALL not infer a single product owner or
source endorsement from storage location. Official multi-source endorsement
SHALL name each endorsing source explicitly. The generic predicate SHALL not
issue source-product release authorization, advance refs, create Forge Releases,
assert hosted availability, or certify off-host retention. Source-specific
acceptance and release rules remain explicit extensions owned by their
respective products.

#### Scenario: A multi-source analysis has one editor

- **WHEN** an editor publishes a comparison using ETHOS and AIGW claims
- **THEN** the Candidate retains both source claimants and revisions and names
  the editor's independent conclusions
- **AND** local publication does not imply either source owner endorsed those
  conclusions

#### Scenario: A designated accepter approves the Candidate

- **WHEN** a decision binds an exact Candidate and selected policy but the
  accepter is also its author
- **THEN** admission follows that policy's same-person rule
- **AND** the decision is not mislabeled independent verification

#### Scenario: A valid Candidate lacks release custody

- **WHEN** a qualified Candidate has no selected release owner or custodian
- **THEN** local preview and export remain available
- **AND** no hosted release, indefinite retention, or off-host recovery claim
  is emitted

#### Scenario: A plan or artifact changes after authorization

- **WHEN** the supplied authorization does not bind the exact Candidate,
  qualification set, target, prestate, or file-plan digest
- **THEN** local publication fails before effects
- **AND** a prior accepted publication remains untouched

#### Scenario: A decision names another plan

- **WHEN** a generic or qualified publication decision does not bind the selected
  plan digest, Edition identity, declared publication subject, custody target,
  or applicable qualifications
- **THEN** the operation fails before filesystem, Git, package, or forge effects

#### Scenario: A valid artifact lacks flagship qualification

- **WHEN** a technically valid artifact has no applicable human visual decision
- **THEN** it may be published only under a non-flagship scope
- **AND** no surface describes it as the accepted flagship Edition

#### Scenario: Publisher and subject product are distinct

- **WHEN** Architecture Publisher builds qualified media for ETHOS or AIGW
- **THEN** the manifest records Architecture Publisher as the transformation
  producer, that source product as claimant for its own assertions, and the
  separately designated release owner
- **AND** artifact storage does not transfer any of those authorities
