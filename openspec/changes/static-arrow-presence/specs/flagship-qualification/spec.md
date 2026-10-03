## ADDED Requirements

### Requirement: Static directional checks follow arrow presence

Static qualification SHALL apply arrow-terminal length and arrowhead envelopes
only when the edge is not explicitly unarrowed. Explicit `arrow: false` SHALL
retain shaft, attachment, path and glyph-clearance checks. An absent legacy
flag SHALL retain its existing default-arrow meaning. Inactive arrow parameters
SHALL NOT create painted direction or extend an unarrowed shaft's envelope.

#### Scenario: A short unarrowed junction bridge

- **WHEN** an attached, clear literal segment has `arrow: false` and a nonzero two-unit shaft
- **THEN** static qualification admits its shaft without an arrow minimum or envelope

#### Scenario: A true or default arrow is too short

- **WHEN** a directional edge's final shaft is shorter than the required arrow terminal
- **THEN** qualification rejects it whether its arrow flag is true or historically absent

#### Scenario: Unarrowed geometry still crosses text

- **WHEN** an unarrowed shaft enters a measured glyph-clearance envelope
- **THEN** qualification rejects the collision without an ownership exemption

#### Scenario: Inactive arrow parameters are geometrically invalid

- **WHEN** `arrow: false` has a schema-valid zero-valued arrow parameter record
- **THEN** static paint auditing does not evaluate an arrow that is not drawn
- **AND** active-arrow parameter checks remain unchanged

#### Scenario: A source route loses its directional terminal

- **WHEN** an authored relation ends with an unarrowed final traversal
- **THEN** the existing source-route validator still rejects it
