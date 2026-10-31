## Purpose

Accept one explicit, portable Architecture Model of any repository, authored by
an agent or a person or imported from LikeC4, and preserve its identities and
meaning in every output.

## ADDED Requirements

### Requirement: One explicit model input

The publisher SHALL accept one Architecture Model file as its only input. The
model SHALL declare components and relations and MAY declare its language, a
repository, sources, kinds, groups, views, scope, limits and attribution. The
publisher SHALL NOT infer components or relations from repository contents.

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
components, groups or sources, and relations whose endpoints are absent, and
it SHALL report every problem with its JSON path in one result.

#### Scenario: Several problems are reported together

- **WHEN** a model has a duplicate component id and a relation to an
  undeclared component
- **THEN** the build refuses with both problems and their JSON paths
- **AND** no output directory is created

#### Scenario: An unsupported format version

- **WHEN** a model declares a format version the installed publisher does not
  support
- **THEN** the build refuses and names the supported version

### Requirement: Identity and meaning are preserved

The manifest SHALL carry, unchanged, every component's and relation's id,
label, details, status and sources, each component's kind and each relation's
endpoints, every view's id, members and relations, and every source's id and
path, and SHALL bind the rest of the model by its digest. Presentation SHALL
NOT rename, merge, reorder the details of or invent model elements; relations
that share one label on a bus SHALL each keep their own end at their target.

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
