# publication-contract Specification

## Purpose

Define the shared publication admission boundary and the replaceable Skill and
CI projections that invoke it without acquiring intent, lifecycle or effect
authority.

## Requirements

### Requirement: One publication admission predicate

Publisher SHALL use one local file-effect owner with disjoint raw-pair and
qualified-Edition admissions. Raw admission binds exact files, targets,
prestates, plan digest, and explicit effect authorization; it claims file
integrity only and requires no Candidate. Qualified admission additionally
binds an exact Candidate, applicable qualifications, selected policy, named
accepter adoption, custodian, and separate effect authorization to the plan.

#### Scenario: A raw pair has no semantic authority

- **WHEN** a caller authorizes an exact raw-file plan without an Edition or Candidate
- **THEN** the existing installer may apply or recover its file effect
- **AND** its receipt makes no semantic qualification or product-release claim

#### Scenario: A qualified request selects prior evidence without replaying Provider code

- **WHEN** `architecture.qualified-file-publication/v1` selects an exact
  dual-media Candidate container, Qualification Set, policy, and prior report
- **THEN** planning derives static SVG and PNG plus interactive HTML payloads,
  claimant and editor attribution, and the target prestate from those bytes
- **AND** it rechecks submitted policy fit but neither reruns the Provider nor
  authenticates a verifier, accepter, or source claimant
- **AND** an explicit local custody target may be outside the request directory
  without allowing it to overlap selected source files

#### Scenario: Adoption and local effect authorization are separate

- **WHEN** `architecture.qualified-file-authorization/v1` binds a plan
- **THEN** one clause records the named accepter's exact Candidate and policy
  adoption and another authorizes the local target effect
- **AND** neither clause alone installs files or grants hosted release authority

#### Scenario: Qualified recovery survives removal of original inputs

- **WHEN** an authorized dual-media installation has a retained plan,
  authorization, and recovery journal but no original Candidate or Provider
- **THEN** recovery verifies the installed result or restores the retained
  prestate without rematerializing source inputs

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

#### Scenario: A plan or artifact changes after authorization

- **WHEN** the supplied authorization does not bind the exact Candidate,
  qualification set, target, prestate, or file-plan digest
- **THEN** local publication fails before delivery target changes
- **AND** a prior accepted publication remains untouched

#### Scenario: A decision names another plan

- **WHEN** either admission case receives authorization for another plan or
  target prestate
- **THEN** the operation fails before delivery target, Git, package, or forge effects
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

### Requirement: Replaceable Skill projection

The repository SHALL provide one portable Skill that invokes public `archpub`
commands with explicit inputs and digests. The Skill SHALL NOT own lifecycle
state, authorization, Edition meaning, qualification, or generated artifacts.

#### Scenario: An agent follows the Skill

- **WHEN** an agent publishes a source-bound Architecture Edition
- **THEN** it invokes the existing public command and reports its scoped result
  and limits
- **AND** it does not synthesize acceptance, edit generated files, or bypass
  repository governance

### Requirement: CI as a gate projection

Repository CI SHALL install lockfile-selected dependencies and invoke the same
repository-native checks used locally. CI SHALL NOT define a separate semantic,
visual, acceptance, product identity, or publication policy.

#### Scenario: A proposed change reaches GitLab CI

- **WHEN** the pipeline runs in a clean checkout
- **THEN** repository-native syntax, behavior, structure, artifact, and selected
  qualification gates run without credentials
- **AND** failure blocks the job without publishing artifacts or changing refs

### Requirement: Local file effects do not grant release custody

Neither raw nor qualified local admission SHALL grant source release, Git or
Forge effects, hosted availability, or off-host retention.

#### Scenario: A valid Candidate lacks release custody

- **WHEN** a qualified Candidate has no selected release owner or custodian
- **THEN** local preview and export remain available
- **AND** no hosted release, indefinite retention, or off-host recovery claim
  is emitted
