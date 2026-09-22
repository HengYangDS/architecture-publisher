# edition-publication Specification Delta

## MODIFIED Requirements

### Requirement: Generic inputs are explicit and repository-independent

An Edition build SHALL consume an exact Source Bundle, a Claim Model bound to
that bundle, an Edition, and a build request selecting their identities and the
output location. These values MAY be selected directly or materialized first by
one exact Edition Provider manifest. A repository, Git checkout, SDD
implementation, unselected source adapter, provider implementation, or
product-specific schema SHALL NOT be an implicit input to the generic build.

#### Scenario: Standard inputs are relocated

- **WHEN** a valid Source Bundle, Claim Model, Edition, and build request move
  together to a machine without their source repository or provider
- **THEN** the installed core produces the same candidate bytes offline
- **AND** a changed selected byte fails identity verification rather than being
  rediscovered from the environment

#### Scenario: Provider materialization precedes build

- **WHEN** a build request selects an admitted Edition Provider manifest
- **THEN** provider materialization emits only standard-value inputs before the
  existing Edition build begins
- **AND** the provider result makes no compilation, qualification, acceptance, or
  publication claim

### Requirement: Concrete Edition authority remains with its source product

Architecture Publisher SHALL own the Provider, Edition, validation, compilation,
qualification, and publication contracts. A source-owned live Provider and
Edition SHALL own their subject selection, audience, questions, claims,
omissions, narrative, scenes, and native authorization in the repository whose
architecture they state. A central migration copy SHALL NOT remain as a parallel
mutable authority after parity.

#### Scenario: A source product publishes an Edition package

- **WHEN** the package emits valid portable standard values through the public
  provider contract
- **THEN** Architecture Publisher can build and qualify them without source-repo
  discovery or product-specific branches
- **AND** Publisher records do not authorize or reinterpret the source product
