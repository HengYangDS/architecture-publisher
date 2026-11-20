## MODIFIED Requirements

### Requirement: Contents

The contents SHALL list the plates alone, one row a plate: its number, its title and its question, the whole row a
link to the plate, and no page number. Where the model states an overview, the left half of the first page SHALL
open with the overview's entry, its name and claim and no number, a link to the overview's page. Under it SHALL
stand the scope, the limits and a reading note, each under a rule across the half.

#### Scenario: The overview's entry

- **WHEN** a model with an overview statement and six views is built
- **THEN** the contents hold six rows and the overview's entry, and each of the seven links to its page

#### Scenario: A row names no page

- **WHEN** the contents are set
- **THEN** a row holds its plate's number, title and question and no other number

#### Scenario: The overview's entry is no plate

- **WHEN** the contents of a model with an overview statement are set
- **THEN** the entry's head is the overview's name in the capitals that head the scope, and it prints no number
