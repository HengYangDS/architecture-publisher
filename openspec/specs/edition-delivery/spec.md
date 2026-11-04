# edition-delivery Specification

## Purpose

Write deterministic deliveries with a manifest, record one acceptance and
publish accepted deliveries as immutable versions.

## Requirements

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

### Requirement: Deterministic manifest

The manifest SHALL contain no timestamps, host paths or user names, so the
same model built with the same version on one platform yields the same
manifest.

#### Scenario: Two builds

- **WHEN** a model is built twice with the same version on one platform
- **THEN** both manifests are byte-identical

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

### Requirement: Machine-readable results

Every command SHALL accept `--json` and then print exactly one JSON object with
`ok` and either its outputs or its diagnostics. The exit status SHALL be 0 on
success, 1 for a refused input, 2 for a usage error and 3 for any other
failure, whose JSON object SHALL carry the code `internal_error` and a message.
`archpub --help` SHALL print the usage and `archpub --version` the package
version, each with status 0.

#### Scenario: A refused build with JSON output

- **WHEN** a build with `--json` refuses an invalid model
- **THEN** standard output holds one JSON object with `ok: false` and the
  diagnostics
- **AND** the exit status is 1

#### Scenario: A manifest that cannot be read

- **WHEN** `archpub accept --json` meets a `manifest.json` that is a directory
- **THEN** standard output holds one JSON object with `ok: false` and the code
  `internal_error`
- **AND** the exit status is 3

#### Scenario: The version

- **WHEN** `archpub --version --json` runs
- **THEN** standard output holds one JSON object with `ok: true` and the
  package version

### Requirement: The caller's environment

Git and Archify SHALL run with only the caller's `PATH`, `PATHEXT`, `HOME`,
`USERPROFILE`, `TMPDIR`, `TEMP`, `TMP` and `SystemRoot` variables, so that no
other variable of the caller changes what they read or decide.

#### Scenario: A caller's Git and Archify variables

- **WHEN** the caller sets `GIT_DIR` to another repository and
  `ARCHIFY_EXPLAINER_PREPARED` to a missing file
- **THEN** sources are read from the checkout `--repo` names
- **AND** the page is delivered byte for byte as without those variables

### Requirement: One acceptance record

`archpub accept` SHALL verify every artifact of a delivery against its manifest
and SHALL write `acceptance.json` with the reviewer, an optional note and the
manifest digest. It SHALL refuse when any artifact differs from the manifest.

#### Scenario: An artifact changed after the build

- **WHEN** a poster was edited after the build
- **THEN** acceptance refuses and names the changed artifact

### Requirement: Immutable versioned publication

`archpub publish` SHALL require a valid acceptance record, copy the delivery to
`<root>/<model id>/<version>/`, verify every copied digest, refuse to replace an
existing version with different content and leave every other version
untouched. The default version SHALL be the first twelve hexadecimal digits of
the manifest digest.

#### Scenario: Publishing twice

- **WHEN** the same accepted delivery is published twice to the same root
- **THEN** the second publication reports the existing identical version and
  changes nothing

#### Scenario: A conflicting version

- **WHEN** a different delivery is published under an existing version name
- **THEN** publication refuses and the existing version is unchanged

#### Scenario: An unaccepted delivery

- **WHEN** a delivery without an acceptance record is published
- **THEN** publication refuses and copies nothing

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

### Requirement: Guide inputs in the manifest

When the page is a guide, the manifest SHALL record the draft's path and
digest, each staged file's name and digest, the writing level and whether the
guide's sources were verified at the revision.

#### Scenario: The guide's inputs

- **WHEN** a model with a guide is built with a checkout
- **THEN** its manifest records the draft's path and digest, each staged file,
  the writing level `strict` and the guide's sources as verified
