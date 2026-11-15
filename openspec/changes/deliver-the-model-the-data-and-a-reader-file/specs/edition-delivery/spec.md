## MODIFIED Requirements

### Requirement: Staged build output

`archpub build` SHALL write a delivery into a directory that does not yet exist: the print edition
`<model id>.pdf`, the interactive page `<model id>.html`, the edition's images in `images/`, `model.json`, the
data `<model id>.json`, the reader file `<model id>.md` and `manifest.json`. Nothing else SHALL be written at the
top of the delivery. It SHALL stage the delivery and move it into place only after every artifact succeeds, so a
refused or failed build leaves no output.

#### Scenario: Semantic names

- **WHEN** a model `route` with a composition whose first view is `route` is built with `--png 2400,6000`
- **THEN** the delivery holds `route.pdf`, `route.html`, `route.json`, `route.md`, `model.json` and `manifest.json`
  beside `images/00-overview.png`, `images/01-route.png` and `images/01-route-6000.png`, and no SVG

#### Scenario: An existing output directory

- **WHEN** the output directory already exists
- **THEN** the build refuses without changing it

#### Scenario: A failure during rendering

- **WHEN** the page fails after the edition was written to the staging area
- **THEN** the build refuses and neither the output directory nor the staging area remains

#### Scenario: A refused overview

- **WHEN** the overview is refused after the plates were composed
- **THEN** the build refuses and neither the output directory nor the staging area remains

#### Scenario: A refused projection

- **WHEN** a plate's data face differs from its view's statement set
- **THEN** the build refuses and neither the output directory nor the staging area remains

### Requirement: Manifest records

The manifest SHALL record its format and version 8; the publisher's name and version; the model's id, title,
language, SHA-256 and size; the declared repository; the build's quality and media; the binding's state and the
number of files it recorded; the digests of the font, house, measuring and icon supplies and, when it delivers the
page, Archify's; the plan, each view naming the number of its plate; each plate's record; and every artifact's
path, size and digest.

#### Scenario: Identity fields

- **WHEN** a model is built
- **THEN** its manifest names the delivery format and version 8, the publisher's name and version and the model's
  id, title, language, digest and size

#### Scenario: A cited file's record

- **WHEN** a component owns `src/model/load.mjs` and one relation cites it
- **THEN** the manifest counts that path among the binding's files and holds no record of it
- **AND** the data's evidence table records it once, with its digest, size, last change date, the component as its
  owner and the relation's id

#### Scenario: An earlier delivery

- **WHEN** `archpub verify`, `archpub compare` or `archpub publish` is given a delivery whose manifest states
  version 7
- **THEN** the command treats it as before this version, and refuses nothing for its version

## ADDED Requirements

### Requirement: The manifest names the model, the data and the reader file

The manifest SHALL name the model's file `model.json`, the data's file with the counts of what it holds, and the
reader file with its size in bytes and the number of statements it lists, and SHALL list each of the three among
its artifacts with its size and digest.

#### Scenario: The three files

- **WHEN** a model `route` is built
- **THEN** the manifest names `model.json`, `route.json` and `route.md`, and lists each among its artifacts with
  its size and digest
- **AND** the size it records for the reader file is the size of `route.md`

### Requirement: Measures in the manifest

The manifest SHALL record each poster's composition and gate measurements, each view diagram's Archify metrics and
the files the page withholds. The record of each cited file and the details, statuses and files of every component
and relation SHALL stand in the data and SHALL NOT be repeated in the manifest.

#### Scenario: Evidence kept off the drawing

- **WHEN** a component has details and claims files
- **THEN** the data's statements list them under the component's id, and the manifest holds no `evidence`

#### Scenario: A plate's measures

- **WHEN** a model with one view is built
- **THEN** the manifest records that plate's composition and measures as before

### Requirement: The new files are compared

`archpub compare` SHALL compare `model.json`, `<model id>.json` and `<model id>.md` as files of the whole edition,
and SHALL list each that differs or that one delivery alone holds.

