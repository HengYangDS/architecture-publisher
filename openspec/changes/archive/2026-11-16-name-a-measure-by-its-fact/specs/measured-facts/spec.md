## ADDED Requirements

### Requirement: The words of a measure follow its fact

The words the edition sets of a measured fact SHALL be kept, in every language the publisher speaks, under the
property of that fact in the catalogue, and a plate's key SHALL take the words of an entry by its property. Words
under a property the catalogue lacks SHALL be refused. The words of a fact whose unit is bytes SHALL name a size,
and the words of a fact whose unit is files SHALL name files; they SHALL NOT name a kind of content, such as code,
that the fact does not measure.

#### Scenario: A part that owns no program source

- **WHEN** a plate is built of a part whose only file is a Markdown file
- **THEN** its key says of the strip's length that it is the size of the part's files, and names no code

#### Scenario: A language without the words of a property

- **WHEN** one language lacks the words of a property that another language has
- **THEN** the test fails and names the language and the property

#### Scenario: Words under an unknown property

- **WHEN** the words name a property the catalogue does not hold
- **THEN** the test fails and names the property
