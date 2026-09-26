# Spec Delta

## MODIFIED Requirements

### Requirement: One publication admission predicate

Publisher SHALL use one local file-effect owner with disjoint raw-pair and
qualified-Edition admissions. Raw admission binds exact files, targets,
prestates, plan digest, and explicit effect authorization; it claims file
integrity only and requires no Candidate. Qualified admission additionally
binds an exact Candidate, applicable qualifications, selected policy, named
accepter adoption, custodian, and separate effect authorization to the plan.
Neither case grants source release, Git or Forge effects, hosted availability,
or off-host retention.

#### Scenario: A raw pair has no semantic authority

- **WHEN** a caller authorizes an exact raw-file plan without an Edition or Candidate
- **THEN** the existing installer may apply or recover its file effect
- **AND** its receipt makes no semantic qualification or product-release claim

#### Scenario: A multi-source analysis has one editor

- **WHEN** an editor publishes a comparison using ETHOS and AIGW claims
- **THEN** the qualified manifest distinguishes each claimant and revision,
  attributes editorial conclusions to the editor, and names the producer,
  verifier, accepter, release owner, and custodian even when roles coincide
- **AND** neither source ownership nor endorsement follows from storage;
  official multi-source endorsement names each endorsing source explicitly

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

- **WHEN** either admission case receives authorization for another plan or
  target prestate
- **THEN** the operation fails before filesystem, Git, package, or forge effects
- **AND** qualified admission also rejects a mismatched Candidate, Edition,
  qualification, policy, accepter, or custodian before effects

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
