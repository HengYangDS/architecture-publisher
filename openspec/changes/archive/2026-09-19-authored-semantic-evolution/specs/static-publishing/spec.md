## ADDED Requirements

### Requirement: Source-bound static carrier edits

Candidate composition SHALL bind authored visible carrier edits to exact source
values and validate them using actual measured glyphs and emitted geometry.
It SHALL NOT weaken accepted replay locks or silently remove infeasible text.

#### Scenario: Changed meaning fits a declared carrier

- **WHEN** exact source-bound authored text fits the declared composition constraints
- **THEN** the complete overview carries the changed meaning and produces new candidate identities

#### Scenario: Text exceeds composition capacity

- **WHEN** changed text violates spacing, bounds or overlap constraints
- **THEN** composition fails and the prior accepted publication remains unchanged
