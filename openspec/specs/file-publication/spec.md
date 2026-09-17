# file-publication Specification

## Purpose
TBD - created by archiving change portable-publication. Update Purpose after archive.

## Requirements

### Requirement: Independent paired-file publication
The installed CLI SHALL expose planning, application and recovery of explicitly
selected file pairs through the existing installer without ETHOS edition code,
source adapters, credentials or developer checkouts. Its result SHALL identify
file-integrity scope and SHALL NOT establish semantic or visual qualification.

#### Scenario: Relocated independent inputs
- **WHEN** a caller plans a non-ETHOS file pair using paths relative to an input file outside the checkout
- **THEN** the plan binds exact resolved sources, targets, prestates and payload identities
- **AND** planning leaves delivery targets unchanged

#### Scenario: Authorized installation and recovery
- **WHEN** a caller supplies the exact emitted plan and explicit matching authorization
- **THEN** the existing installer preserves unmanaged content and installs only the admitted files
- **AND** recovery of that completed operation reports its existing installed state

### Requirement: Strict input and effect boundaries
The CLI SHALL reject malformed, oversized, symbolic-link or unsupported JSON
inputs before effects. Planning paths SHALL resolve relative to the input file;
application and recovery SHALL retain the emitted plan's exact target bindings.

#### Scenario: Changed bytes or missing authorization
- **WHEN** a selected source changes after planning or authorization does not match the exact plan
- **THEN** installation fails and original target contents remain unchanged

#### Scenario: Unsafe or ambiguous input
- **WHEN** the input contains a symbolic-link path, unknown field or invalid target configuration
- **THEN** the command fails without installing files
