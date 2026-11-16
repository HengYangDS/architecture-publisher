## ADDED Requirements

### Requirement: A model states no position

The Architecture Model SHALL say what a work's parts, relations and views are and SHALL NOT say where anything
stands on a page: its schema SHALL hold no property of a coordinate, an offset, a row or a column, or a width or a
height. A test SHALL refuse a schema that holds one.

#### Scenario: A property of position

- **WHEN** the model's schema gains a property named for a coordinate, such as `x`
- **THEN** the test fails and names the property and where it stands in the schema

#### Scenario: The schema as tracked

- **WHEN** the test reads every property of the tracked schema
- **THEN** it finds none of position
