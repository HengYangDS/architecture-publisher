## MODIFIED Requirements

### Requirement: Identity and meaning are preserved

The delivery's data SHALL carry, unchanged, every component's and relation's id, label, details, status and files,
each component's kind and each relation's endpoints, and every view's id, members and relations, and the manifest
SHALL bind the model by its digest. Presentation SHALL NOT rename, merge, reorder the details of or invent model
elements; relations that share one label on a bus SHALL each keep their own end at their target.

#### Scenario: Details survive into every medium

- **WHEN** a relation declares the detail `state: desired client bindings`
- **THEN** the poster prints it beside that relation
- **AND** the data's statements record it for that relation id

#### Scenario: Fan-out relations share a label

- **WHEN** four relations from one component have the same label and no details
- **THEN** the poster prints that label once on their shared bus
- **AND** the data still lists four relations with their own ids
