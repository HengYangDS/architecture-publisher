## MODIFIED Requirements

### Requirement: Staged build output

`archpub build` SHALL write a delivery into a directory that does not yet
exist: for each poster page, one PNG per width, named `NN-<views>.png` at the
page's own 2400 px and `NN-<views>-<width>.png` at any other, where `NN` is the
page's two-digit number and `<views>` its view ids joined by `+`; the
overview's files; the print edition; `index.html`; and `manifest.json`. Pages
are numbered from 01 in reading order. It SHALL stage the delivery and move it
into place only after every artifact succeeds, so a refused or failed build
leaves no output.

#### Scenario: Semantic names

- **WHEN** a model whose first poster page shows the view `route` is built with
  `--png 2400,6000`
- **THEN** the delivery holds `01-route.png` and `01-route-6000.png` and no SVG

#### Scenario: An existing output directory

- **WHEN** the output directory already exists
- **THEN** the build refuses without changing it

#### Scenario: A failure during rendering

- **WHEN** the page fails after the posters were written to the staging area
- **THEN** the build refuses and neither the output directory nor the staging
  area remains

#### Scenario: A refused overview

- **WHEN** the overview is refused after the posters were written to the
  staging area
- **THEN** the build refuses and neither the output directory nor the staging
  area remains

### Requirement: Manifest records

The manifest SHALL record its format and version 6; the publisher's name and
version; the model's id, title, language, SHA-256 and size; the declared
repository; the build's quality and media; every cited file with its state,
digest, owner and the relations that cite it; the digests of the bundled font,
house, icon and raster supplies and, when it delivers the page, Archify's; the
plan, each view naming the number of its poster page; each edition plate's
composition and measures; and every artifact's path, size and digest.

#### Scenario: Identity fields

- **WHEN** a model is built
- **THEN** its manifest names the delivery format and version 6, the
  publisher's name and version and the model's id, title, language, digest and
  size

#### Scenario: A cited file's record

- **WHEN** a component owns `src/model/load.mjs` and one relation cites it
- **THEN** the manifest records that path once, with its digest, the
  component as its owner and the relation's id

## ADDED Requirements

### Requirement: Print edition

A build that delivers posters SHALL deliver `<model id>.pdf`, typeset by the
bundled Typst with the house class: a title page; contents whose entries link
to their pages; the overview when the model has a composition; one plate per
poster page with its number, title, question and legend; and a colophon. Every
page after the title page SHALL carry a foot that links to the contents.

#### Scenario: The contents link to the plates

- **WHEN** a model with an overview and six poster pages is built
- **THEN** its PDF holds ten pages
- **AND** each of the eight contents entries links to its page

### Requirement: Print edition conformance and metadata

The print edition SHALL conform to PDF/A-3a and PDF/UA-1, attach the model with
the relationship `source`, take its title, authors, subject, keywords and
language from the model and its date from the revision's commit, and be
byte-identical for equal inputs.

#### Scenario: Metadata and the attached model

- **WHEN** a model with `editors: [{ "name": "Yang HENG" }]` is built
- **THEN** the PDF's author is `Yang HENG`
- **AND** its attachment `model.json` equals the model's bytes

#### Scenario: Two builds

- **WHEN** a model is built twice at one revision
- **THEN** both PDFs are byte-identical
