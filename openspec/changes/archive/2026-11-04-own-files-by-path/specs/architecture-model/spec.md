## MODIFIED Requirements

### Requirement: One explicit model input

The publisher SHALL accept one Architecture Model file as its only input. The
model SHALL declare components and relations and MAY declare its language, a
repository, the files each component owns and each relation cites, kinds,
groups, views, scope, limits and attribution. The publisher SHALL NOT infer
components or relations from repository contents.

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

## ADDED Requirements

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
