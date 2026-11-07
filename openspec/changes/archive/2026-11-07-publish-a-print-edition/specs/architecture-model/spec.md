## MODIFIED Requirements

### Requirement: One explicit model input

The publisher SHALL accept one Architecture Model file as its only input. The
model SHALL declare components and relations and MAY declare its language, a
repository, the files each component owns and each relation cites, kinds,
groups, views, scope, limits, editors, a licence and a template for browsing
its repository. The publisher SHALL NOT infer components or relations from
repository contents.

#### Scenario: A minimal model validates

- **WHEN** a model declares only its format, version, id, title and question,
  components with an id and a label, and relations with an id, endpoints and
  a label
- **THEN** it validates with default kinds, statuses and views

#### Scenario: A minimal model builds

- **WHEN** such a model is built
- **THEN** the build succeeds, on sparse pages when its components cannot fill
  a balanced one
- **AND** every declared component and relation appears on its posters and
  the page

#### Scenario: No model is supplied

- **WHEN** a build names a repository but no model
- **THEN** the command refuses as a usage error without reading the repository

## ADDED Requirements

### Requirement: Editors and licence

A version 3 model MAY declare `editors`, a non-empty list in which each editor
has a `name` and MAY have a `url`, and `license`, an SPDX licence expression.
The publisher SHALL refuse an `attribution` field, an empty editor list, an
editor without a name, and a licence that is not an SPDX expression.

#### Scenario: Declared editors and licence

- **WHEN** a version 3 model declares `editors: [{ "name": "Yang HENG" }]` and
  `license: "MIT"`
- **THEN** it validates

#### Scenario: An attribution in a version 3 model

- **WHEN** a version 3 model declares `attribution`
- **THEN** validation refuses with the problem at `/attribution`

### Requirement: Version 2 models migrate

`archpub migrate` SHALL convert a version 2 model to version 3, carrying every
field except `attribution`. When the version 2 model declares an attribution
and no editors, migration SHALL refuse with `attribution_not_migrated`, name the
attribution's text, and write nothing.

#### Scenario: A model without an attribution

- **WHEN** a version 2 model without an attribution is migrated
- **THEN** the result is a version 3 model with every other field unchanged

#### Scenario: An attribution the author has not replaced

- **WHEN** a version 2 model declares `attribution` and no `editors`
- **THEN** migration refuses with `attribution_not_migrated` naming that text
- **AND** no file is written

### Requirement: Repository browse template

A version 3 model's repository MAY declare `browse`, a URL with the
placeholders `{revision}` and `{path}`. The publisher SHALL refuse a template
that lacks either placeholder.

#### Scenario: A template without a path

- **WHEN** a model's repository declares
  `browse: "https://github.com/o/r/tree/{revision}"`
- **THEN** validation refuses with the problem at `/repository/browse`
