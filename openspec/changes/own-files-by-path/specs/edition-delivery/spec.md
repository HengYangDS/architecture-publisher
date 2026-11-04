## MODIFIED Requirements

### Requirement: Manifest records

The manifest SHALL record its format and version 5; the publisher's name and
version; the model's id, title, language, SHA-256 and size; the declared
repository; the build's quality and media; every cited file with its state,
digest, owner and the relations that cite it; the digests of the bundled font,
icon and raster supplies and, when it delivers the page, Archify's; the plan,
each view naming the number of its poster page; and every artifact's path,
size and digest.

#### Scenario: Identity fields

- **WHEN** a model is built
- **THEN** its manifest names the delivery format and version, the publisher's
  name and version and the model's id, title, language, digest and size

#### Scenario: A cited file's record

- **WHEN** a component owns `src/model/load.mjs` and one relation cites it
- **THEN** the manifest records that path once, with its digest, the
  component as its owner and the relation's id

### Requirement: Measures and evidence in the manifest

The manifest SHALL record each poster's composition and gate measurements,
each view diagram's Archify metrics, the files the page withholds and the
details, statuses and files of every component and relation.

#### Scenario: Evidence kept off the drawing

- **WHEN** a component has details and claims files
- **THEN** the manifest's evidence lists them under the component's id
