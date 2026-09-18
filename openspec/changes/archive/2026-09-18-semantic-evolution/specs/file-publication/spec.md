## ADDED Requirements

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
