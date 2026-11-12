# architecture-model Specification

## Purpose

Accept one explicit, portable Architecture Model of any repository, authored by
an agent or a person or imported from LikeC4, and preserve its identities and
meaning in every output.

## Requirements

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

### Requirement: Complete validation before output

The publisher SHALL validate the model against its published schema and its
references before any output. It SHALL refuse unknown fields, unsupported
format versions, duplicate identifiers, empty labels, references to undeclared
components or groups, relations whose endpoints are absent and invalid file
paths, and it SHALL report every problem with its JSON path in one result.

#### Scenario: Several problems are reported together

- **WHEN** a model has a duplicate component id and a relation to an
  undeclared component
- **THEN** the build refuses with both problems and their JSON paths
- **AND** no output directory is created

#### Scenario: An unsupported format version

- **WHEN** a model declares a format version the installed publisher does not
  support
- **THEN** the build refuses and names the supported version

#### Scenario: A version 1 model

- **WHEN** a model declares version 1
- **THEN** the build refuses and names `archpub migrate`

### Requirement: Identity and meaning are preserved

The manifest SHALL carry, unchanged, every component's and relation's id,
label, details, status and files, each component's kind and each relation's
endpoints, and every view's id, members and relations, and SHALL bind the rest
of the model by its digest. Presentation SHALL NOT rename, merge, reorder the
details of or invent model elements; relations that share one label on a bus
SHALL each keep their own end at their target.

#### Scenario: Details survive into every medium

- **WHEN** a relation declares the detail `state: desired client bindings`
- **THEN** the poster prints it beside that relation
- **AND** the manifest's evidence records it for that relation id

#### Scenario: Fan-out relations share a label

- **WHEN** four relations from one component have the same label and no
  details
- **THEN** the poster prints that label once on their shared bus
- **AND** the manifest still lists four relations with their own ids

### Requirement: Editorial decisions are optional

Kinds, statuses, groups and views SHALL be optional. When kind labels, legend
order, categories or icons are absent, the publisher SHALL derive them
deterministically: labels from kind names, order from first appearance, the
`backend` category and each category's default icon.

#### Scenario: Kinds without declarations

- **WHEN** components use three kinds that the model does not declare
- **THEN** the legend lists them in first-appearance order with their kind
  names as labels
- **AND** a rebuild assigns the same icons and color families

### Requirement: Model language

A model MAY name the language it is written in as `locale`: `en`, `zh-CN`,
`zh-TW`, `es` or `ko`, each a language Archify's page speaks; a model that
names none is English. The publisher SHALL set the words it writes itself in
that language on both media and SHALL refuse any other value with
`model_locale_unsupported`.

#### Scenario: A Chinese model

- **WHEN** a model declares `locale: zh-CN` and groups that need an overview
- **THEN** the overview's group details are named 包含 and its aggregated
  relations 关系数
- **AND** the page declares the language `zh-CN`

#### Scenario: An unsupported language

- **WHEN** a model declares `locale: fr`
- **THEN** validation refuses it at `/locale` and lists the supported languages

### Requirement: Portable model id

A model's id names its directory when a delivery is published, so validation
SHALL refuse an id that is a Windows device name, alone or before an
extension, or that ends with a dot, with `model_id_unportable`.

#### Scenario: A device name

- **WHEN** a model's id is `con`
- **THEN** validation refuses it at `/id` with `model_id_unportable`

### Requirement: Kind categories and icons

A kind MAY declare one of the categories `person`, `external`, `frontend`,
`backend`, `database`, `cloud`, `messagebus` and `security`, and the name of a
Lucide icon. Components whose kind category is `person` or `external` SHALL
be treated as outside the described system. An icon name outside the bundled
Lucide artwork SHALL be refused.

#### Scenario: An external kind

- **WHEN** a kind declares the category `external`
- **THEN** its components are drawn outside the system boundary

#### Scenario: An unknown icon

- **WHEN** a kind names an icon that the bundled artwork does not contain
- **THEN** validation refuses it with the kind's path

### Requirement: Relations connect two components

Every relation SHALL connect two different declared components. A relation
from a component to itself SHALL be refused with its JSON path.

#### Scenario: A self relation

- **WHEN** a relation declares the same component as `from` and `to`
- **THEN** validation refuses it with its path

### Requirement: LikeC4 import

`archpub import likec4` SHALL convert a LikeC4 workspace into a valid model:
elements become components, relationships become relations, element kinds
become kinds, parent elements become groups and views become flow views. It
SHALL report each construct without a model equivalent with its LikeC4
location and SHALL NOT drop one silently.

#### Scenario: An imported workspace builds

- **WHEN** a LikeC4 workspace with nested elements, relationships and one view
  is imported and then built
- **THEN** the model validates and planning admits that view
- **AND** the build delivers the view's plate and panel, on a sparse page when
  it is too small to fill a balanced one

#### Scenario: A view that shows a parent

- **WHEN** a LikeC4 view includes a parent element
- **THEN** the imported view shows the components inside that parent

### Requirement: Words an import supplies

The words the LikeC4 import supplies itself, an unnamed relation's label and a
missing question, SHALL be in the language `--locale` names, which the model
then declares, and the import SHALL NOT supply an attribution.

#### Scenario: An import in Chinese

- **WHEN** a workspace with an unnamed relation is imported with
  `--locale zh-CN` and no question
- **THEN** the relation is labelled 使用 and the question asks how the title is
  structured in Chinese
