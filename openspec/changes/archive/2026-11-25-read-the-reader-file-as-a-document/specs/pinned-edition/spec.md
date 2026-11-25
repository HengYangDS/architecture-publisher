## MODIFIED Requirements

### Requirement: No projection holds what the data lacks

The build and `archpub check` SHALL refuse with `projection_fact_unknown` when a plate's face or a diagram of the
page the publisher generates names a component, relation or group the data's statements lack, or when a plate
draws a scale of a property the catalogue lacks. The refusal SHALL name the projection and what it holds. A guide's
diagrams SHALL NOT be held to the data. The reader file SHALL be written from the data, and its items' ids SHALL be
held to the model (`reader_ids_differ`).

#### Scenario: A plate that names an unknown part

- **WHEN** a plate's face names a component id the data's statements lack
- **THEN** the build refuses with `projection_fact_unknown` and names the plate and the id

#### Scenario: A reader file with another value

- **WHEN** the data holds 5 cited files for a relation
- **THEN** the reader file states `cited-files` as `5 files`, written from the data, and nothing reads it back

#### Scenario: A generated page

- **WHEN** the page the publisher generates for a model without a guide draws a relation the data lacks
- **THEN** the build refuses with `projection_fact_unknown` and names the relation

#### Scenario: A guide's diagram

- **WHEN** a guide's diagram draws a node whose id the model lacks
- **THEN** the build is not refused, and the node is matched or listed as unmatched
