# publication-contract Specification

## Purpose

Define the shared publication admission boundary and the replaceable Skill and
CI projections that invoke it without acquiring intent, lifecycle or effect
authority.

## Requirements

### Requirement: One publication admission predicate

Generic and Edition-specific publication adapters SHALL use one exact-field,
product-identity, Edition, qualification, and plan-bound decision predicate.
Edition-specific evidence and authority checks SHALL remain explicit extensions
rather than being weakened into the shared core. Publication SHALL distinguish
preparation, accepted source, artifact qualification, installation, hosted
availability, release, and recovery.

#### Scenario: A decision names another plan

- **WHEN** a generic or qualified publication decision does not bind the selected
  plan digest, Edition identity, product identity, or applicable qualifications
- **THEN** the operation fails before filesystem, Git, package, or forge effects

#### Scenario: A valid artifact lacks flagship qualification

- **WHEN** a technically valid artifact has no applicable human visual decision
- **THEN** it may be published only under a non-flagship scope
- **AND** no surface describes it as the accepted flagship Edition

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
