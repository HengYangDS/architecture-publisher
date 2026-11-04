## MODIFIED Requirements

### Requirement: Header, legend and notes

Each poster SHALL lead with a title and question: the model's on the first
page; on a later page of one view, that view's, under the model's title when
the view has its own; on a later page of several views, the model's title
alone, each plate asking its own question. Each poster SHALL show one legend
of the kinds, the system boundary and the statuses present, and notes with the
scope, limits, repository and revision and attribution, and SHALL NOT state
whether its files were verified.

#### Scenario: Evidence stays off the poster

- **WHEN** a build verifies the digest of every file the model cites
- **THEN** the poster's notes name the repository and its revision
- **AND** the poster prints no digest and no verification state

#### Scenario: A later page of one view

- **WHEN** the second page holds one view with its own title and question
- **THEN** it leads with them under the model's title