- **AND** the model declares `locale: zh-CN` and no attribution

#### Scenario: An unsupported construct

- **WHEN** the workspace contains a construct the model cannot represent
- **THEN** the import result lists it with its file and line
- **AND** the written model contains no substitute for it

### Requirement: Coverage scope

A model SHALL be able to declare `coverage` with `include`, the repository
paths it describes, and `exclude`, the paths it leaves out, each with a
non-blank reason. A path holding `*`, `?` or `[` SHALL be a glob, any other
path ending in a slash SHALL name a directory and any other path a file.
Without `include`, the scope SHALL be the whole repository. An invalid or
repeated path and an exclusion without a reason SHALL be refused with their
JSON paths.

#### Scenario: A declared scope

- **WHEN** a model includes `src/` and excludes `src/vendor/` with a reason
- **THEN** the model validates and keeps both paths and the reason

#### Scenario: An exclusion without a reason

- **WHEN** an exclusion declares a path but no reason
- **THEN** validation refuses it at `/coverage/exclude/0/reason`

#### Scenario: A glob exclusion

- **WHEN** a model includes `internal/` and excludes `**/*_test.go` with a
  reason
- **THEN** the model validates and keeps the glob and the reason

### Requirement: Overview composition reference

A model SHALL be able to name `overview`, the path of its overview composition
relative to the model file. The path SHALL be relative, stay within the model's
directory and end in `.typ`; any other value SHALL be refused at `/overview`.

#### Scenario: A composition beside the model

- **WHEN** a model names `overview.typ`
- **THEN** the model validates and keeps the path

#### Scenario: A path that leaves the model's directory

- **WHEN** a model names `../overview.typ`
- **THEN** validation refuses it at `/overview`

### Requirement: Coverage glob syntax

In a coverage glob, `*` SHALL match within one path segment, `**` any number
of segments, and `?` and `[…]` one character, and a glob ending in a slash
SHALL name the directories it matches. A glob SHALL stay within the
repository, as every coverage path does.

#### Scenario: Character globs

- **WHEN** a model excludes `src/gen-?/[ab]*` with a reason
- **THEN** the model validates and keeps the glob

#### Scenario: A glob that leaves the repository

- **WHEN** a model includes `../*.go` or `a/**/../b/*`
- **THEN** validation refuses each at its JSON path

### Requirement: Guide composition reference

A model SHALL be able to name `guide`, the path of its guide composition, an
Archify explainer draft, relative to the model file. The path SHALL be
relative, stay within the model's directory and end in `.archify.md`; any other
value SHALL be refused at `/guide`.

#### Scenario: A guide in its own directory

- **WHEN** a model names `guide/guide.archify.md`
- **THEN** the model validates and keeps the path

#### Scenario: A path that is not a draft

- **WHEN** a model names `guide.md`
- **THEN** validation refuses it at `/guide`

### Requirement: Components own files by path

A component SHALL be able to claim, in `files`, the repository paths it owns: a
path ending in a slash names a directory and any other path one file. A
claimed path SHALL be relative, stay within the repository, hold no glob and
be claimed once in the whole model. A file SHALL belong to the component whose
claim is most specific: a claim of the file itself, otherwise the deepest
claimed directory that holds it. A component MAY claim nothing.

#### Scenario: Claims of a directory and a file

- **WHEN** a component claims `src/model/` and `README.md`
- **THEN** the model validates and keeps both claims in their order

#### Scenario: A path claimed twice

- **WHEN** two components both claim `src/model/`
- **THEN** validation refuses the second claim at its JSON path

#### Scenario: A glob in a claim

- **WHEN** a component claims `src/*.mjs`
- **THEN** validation refuses it at its JSON path

### Requirement: Relations cite files

A relation SHALL be able to cite, in `files`, the repository files that
evidence it, such as the modules that import the other component. Each SHALL be
a relative path to one file within the repository, without a glob, listed once
per relation.

#### Scenario: A directory in a relation's files

- **WHEN** a relation cites `src/model/`
- **THEN** validation refuses it at its JSON path

### Requirement: Version 1 models migrate

`archpub migrate <model> --out <file>` SHALL write a version 1 model as a
valid version 2 model to a file that does not exist yet. Each component SHALL
claim the files its sources name, in their order, and each relation SHALL cite
the files its sources name; the source catalog SHALL be dropped and every other
field kept. A file that several components cite SHALL be claimed by the first
of them and listed in the result with the components that no longer cite it.

#### Scenario: A migrated model cites what it cited

- **WHEN** a version 1 model is migrated and both are built against the same
  checkout
- **THEN** each component owns the files its sources named
- **AND** the generated page cites the same file for each component

#### Scenario: A file two components cite

- **WHEN** two components of a version 1 model cite the same source
- **THEN** the migrated model gives that file to the first component
- **AND** the result names the file and the second component

#### Scenario: An output that exists

- **WHEN** the file `--out` names already exists
- **THEN** the command refuses and leaves that file unchanged

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

### Requirement: Help for an author's editor

A model MAY carry `$schema`, a reference to the schema for its editor, which the
publisher does not read. An unknown field's message SHALL name the nearest field
that object has when one differs from it by at most a third of its letters.

#### Scenario: A misspelt field

- **WHEN** a model has a top-level field `viewz`
- **THEN** the build refuses with `model_field_unknown` at `/viewz`
- **AND** the message names `views`

#### Scenario: A schema reference

- **WHEN** a model's top level carries `$schema`
- **THEN** the model validates as it would without it