#### Scenario: Two builds of one state

- **WHEN** one model is built twice with the same version, checkout and date source on one platform
- **THEN** the comparison reports the two deliveries identical

#### Scenario: A delivery of the release before

- **WHEN** a delivery of manifest version 7 is compared with one of version 8 built from the same model
- **THEN** the comparison lists `manifest.json` and the three files the earlier delivery lacks, and no plate

#### Scenario: One statement changed

- **WHEN** two deliveries of version 8 are built from models that differ in one detail of one relation
- **THEN** the comparison lists `model.json`, the data, the reader file and `manifest.json` among the files that
  differ

### Requirement: Check reports the data

The result of `archpub check --json` SHALL carry `data`, the counts a build's manifest records: of components,
relations and groups; of the statements cited, unchecked and uncited; of facts; of paths and cited ranges of
evidence; for each plate, of the components, groups and relations of its face; and for a guide, of its matched
nodes and connections, with the list of unmatched ones. The text report SHALL print them as one group. A check
SHALL write no file for them.

#### Scenario: A model with a checkout and a guide

- **WHEN** such a model is checked with `--json`
- **THEN** the result's `data` holds the counts and the list of the guide's unmatched nodes and connections
- **AND** no file is written

#### Scenario: A model without a checkout

- **WHEN** a model is checked without `--repo`
- **THEN** `data` holds the counts of statements and of facts, no cited statement, and for a guide no matched
  figure

### Requirement: A model id that takes a delivery's file name

`archpub build` and `archpub check` SHALL refuse with `delivery_name_taken` a model whose id is `model`,
`manifest`, `acceptance` or `colophon`, since `<model id>.json` or `<model id>.pdf` would then be another file of
the delivery, and SHALL name the file and the two things it would be. The model's own validation SHALL NOT change.

#### Scenario: A model named manifest

- **WHEN** a model whose id is `manifest` is built
- **THEN** the build refuses with `delivery_name_taken` and writes nothing

#### Scenario: A model named colophon

- **WHEN** a model whose id is `colophon` is checked
- **THEN** the check refuses with `delivery_name_taken`, since `colophon.pdf` is the page an acceptance writes

#### Scenario: A model named models

- **WHEN** a model whose id is `models` is built
- **THEN** the delivery holds `models.json` beside `model.json`

### Requirement: A guide is read for every medium

A build or a check of a model that names a guide SHALL read the guide's draft and the files it names whichever media
it delivers, since the reader file carries the draft and the data its citations, and SHALL refuse a guide that is
absent with `guide_missing`. With a checkout it SHALL refuse with `guide_file_missing` a citation of the guide whose
path is no file at the pin. Only a build or a check that delivers the page SHALL have Archify validate the guide.

#### Scenario: An absent guide and the edition alone

- **WHEN** a model names a guide that does not exist and is built or checked with `--media edition`
- **THEN** the command refuses with `guide_missing`, and a build writes nothing

#### Scenario: A guide and the edition alone

- **WHEN** a model with a guide is built with `--media edition`
- **THEN** the reader file ends with the guide's draft, and Archify does not run

#### Scenario: A guide's citation of a file absent at the pin

- **WHEN** a `@source` of a guide's draft, or a node of one of its diagrams, cites a path that is no file at the
  model's revision
- **THEN** a build or a check with `--repo` refuses with `guide_file_missing` for `--media edition`, `--media page`
  and both, names the guide, the place of the citation and the path, and a build writes nothing
- **AND** without `--repo` the model builds, and the path's row of evidence is `unverified`

## REMOVED Requirements

### Requirement: Measures and evidence in the manifest

**Reason**: The details, statuses and files of every component and relation are written once, in the data; the
manifest keeps the measures, under the requirement "Measures in the manifest".

**Migration**: Read `statements` of `<model id>.json` where `evidence` of `manifest.json` was read, and `evidence`
of `<model id>.json` where `sources.records` was read.
