# overview-page Specification

## Purpose

Typeset each work's overview page, a composition its author writes with the
publisher's house class, deterministically and with checks on the typeset page.

## Requirements

### Requirement: Overview composition

A model MAY name an overview composition: a Typst file, relative to the model,
that states its work's page with the house class. The publisher SHALL typeset
it with the composition's Typst files, the house class and the model staged in
one root that Typst cannot leave, with system and embedded fonts ignored and
only the house faces and the bundled CJK face available.

#### Scenario: A composition beside its model

- **WHEN** a model names `overview.typ` and that file imports the house class
- **THEN** the build typesets the page from that file, the class and the model
  alone

### Requirement: What a composition leaves to the class

The publisher SHALL refuse a composition that imports a package or loads a
plugin, `overview_import_refused`, or sets a type size, a face, a colour or the
page itself, `overview_style_refused`, naming the line; and one whose directory
holds a link or an `archpub` entry, where the class is staged,
`overview_composition_invalid`.

#### Scenario: A package import

- **WHEN** a composition imports a package
- **THEN** the build refuses with `overview_import_refused` and the
  composition's line

#### Scenario: A size of its own

- **WHEN** a composition sets a text size
- **THEN** the build refuses with `overview_style_refused` and the line

### Requirement: House class

The house class SHALL set one 16:9 page of 1600 by 900 points, the house
palette, Source Serif 4 for titles and heads and Source Sans 3 for text, with
Noto Sans CJK SC for Han characters, and four type sizes. It SHALL provide a
masthead and an imprint that print the model's title, its revision and, when
the build names the checkout, the revision's commit date, and primitives for
heads, text, definition lists, rules, lines, stations and arrowheads.

#### Scenario: The imprint with a checkout

- **WHEN** a model pinned at a revision is built with `--repo`
- **THEN** the imprint names the model's title, the revision's first seven
  characters and its commit date

#### Scenario: The imprint without a checkout

- **WHEN** the same model is built without `--repo`
- **THEN** the imprint names the title and the revision and no date

### Requirement: Model references

A module that names a component SHALL print the model's label for it. A name
the model lacks SHALL be refused with `overview_reference_unknown` and the
composition's line.

#### Scenario: An unknown component

- **WHEN** a composition places a station for a component id the model lacks
- **THEN** the build refuses with `overview_reference_unknown`

### Requirement: Text placement

The publisher SHALL read back the glyph box of every text the class sets and
SHALL refuse a page where text leaves the live area, 48 points from each side
and 16 points from the top and the bottom, `overview_text_outside`, or lies
over other text, `overview_text_overlap`, naming both texts.

#### Scenario: Two notes over each other

- **WHEN** two notes are set at overlapping positions
- **THEN** the build refuses with `overview_text_overlap` naming both notes

### Requirement: Glyphs and Typst diagnostics

The publisher SHALL refuse text with a character no available face draws,
`overview_glyph_missing`, because Typst draws such a character as an empty box
without warning. It SHALL refuse every Typst warning, `overview_typst_warning`,
and error, `overview_typst_error`, at the composition's line.

#### Scenario: A missing glyph

- **WHEN** a note holds a character no available face contains
- **THEN** the build refuses with `overview_glyph_missing` naming the character

### Requirement: Overview files

The overview SHALL be delivered as `overview.svg` and one PNG per `--png`
width, `overview.png` at 2400 px and `overview-<width>.png` at any other. Equal
compositions, models, classes, fonts and Typst versions SHALL give equal bytes.

#### Scenario: Two builds

- **WHEN** a model with a composition is built twice with `--png 2400,6000`
- **THEN** both deliveries hold byte-identical `overview.svg`, `overview.png`
  and `overview-6000.png`

### Requirement: Pinned Typst

The publisher SHALL typeset with Typst 0.15.1 found on the path and SHALL refuse
an overview when Typst is missing, `overview_typst_missing`, or reports another
version, `overview_typst_version`, naming the version it needs. Media other than
the overview SHALL NOT need Typst.

#### Scenario: Typst missing

- **WHEN** a model with a composition is built and no Typst is on the path
- **THEN** the build refuses with `overview_typst_missing` before writing
  anything

#### Scenario: Posters and page without Typst

- **WHEN** the same model is built with `--media posters,page` and no Typst
- **THEN** the build delivers the posters and the page
