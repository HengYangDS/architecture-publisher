## ADDED Requirements

### Requirement: The fields of the model's objects stated once

The fields each object of the model takes, required and allowed, and the fewest items of each list SHALL be stated
once, in the model's schema, and the publisher's checks SHALL read them from there. A missing required field SHALL be
reported before the object's unknown fields and the problems of its values.

#### Scenario: An object or a list the checks do not read

- **WHEN** an object of the schema with fields, or a list with a fewest number of items, is not read by the
  publisher's checks, or an object is checked against fields written by hand
- **THEN** the test suite or the static check fails and names it

#### Scenario: A spur without its point

- **WHEN** a spur of the overview's course names no `at` and holds a misspelt field
- **THEN** the publisher reports `at` as required before the misspelt field

#### Scenario: A spur that names its view

- **WHEN** a spur of the overview's course names a view the model declares
- **THEN** the publisher accepts it, and the schema accepts it too
