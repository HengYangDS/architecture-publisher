## ADDED Requirements

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
