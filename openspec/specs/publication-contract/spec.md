# publication-contract Specification

## Purpose
Define the shared publication admission boundary and the replaceable Skill and
CI projections that invoke it without acquiring intent, lifecycle or effect
authority.

## Requirements

### Requirement: One publication admission predicate

Generic and edition-specific publication adapters SHALL use one exact-field and
plan-bound decision predicate. Edition-specific evidence and authority checks
SHALL remain explicit extensions rather than being weakened into the shared core.

#### Scenario: A decision names another plan

- **WHEN** a generic or qualified publication decision does not bind the selected plan digest
- **THEN** the operation fails before filesystem effects

### Requirement: Replaceable Skill projection

The repository SHALL provide one portable Skill that invokes public CLI commands
with explicit inputs and digests. The Skill SHALL NOT own lifecycle state,
authorization or generated artifacts.

#### Scenario: An agent follows the Skill

- **WHEN** an agent publishes a source-bound architecture
- **THEN** it invokes the existing CLI and reports its scoped result and limits
- **AND** it does not synthesize acceptance or bypass repository governance

### Requirement: CI as a gate projection

Repository CI SHALL install the lockfile-selected dependencies and invoke the
existing syntax and behavior gates. CI SHALL NOT define a separate semantic or
publication policy.

#### Scenario: A proposed change reaches GitLab CI

- **WHEN** the pipeline runs in a clean checkout
- **THEN** the same repository-native checks used locally run without credentials
- **AND** failure blocks the job without publishing artifacts or changing refs
