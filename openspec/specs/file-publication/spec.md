# file-publication Specification

## Purpose

Expose explicit paired-file planning, authorized installation and recoverable
effects through the installed CLI, independently of project-specific semantic
qualification and without duplicating the filesystem installer.

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

### Requirement: Exact managed edition replacement

The existing paired-file installer SHALL support explicit previous-plan and
authorization selection, derive ownership from that plan, bind current preimages,
preserve unknown contents and recover bounded interrupted effects.

#### Scenario: Replace unchanged previously owned files

- **WHEN** selected prior plan, receipt and managed file bytes match the actual installation
- **THEN** a dry-run identifies replacements, additions and removed owned payload
- **AND** the authorized operation installs the new pair while preserving foreign contents and rollback material

#### Scenario: User has changed a managed file

- **WHEN** any selected managed preimage is changed or missing
- **THEN** replacement fails before destination effects and preserves the user's bytes

#### Scenario: Foreign files appear in a prior receipt inventory

- **WHEN** the prior installer recorded foreign content alongside its own payload
- **THEN** only prior plan payload and controlled entries count as managed ownership
- **AND** the new edition cannot delete or overwrite recorded foreign content

#### Scenario: Interrupted replacement or exact replay

- **WHEN** replacement is interrupted at either destination
- **THEN** existing journaled recovery verifies exact state before continuation or compensation
- **AND** replay of a fully installed exact operation performs no further replacement

### Requirement: File publication reports its storage-durability boundary

The existing installer SHALL flush newly written owner, journal, payload and
metadata files through writable handles. Required file or supported directory
flush failures SHALL reject success. Results SHALL distinguish process recovery
from storage durability and disclose unsupported Windows directory flush.
Installation SHALL NOT claim qualified power-loss recovery.

#### Scenario: Publication writes on native Windows

- **WHEN** the existing installer writes an authorized file pair on Windows
- **THEN** newly created files are flushed through their writable handles
- **AND** the result declares directory flush unsupported and power-loss recovery unqualified
- **AND** file flush failure remains an error, not a successful effect

#### Scenario: A supported directory flush fails

- **WHEN** a required directory flush fails on a supported native platform
- **THEN** the installer preserves the failure without silently ignoring its error code
- **AND** no passing installation result is emitted

#### Scenario: A process stops during installation

- **WHEN** a process is interrupted with retained plan, journal and inventories
- **THEN** the existing recovery owner verifies actual retained bytes before compensation
- **AND** this evidence does not qualify recovery after storage power loss
