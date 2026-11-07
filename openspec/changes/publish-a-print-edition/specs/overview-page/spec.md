## MODIFIED Requirements

### Requirement: Overview files

The overview SHALL be set in place in the print edition and delivered as one PNG of its page per `--png` width in `images/`, `00-overview.png` at 2400 px and
`00-overview-<width>.png` at any other. Equal compositions, models, classes,
fonts and Typst versions SHALL give equal bytes.

#### Scenario: Two builds

- **WHEN** a model with a composition is built twice with `--png 2400,6000`
- **THEN** both deliveries hold byte-identical `images/00-overview.png` and `images/00-overview-6000.png`

### Requirement: House class

The house class SHALL set one 16:9 page of 1600 by 900 points, the house
palette, Source Serif 4 for titles and heads and Source Sans 3 for text, with
Noto Sans CJK SC for Han characters, and four type sizes, read from the house
supply's one token file. It SHALL provide a masthead, and a foot that prints the
model's title, its revision and, when the build names the checkout, the
revision's commit date, and primitives for heads, text, definition lists, rules,
lines, stations and arrowheads.

#### Scenario: The imprint with a checkout

- **WHEN** a model pinned at a revision is built with `--repo`
- **THEN** the foot names the model's title, the revision's first seven
  characters and its commit date

#### Scenario: The imprint without a checkout

- **WHEN** the same model is built without `--repo`
- **THEN** the foot names the title and the revision and no date

## REMOVED Requirements

### Requirement: Pinned Typst

**Reason**: Typst now sets the whole print edition, not only the overview.

**Migration**: See Pinned Typst for print.

## ADDED Requirements

### Requirement: Pinned Typst for print

The publisher SHALL typeset the print edition with Typst 0.15.1 found on the
path and SHALL refuse it when Typst is missing, `edition_typst_missing`, or
reports another version, `edition_typst_version`, naming the version it needs.
The page SHALL NOT need Typst.

#### Scenario: Typst missing

- **WHEN** a model is built with the edition and no Typst is on the path
- **THEN** the build refuses with `edition_typst_missing` before writing
  anything

#### Scenario: The page without Typst

- **WHEN** the same model is built with `--media page` and no Typst
- **THEN** the build delivers the page

### Requirement: Overview in the print edition

In the print edition the overview SHALL be compiled from its composition in
place, so its text is text, and its imprint SHALL be the edition's foot.

#### Scenario: Searchable overview text

- **WHEN** the print edition of a model with a composition is built
- **THEN** the overview's masthead claim can be extracted as text from its page
