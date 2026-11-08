## MODIFIED Requirements

### Requirement: Overview in the print edition

In the print edition the overview SHALL be compiled from its composition in
place, so its text is text, its imprint SHALL be the edition's foot, and its
masthead SHALL set the edition's build line in the model's language.

#### Scenario: Searchable overview text

- **WHEN** the print edition of a model with a composition is built
- **THEN** the overview's masthead claim can be extracted as text from its page

#### Scenario: A Chinese model's masthead

- **WHEN** the print edition of a zh-CN model with a composition is built
- **THEN** the overview's masthead sets 构建于 and the revision
- **AND** it sets no English build line
