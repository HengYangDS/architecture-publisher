## MODIFIED Requirements

### Requirement: Manifest records

The manifest SHALL record its format and version 9; the publisher's name and version; the model's id, title,
language, SHA-256 and size; the declared repository; the build's quality and media; the binding's state and the
number of files it recorded; the digests of the font, house, measuring and icon supplies and, when it delivers the
page, Archify's; the plan, each view naming the number of its plate; each plate's record; and every artifact's
path, size and digest.

#### Scenario: Identity fields

- **WHEN** a model is built
- **THEN** its manifest names the delivery format and version 9, the publisher's name and version and the model's
  id, title, language, digest and size

#### Scenario: A cited file's record

- **WHEN** a component owns `src/model/load.mjs` and one relation cites it
- **THEN** the manifest counts that path among the binding's files and holds no record of it
- **AND** the data's evidence table records it once, with its digest, size, last change date, the component as its
  owner and the relation's id

#### Scenario: An earlier delivery

- **WHEN** `archpub verify`, `archpub accept`, `archpub compare` or `archpub publish` is given a delivery whose
  manifest states version 7 or 8
- **THEN** the command treats it as before this version, and refuses nothing for its version

### Requirement: The new files are compared

`archpub compare` SHALL compare `model.json`, `<model id>.json` and `<model id>.md` as files of the whole edition,
and SHALL list each that differs or that one delivery alone holds.

#### Scenario: Two builds of one state

- **WHEN** one model is built twice with the same version, checkout and date source on one platform
- **THEN** the comparison reports the two deliveries identical

#### Scenario: A delivery of the release before

- **WHEN** a delivery of manifest version 8 is compared with one of version 9 built from the same model
- **THEN** the comparison lists `manifest.json` and the reader file among the files that differ, and no plate

#### Scenario: One statement changed

- **WHEN** two deliveries of version 9 are built from models that differ in one detail of one relation
- **THEN** the comparison lists `model.json`, the data, the reader file and `manifest.json` among the files that
  differ
