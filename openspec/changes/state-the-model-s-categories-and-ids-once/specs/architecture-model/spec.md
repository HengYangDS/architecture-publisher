## ADDED Requirements

### Requirement: The categories and ids of the model stated once

The model's categories, its default category, the form of its ids and the earlier versions the publisher converts
SHALL each be stated once in the publisher's code; where a unit that may not read the model restates one, the test
suite SHALL hold it to the model's. How each category looks SHALL stand in one table, and the LikeC4 import SHALL
make every id from the model's id pattern, up to its longest length.

#### Scenario: A category without its look

- **WHEN** the schema states a category the table of looks lacks, or the drawing units' category for a part with no
  kind differs from the schema's default
- **THEN** the test suite fails and names the difference

#### Scenario: Long LikeC4 names

- **WHEN** ten LikeC4 elements have names that differ only after the model's longest id
- **THEN** the first gets the longest id the pattern accepts, and each later one the same cut short for its suffix
