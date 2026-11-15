## MODIFIED Requirements

### Requirement: Question-led page

The page SHALL be titled with the model's question and open with its summary as the conclusion and its scope,
limits and attribution as the page scope, each ended as a sentence. Each view SHALL be one panel, in the plan's
order, titled with the view's question, or with its title when its question is the model's own, and holding that
view's native architecture diagram. The page SHALL NOT print digests, verification records or complete source
lists; they stay in the delivery's data.

#### Scenario: Four views

- **WHEN** a model declares four views
- **THEN** the page has four panels in that order, each with its question as its title and its diagram
- **AND** no panel lists a SHA-256 digest

#### Scenario: An overview that asks the model's question

- **WHEN** an overview's question is the model's question
- **THEN** its panel is titled with the overview's title and the question appears once on the page
