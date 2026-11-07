## MODIFIED Requirements

### Requirement: The guide as the page

When a model names a guide, the page SHALL be the guide: its draft and the files
its `@diagram source=`, `@chart data=` and `@image path=` arguments name, staged
from the draft's directory. A named file that is a link, lies outside that
directory or is missing SHALL be refused, and so SHALL a draft whose `@meta`
names a repository or revision other than the model's. Archify's writing checks
SHALL be strict at the showcase quality and warnings at the standard quality.

#### Scenario: A guide with a sequence

- **WHEN** a model names a guide whose draft draws a sequence and cites a
  repository file
- **THEN** the page is that guide, delivered as `<model id>.html`

#### Scenario: A draft for another revision

- **WHEN** a guide's `@meta` names a revision other than the model's
- **THEN** the build refuses with `guide_repository_mismatch` and writes nothing
