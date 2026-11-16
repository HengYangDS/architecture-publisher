## ADDED Requirements

### Requirement: A queue item's Change rests on research

The design of an active Change that names a queue item SHALL name a page of `docs/research/` that the repository
holds. A test SHALL refuse such a Change whose design names no page, or names a page the repository lacks. A
maintenance Change MAY rest on none.

#### Scenario: A Change of an item that rests on no research

- **WHEN** an active Change names a queue item and its design names no page of `docs/research/`
- **THEN** the test fails and names the Change

#### Scenario: A Change that names a page the repository lacks

- **WHEN** the design of an active Change that names a queue item names a page of `docs/research/` that is not
  tracked
- **THEN** the test fails and names the Change and the page

#### Scenario: A maintenance Change

- **WHEN** an active Change names `maintenance` and its design names no page of `docs/research/`
- **THEN** the test passes
