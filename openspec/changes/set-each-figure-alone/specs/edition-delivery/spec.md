## ADDED Requirements

### Requirement: Figures alone

A build that delivers the edition's images SHALL also write, for each plate, the plate's figure and its key alone
into `figures/`, as `NN-<view>.png` and `NN-<view>.svg`: cut to what the figure draws on with a margin about it, on
no ground, at the scale of the widest image asked for. The key of a figure alone SHALL state the commit's date,
since no foot stands under it.

#### Scenario: A figure on another ground

- **WHEN** a work is built and a plate's figure in `figures/` is laid over a ground of another colour
- **THEN** that ground shows at the figure's corners, between its cards and under each relation's label

### Requirement: A figure's two forms

A figure's PNG SHALL have an alpha channel. Its SVG SHALL be one document of shapes whose text is outlined, with no
embedded image and no reference outside itself.

#### Scenario: One document of shapes

- **WHEN** a plate's SVG in `figures/` is read
- **THEN** it holds no `image` and no `text` element and no data URI

### Requirement: Figures in the delivery's record

The manifest and the data SHALL record a plate's two figure files in its `figures`, beside its images, and the
reader file SHALL name them on the view's line. A delivery whose figure file is changed, missing or unlisted SHALL
be refused as one whose image is.

#### Scenario: A figure file that the manifest does not hold

- **WHEN** a delivery's `figures/01-route.svg` is changed after the build and the delivery is verified
- **THEN** the delivery is refused, and the refusal names that file

## MODIFIED Requirements

### Requirement: Staged build output

`archpub build` SHALL write a delivery into a directory that does not yet exist: the print edition
`<model id>.pdf`, the interactive page `<model id>.html`, the edition's images in `images/`, its figures alone in
`figures/`, `model.json`, the data `<model id>.json`, the reader file `<model id>.md` and `manifest.json`. Nothing
else SHALL be written at the top of the delivery. It SHALL stage the delivery and move it into place only after
every artifact succeeds, so a refused or failed build leaves no output.

#### Scenario: Semantic names

- **WHEN** a model `route` with a composition whose first view is `route` is built with `--png 3840,6000`
- **THEN** the delivery holds `route.pdf`, `route.html`, `route.json`, `route.md`, `model.json` and `manifest.json`
  beside `images/00-overview.png`, `images/01-route.png`, `images/01-route-6000.png`, `figures/01-route.png` and
  `figures/01-route.svg`

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

### Requirement: Edition image names

At each `--png` width, `images/` SHALL hold one image of the overview's page
and one of each plate's page, named `00-overview.png` and `NN-<view>.png` at
3840 px and `00-overview-<width>.png` and `NN-<view>-<width>.png` at any other,
where `NN` is the plate's two-digit number from 01 in reading order.

#### Scenario: Images at two widths

- **WHEN** a model `route` with a composition and one view `route` is built
  with `--png 3840,6000`
- **THEN** `images/` holds `00-overview.png`, `00-overview-6000.png`,
  `01-route.png` and `01-route-6000.png`

### Requirement: Media

`archpub build` and `archpub check` SHALL accept `--media` with any of `edition`
and `page`, by default both; `--png` with comma-separated widths from 1 to
6000 px, by default 3840, for the edition's images; and `--quality` with
`showcase`, the default, or `standard`, for the page. A build SHALL compose only
the media it delivers, and SHALL refuse an option outside these values with
`build_media_invalid`, `build_png_invalid` or `build_quality_invalid` before
reading the model.

#### Scenario: The edition alone

- **WHEN** a model is built with `--media edition`
- **THEN** the delivery holds the print edition, its images and its figures alone and no `<model id>.html`
- **AND** its manifest records no page and no Archify supply

#### Scenario: An unknown medium

- **WHEN** a build names `--media posters`
- **THEN** it refuses with `build_media_invalid` and writes nothing

### Requirement: Plate head and key

A plate's head SHALL be its number, its view's title and its question. Its key SHALL list what its figure shows and
cannot say where it stands, and no more, on one line where the body holds it, its baseline at 850 points on every
plate and each mark centred on its label's mid-line: what the age bands count from and the bands, the scale bar,
the citation count, the hub, the boundary, the statuses and the ground of a part outside the repository. It SHALL
list no kind. A plate's page SHALL state the commit's date once, in its foot: the key of a page states none.

#### Scenario: A plate's key

- **WHEN** a plate's figure shows commands and checks inside the boundary
- **THEN** its key lists the boundary on one line above the foot and neither kind, and each card names its kind
  beside the kind's icon

#### Scenario: A strip plate's key

- **WHEN** a plate shows files in all three bands and relations that cite files and no hub
- **THEN** its key says that the bands count back from the commit and names the three bands, the scale bar and the
  citation count, and no hub

#### Scenario: One date a page

- **WHEN** a plate's page is typeset from a pin with a commit date
- **THEN** the date stands in the page's foot and nowhere in its key

#### Scenario: A part outside the repository

- **WHEN** a plate shows a part outside the repository
- **THEN** its key holds the ground of such a part with the edition's word for outside

#### Scenario: Marks of different heights

- **WHEN** a plate's key holds a band, a sample strip, a citation count, a hub's line and a boundary's outline
- **THEN** each is centred on the same line as the labels' text
