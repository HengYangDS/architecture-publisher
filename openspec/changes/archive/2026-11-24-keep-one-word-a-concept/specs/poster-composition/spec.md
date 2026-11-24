## ADDED Requirements

### Requirement: One word a concept

Within one language the words the publisher sets itself SHALL name each concept
of its term table, `docs/reference/terms.md`, by that language's word in the
table, in every key the table lists for the concept.

#### Scenario: The English index

- **WHEN** an English edition's index introduces the components and their plates
- **THEN** it says "Components and the plates that draw them", as the page says component

#### Scenario: The boundary in the key

- **WHEN** a plate of a Traditional Chinese, Spanish or Korean model draws its boundary
- **THEN** its key names the boundary by its name alone, as English and Simplified Chinese do
