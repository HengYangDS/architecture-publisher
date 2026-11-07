## MODIFIED Requirements

### Requirement: Staged build output

`archpub build` SHALL write a delivery into a directory that does not yet
exist: the print edition `<model id>.pdf`, the interactive page
`<model id>.html`, the edition's images in `images/` and `manifest.json`.
Nothing else SHALL be written at the top of the delivery. It SHALL stage the
delivery and move it into place only after every artifact succeeds, so a refused
or failed build leaves no output.

#### Scenario: Semantic names

- **WHEN** a model `route` with a composition whose first view is `route` is built with
  `--png 2400,6000`
- **THEN** the delivery holds `route.pdf` beside `images/00-overview.png`, `images/01-route.png` and `images/01-route-6000.png`, and no SVG

#### Scenario: An existing output directory

- **WHEN** the output directory already exists
- **THEN** the build refuses without changing it

#### Scenario: A failure during rendering

- **WHEN** the page fails after the edition was written to the staging area
- **THEN** the build refuses and neither the output directory nor the staging
  area remains

#### Scenario: A refused overview

- **WHEN** the overview is refused after the plates were composed
- **THEN** the build refuses and neither the output directory nor the staging
  area remains

### Requirement: Manifest records

The manifest SHALL record its format and version 6; the publisher's name and
version; the model's id, title, language, SHA-256 and size; the declared
repository; the build's quality and media; every cited file with its state,
digest, owner and the relations that cite it; the digests of the font, house,
measuring and icon supplies and, when it delivers the page, Archify's; the
plan, each view naming the number of its plate; each plate's record; and every
artifact's path, size and digest.

#### Scenario: Identity fields

- **WHEN** a model is built
- **THEN** its manifest names the delivery format and version 6, the
  publisher's name and version and the model's id, title, language, digest and
  size

#### Scenario: A cited file's record

- **WHEN** a component owns `src/model/load.mjs` and one relation cites it
- **THEN** the manifest records that path once, with its digest, the
  component as its owner and the relation's id

## REMOVED Requirements

### Requirement: Build options

**Reason**: The posters and the overview become one medium, the print edition.

**Migration**: Use `--media edition`; see Media.

### Requirement: Media by default

**Reason**: The posters and the overview become one medium, the print edition.

**Migration**: See Media.

## ADDED Requirements

### Requirement: Edition image names

At each `--png` width, `images/` SHALL hold one image of the overview's page
and one of each plate's page, named `00-overview.png` and `NN-<view>.png` at
2400 px and `00-overview-<width>.png` and `NN-<view>-<width>.png` at any other,
where `NN` is the plate's two-digit number from 01 in reading order.

#### Scenario: Images at two widths

- **WHEN** a model `route` with a composition and one view `route` is built
  with `--png 2400,6000`
- **THEN** `images/` holds `00-overview.png`, `00-overview-6000.png`,
  `01-route.png` and `01-route-6000.png`

### Requirement: Media

`archpub build` and `archpub check` SHALL accept `--media` with any of `edition`
and `page`, by default both; `--png` with comma-separated widths from 1 to
6000 px, by default 2400, for the edition's images; and `--quality` with
`showcase`, the default, or `standard`, for the page. A build SHALL compose only
the media it delivers, and SHALL refuse an option outside these values with
`build_media_invalid`, `build_png_invalid` or `build_quality_invalid` before
reading the model.

#### Scenario: The edition alone

- **WHEN** a model is built with `--media edition`
- **THEN** the delivery holds the print edition and its images and no `<model id>.html`
- **AND** its manifest records no page and no Archify supply

#### Scenario: An unknown medium

- **WHEN** a build names `--media posters`
- **THEN** it refuses with `build_media_invalid` and writes nothing

### Requirement: Print edition

The print edition SHALL be typeset by the bundled Typst with the house class: a
title page of the work's name, question and summary over a byline of its
release, editors, licence and publisher; contents whose entries link to their
pages, beside the edition's facts, scope, limits and a reading note; the
overview, when the model names a composition; and one plate per view. The facts
SHALL name the subject, repository, revision, files read, model digest,
editors, licence, typesetter and standards.

#### Scenario: The contents link to the plates

- **WHEN** a model with a composition and six views is built
- **THEN** its PDF holds nine pages
- **AND** each of the seven contents entries links to its page

### Requirement: Edition page frame

Every page after the title page SHALL share one frame on the 1600 by 900 point
page: a head of a label at the margin, a title at 124 points and a lead line; a
body from 112 to 826 points; and a foot of a rule at 866 points, the work's
title, release, revision and date linked to the contents, and the folio. A
title wider than its line SHALL be refused with `edition_title_too_long`.

