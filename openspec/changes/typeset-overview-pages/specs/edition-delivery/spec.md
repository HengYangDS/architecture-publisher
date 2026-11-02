## MODIFIED Requirements

### Requirement: Staged build output

`archpub build` SHALL write a delivery into a directory that does not yet
exist: for each poster page, `page-<n>.svg` and one PNG per width, named
`page-<n>.png` at the page's own 2400 px and `page-<n>-<width>.png` at any
other; the overview's files; `index.html`; and `manifest.json`. Pages are
numbered from 1 in reading order. It SHALL stage the delivery and move it into
place only after every artifact succeeds, so a refused or failed build leaves
no output.

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

### Requirement: Build options

`archpub build` and `archpub check` SHALL accept `--media` with any of
`posters`, `page` and `overview`; `--png` with comma-separated PNG widths from
1 to 6000 px, by default 2400, for the posters and the overview; and
`--quality` with `showcase`, the default, or `standard`. A build SHALL compose
only the media it delivers, and SHALL refuse an option outside these values
with `build_media_invalid`, `build_png_invalid` or `build_quality_invalid`
before reading the model.

#### Scenario: Posters alone at two widths

- **WHEN** a model is built with `--media posters --png 2400,6000`
- **THEN** the delivery holds `page-1.svg`, `page-1.png` and
  `page-1-6000.png` and no `index.html`
- **AND** its manifest records no page and no Archify supply

#### Scenario: An unknown medium

- **WHEN** a build names `--media video`
- **THEN** it refuses with `build_media_invalid` and writes nothing

### Requirement: Check without output

`archpub check` SHALL run validation, source binding, planning, poster
composition, the page's Archify checks and, for a model that names a
composition, the overview's typeset checks, and SHALL report the result
without writing a delivery; what Archify and Typst measure is written to a
temporary directory and removed.

#### Scenario: Checking an oversized model

- **WHEN** a model with an oversized view is checked
- **THEN** the result reports the refusal for that view
- **AND** no file is written

#### Scenario: Checking an overview

- **WHEN** a model whose composition sets two notes over each other is checked
- **THEN** the result refuses with `overview_text_overlap`
- **AND** no file is written

## ADDED Requirements

### Requirement: Media by default

Without `--media`, a build SHALL deliver the posters and the page and, when the
model names a composition, the overview. A build that asks for the overview of
a model that names no composition SHALL be refused with
`overview_composition_missing` before anything is written.

#### Scenario: The overview by default

- **WHEN** a model that names a composition is built without `--media`
- **THEN** the delivery holds the posters, the page and the overview

#### Scenario: An overview without a composition

- **WHEN** a model that names no composition is built with `--media overview`
- **THEN** the build refuses with `overview_composition_missing` and writes
  nothing

### Requirement: Overview inputs in the manifest

When a delivery holds the overview, its manifest SHALL record the composition's
path and digest, the house class's digest, the house supply's digest and the
Typst version.

#### Scenario: The overview's inputs

- **WHEN** a model with a composition is built with the overview
- **THEN** its manifest records the composition's path and digest, the class's
  and the house supply's digests and Typst 0.15.1
