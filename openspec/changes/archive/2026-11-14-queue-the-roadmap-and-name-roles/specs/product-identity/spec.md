## ADDED Requirements

### Requirement: The roadmap is one queue in the contract

The product contract SHALL hold the roadmap as one ordered queue of named items. Each active Change's proposal
SHALL name its queue item or `maintenance`. A test SHALL refuse an active Change that names no item, an unknown
item, or an item that an unfinished item precedes, and a maintenance Change that changes the layout, plate, page,
overview or edition source.

#### Scenario: A Change out of order

- **WHEN** an active Change names a queue item and an earlier item is unfinished
- **THEN** the test fails and names both items

#### Scenario: A maintenance Change in the drawing source

- **WHEN** a Change that names `maintenance` changes a file of the plate source
- **THEN** the test fails and names the file

### Requirement: Roles name no kind of holder

The product's documents, Skill and shipped source SHALL name the roles a work passes through, the author, the
reviewer and the reader, and SHALL NOT presume that a role's holder is a person. A test SHALL refuse such wording.

#### Scenario: A document presumes a person

- **WHEN** a tracked document says that a person accepts a delivery
- **THEN** the test fails and names the document and the line

### Requirement: Claims no stronger than the check

The product's statement of itself SHALL claim no more than its check proves: that each file a component claims and
a relation cites exists at the pinned commit. It SHALL NOT say that a relation is proved by the files it cites.

#### Scenario: The README's first sentence

- **WHEN** a reader opens the README
- **THEN** its first sentence says the publisher checks that the cited files exist at one pinned commit
