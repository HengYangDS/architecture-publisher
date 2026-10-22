## MODIFIED Requirements

### Requirement: Historical Edition and Provider contracts remain truthful

Historical signed artifacts and exact recovery fixtures SHALL retain their
original bytes, meaning and acceptance identities. The current Claim-backed
Edition executor SHALL accept only class-free `architecture.edition/v2`.
Current Providers SHALL bind that contract, and current consumers SHALL migrate
without a v1 compatibility or quality-tier adapter. Historical recovery SHALL
select the original versioned executor, not reinterpret old documents through
the current runtime.

#### Scenario: A v1 Edition is replayed

- **WHEN** unchanged historical v1 inputs are selected for recovery
- **THEN** their original versioned executor retains their semantic choices and
  identity-only authoring interpretation
- **AND** the current executor neither accepts the retired contract nor claims
  fresh output or historical approval from a custody-only check

#### Scenario: Retired classed input reaches the current executor

- **WHEN** an Edition v1 value or a class field is supplied
- **THEN** the current contract rejects it without mutation or output
- **AND** historical source, Candidate and qualification bytes remain unchanged

## ADDED Requirements

### Requirement: Current Edition requires complete visual review duties

Every current Claim-backed Edition SHALL declare faithful, intelligible and
aesthetic visual review for both its static physical output and interactive
viewport. Current Project authoring SHALL remain class-free. The selected
qualification policy SHALL cover those three human predicates for every
selected PNG and standalone HTML artifact before complete policy coverage can
be reported. Candidate generation SHALL not claim acceptance or publication.

#### Scenario: Technical probes omit visual review

- **WHEN** a submitted policy has complete machine evidence but omits an output's
  human faithful, intelligible or aesthetic requirement
- **THEN** it cannot qualify as complete publication policy
- **AND** no-policy diagnostic observations remain non-authorizing

## REMOVED Requirements

### Requirement: Edition classes expose different promises

**Reason**: Distinct class promises contradict the approved uniform quality
contract and class-free current Edition. Technical completeness alone does not
establish aesthetic acceptance for any selected output.

**Migration**: Apply `Current Edition requires complete visual review duties`
to every current Edition and the sole `publication-qualification` owner to
every selected artifact. Historical signed outputs and their original
executors remain immutable; they do not define current quality classes.