#### Scenario: A foot that returns to the contents

- **WHEN** a reader follows the foot of any plate
- **THEN** it opens the contents page

### Requirement: Plate head and key

A plate's head SHALL be its number, its view's title and its question. Its key
SHALL be one line at 848 points of the kinds, boundary and statuses its figure
shows, and no others.

#### Scenario: A plate's key

- **WHEN** a plate's figure shows commands and checks inside the boundary
- **THEN** its key lists command, check and the boundary on one line above the
  foot, and no kind it does not show

### Requirement: Plate reading

Where a plate's figure leaves part of the body, the plate SHALL set its view's
reading in the rest, 40 points from the figure: the view's summary, and then
under the publisher's heading for where each part lives, each shown component's
label with its claimed paths as the model declares them, in reading order. The
heading SHALL be in the model's language.

#### Scenario: A summary beside a narrow figure

- **WHEN** a view with a summary is set on a plate whose figure takes 65
  percent of the body
- **THEN** the summary can be extracted as text from that plate's page
- **AND** each shown component that claims files is listed with its paths

### Requirement: Reading measure

A plate's summary SHALL be justified when its column holds at least 24 em of its
size and set flush left otherwise. A reading taller than the body SHALL be
refused with `edition_reading_too_long` and the view's title, since text is
never shrunk.

#### Scenario: A reading too long for its column

- **WHEN** a view's summary and paths need more than the body's height
- **THEN** the build refuses with `edition_reading_too_long` naming the view

### Requirement: Plate fit in check

`archpub check` SHALL report, for each plate, its figure's share of the body,
the balance gates it misses and whether it left its view's reading out.

#### Scenario: A plate that left its reading out

- **WHEN** a view with a summary cannot give up width without more crossings
- **THEN** `archpub check` names that plate as leaving its reading out

### Requirement: Contents rows

Contents rows SHALL share the body equally; rows that would fall below 44
points SHALL continue on a second contents page.

#### Scenario: An edition of eleven views

- **WHEN** a model with a composition and eleven views is built
- **THEN** its twelve contents rows fill one page at 59.5 points each

### Requirement: Columns fill their pages

On the title and contents pages, each column's blocks SHALL be spaced equally
over the band the column occupies, so that no column leaves its paper in one
block.

#### Scenario: The contents' left column

- **WHEN** the contents page is set
- **THEN** its left column starts at the top of the body and its last block
  ends at the body's foot

### Requirement: Edition typography

Prose, the summary, scope, limits and reading note, SHALL be justified
on optimized lines, hyphenated in the model's language, with word spaces from 80
to 125 percent and tracking from −0.012 to +0.025 em, at most 32 em to a line.
Titles, questions, labels and figure text SHALL NOT be justified.

#### Scenario: Notes at a reading measure

- **WHEN** the scope is set on the contents
- **THEN** no line of it is wider than 32 em of its size

### Requirement: Links to cited files

When the model declares `repository.browse`, each card title on a plate SHALL
link to the first file the manifest records for its component, the template's
`{revision}` and `{path}` filled with the pinned revision and that path. Without
it, no card title SHALL link.

#### Scenario: A browsable repository

- **WHEN** a model declares
  `browse: "https://github.com/o/r/blob/{revision}/{path}"` and a component owns
  `src/a.mjs`
- **THEN** that component's card title links to
  `https://github.com/o/r/blob/<revision>/src/a.mjs`

### Requirement: Print edition conformance and metadata

The print edition SHALL conform to PDF/A-3a and PDF/UA-1, attach the model with
the relationship `source`, and take its title, authors, subject, keywords and
language from the model. Each plate SHALL be one figure with alt text of its
title and question, its shapes and key marks artifacts.

#### Scenario: Metadata and the attached model

- **WHEN** a model with `editors: [{ "name": "Yang HENG" }]` is built
- **THEN** the PDF's author is `Yang HENG`
- **AND** its attachment `model.json` equals the model's bytes

### Requirement: Edition date

The print edition SHALL be dated by the revision's commit when the build names
the checkout, otherwise by `SOURCE_DATE_EPOCH` when it is set, and otherwise by
the time it is typeset, and the manifest SHALL record which. Two builds of equal
inputs and date SHALL be byte-identical.

#### Scenario: Two builds

- **WHEN** a model is built twice at one revision with one `SOURCE_DATE_EPOCH`
  and no checkout
- **THEN** both PDFs and every image are byte-identical
- **AND** the manifest records the edition as dated by `SOURCE_DATE_EPOCH`
