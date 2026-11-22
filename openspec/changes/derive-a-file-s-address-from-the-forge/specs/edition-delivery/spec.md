## MODIFIED Requirements

### Requirement: Links to cited files

When the model's repository has a browse template, declared or implied by its
address, each card title on a plate SHALL link to the first file the manifest
records for its component, the template's `{revision}` and `{path}` filled with
the pinned revision and that path. Without one, no card title SHALL link.

#### Scenario: A browsable repository

- **WHEN** a model declares
  `browse: "https://github.com/o/r/blob/{revision}/{path}"` and a component owns
  `src/a.mjs`
- **THEN** that component's card title links to
  `https://github.com/o/r/blob/<revision>/src/a.mjs`

#### Scenario: A GitHub address without a template

- **WHEN** a model declares `url: "https://github.com/o/r.git"` and no `browse`,
  and a component owns `src/a.mjs`
- **THEN** that component's card title links to
  `https://github.com/o/r/blob/<revision>/src/a.mjs`
