## MODIFIED Requirements

### Requirement: One date a page

Every page of the edition SHALL state the commit and its date once: a plate's
page and the overview in their foot, the cover in its byline. The key of a page
SHALL state none.

#### Scenario: One date a page

- **WHEN** a plate's page is typeset from a pin with a commit date
- **THEN** the date stands in the page's foot and nowhere in its key

#### Scenario: The cover and the overview

- **WHEN** an edition with an overview is typeset from a pin
- **THEN** the cover states the date in its byline alone, and the overview states the commit and its date in its foot alone
