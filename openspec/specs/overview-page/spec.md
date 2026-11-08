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

The overview SHALL be set in place in the print edition and delivered as one PNG of its page per `--png` width in `images/`, `00-overview.png` at 2400 px and
`00-overview-<width>.png` at any other. Equal compositions, models, classes,
fonts and Typst versions SHALL give equal bytes.

#### Scenario: Two builds

- **WHEN** a model with a composition is built twice with `--png 2400,6000`
- **THEN** both deliveries hold byte-identical `images/00-overview.png` and `images/00-overview-6000.png`

### Requirement: Missing composition

When a model names an overview composition and no file is at that path, the
publisher SHALL refuse with `overview_composition_missing`, naming the model's
value and the path it looked at, before it stages anything or runs Typst.

#### Scenario: A composition that is not there

- **WHEN** a model names `overview.typ` and no such file is beside it
- **THEN** `archpub check` and the build refuse with
  `overview_composition_missing`, naming `overview.typ` and the path looked at
- **AND** the build writes nothing

#### Scenario: A composition in a directory that is not there

- **WHEN** a model names `art/overview.typ` and no `art/` is beside it
- **THEN** `archpub check` and the build refuse with
  `overview_composition_missing` instead of failing on the directory

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
place, so its text is text, its imprint SHALL be the edition's foot, and its
masthead SHALL set the edition's build line in the model's language.

#### Scenario: Searchable overview text

- **WHEN** the print edition of a model with a composition is built
- **THEN** the overview's masthead claim can be extracted as text from its page

#### Scenario: A Chinese model's masthead

- **WHEN** the print edition of a zh-CN model with a composition is built
- **THEN** the overview's masthead sets 构建于 and the revision
- **AND** it sets no English build line
