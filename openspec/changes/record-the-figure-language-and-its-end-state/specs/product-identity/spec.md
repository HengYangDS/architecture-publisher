## MODIFIED Requirements

### Requirement: The roadmap is one queue in the contract

The product contract SHALL hold the roadmap as one ordered queue of named items. Each active Change's proposal
SHALL name its queue item or `maintenance`. A test SHALL refuse an active Change that names no item, an unknown
item, or an item that an unfinished item precedes, and a maintenance Change that changes the layout, plate, page,
overview or edition source. The design of an active Change that names a queue item SHALL name a page of
`docs/research/` that the repository holds, and the test SHALL refuse one whose design names none.

#### Scenario: A Change out of order

- **WHEN** an active Change names a queue item and an earlier item is unfinished
- **THEN** the test fails and names both items

#### Scenario: A maintenance Change in the drawing source

- **WHEN** a Change that names `maintenance` changes a file of the plate source
- **THEN** the test fails and names the file

#### Scenario: A Change of an item that rests on no research

- **WHEN** an active Change names a queue item and its design names no page of `docs/research/`
- **THEN** the test fails and names the Change

#### Scenario: A Change that names a page the repository lacks

- **WHEN** the design of an active Change that names a queue item names a page of `docs/research/` that is not
  tracked
- **THEN** the test fails and names the Change and the page
