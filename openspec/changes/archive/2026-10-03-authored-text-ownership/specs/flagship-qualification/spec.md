## ADDED Requirements

### Requirement: Authored interior text declares a scene-local owner

Authored text MAY name one source-bearing node through optional `owner`.
Publisher SHALL check exact owner identity and structural-reference locality.
An owner SHALL NOT grant source authority, statement truth or acceptance.
Ownerless text SHALL retain its current collision behavior.

#### Scenario: A measured source label belongs inside its component

- **WHEN** a label names its source-bearing node and carries only that node's structural references
- **THEN** Publisher admits the explicit relationship for independent geometry qualification
- **AND** it does not infer verified wording or source acceptance

#### Scenario: A label names a missing or geometry-only owner

- **WHEN** its owner is absent, ambiguous or an adornment
- **THEN** Publisher refuses the scene before painting

#### Scenario: A neighboring label borrows another node's allocation

- **WHEN** interior text carries structural meaning not bound to its declared owner
- **THEN** Publisher rejects the misleading binding without selecting another owner

### Requirement: Interior text preserves containment and non-owner clearance

Publisher SHALL require owned text's measured glyph box inside its owner's
semantic port box with an eight-unit inset. Only the containing owner paint
is exempt from text-node collision. Other text, nodes, primitives, paths and
arrowheads SHALL retain their independent clearance checks.

#### Scenario: Valid interior text is rendered through the public build

- **WHEN** exact-font text fits its declared node allocation and clears all other geometry
- **THEN** static and interactive each qualify and paint their own scene
- **AND** the result does not reuse sibling coordinates or approval

#### Scenario: Glyphs exceed the owner's inset

- **WHEN** the measured text box crosses the declared inner allocation
- **THEN** Publisher refuses it without shrinking text, moving ports or enlarging the owner

#### Scenario: A route crosses an otherwise valid interior label

- **WHEN** a path or arrow intersects the label's clearance envelope
- **THEN** Publisher rejects the collision despite the valid node owner

#### Scenario: Interior decoration covers owned text

- **WHEN** a subsequent filled primitive or any primitive contour enters the measured label clearance
- **THEN** Publisher rejects the collision rather than exempting the entire owner

#### Scenario: A native component already paints its own labels

- **WHEN** additional authored text overlaps native component paint
- **THEN** Publisher retains the native collision rule despite a declared owner

#### Scenario: Ownerless accepted inputs are rebuilt unchanged

- **WHEN** the selected input does not declare text ownership
- **THEN** its prior geometry and rendering behavior are preserved
- **AND** an earlier accepted artifact is not rewritten or automatically approved anew
