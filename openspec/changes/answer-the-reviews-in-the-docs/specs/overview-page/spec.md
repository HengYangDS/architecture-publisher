## MODIFIED Requirements

### Requirement: Overview in the print edition

In the print edition the overview SHALL be drawn from the model's statement in
place, so its text is text, and its imprint SHALL be the edition's foot, which
states the revision and its date once.

#### Scenario: Searchable overview text

- **WHEN** the print edition of a model with an overview statement is built
- **THEN** the overview's masthead claim can be extracted as text from its page

#### Scenario: A Chinese model's masthead

- **WHEN** the print edition of a zh-CN model with an overview statement and a revision is built
- **THEN** the overview's masthead sets no build line, in Chinese or in English
- **AND** the overview's page states the revision and its date in its foot only
