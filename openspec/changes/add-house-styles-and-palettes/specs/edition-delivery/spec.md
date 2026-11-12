## ADDED Requirements

### Requirement: Style defaults and fallback

The print edition SHALL default to the `bolts` style and the `indigo` palette.
When a build has no bound file facts, because it reads no checkout or the model
claims no files, it SHALL set a model that names no style in `cards` and warn
`style_fallback`, and SHALL refuse a model that names `bolts` with
`style_needs_files`.

#### Scenario: No checkout

- **WHEN** a model that names no style is built without `--repo`
- **THEN** the edition is set in cards and the result carries the warning
  `style_fallback`

#### Scenario: Bolts without files

- **WHEN** a model that names `bolts` claims no files
- **THEN** the build is refused with `style_needs_files`

### Requirement: Edition style in the manifest

The manifest SHALL record the edition's style, the palette's name or `custom`,
the resolved palette roles and the spans of its age bands.

#### Scenario: A custom palette

- **WHEN** a model gives its own palette
- **THEN** the manifest names the palette `custom` and records its ground, ink,
  dye steps and accent

## MODIFIED Requirements

### Requirement: Manifest records

The manifest SHALL record its format and version 7; the publisher's name and
version; the model's id, title, language, SHA-256 and size; the declared
repository; the build's quality and media; each cited file's state, digest,
size, last change date, owner and citing relations;
the digests of the font, house, measuring and icon supplies and, when it
delivers the page, Archify's; the plan, each view naming the number of its
plate; each plate's record; and every artifact's path, size and digest.

#### Scenario: Identity fields

- **WHEN** a model is built
- **THEN** its manifest names the delivery format and version 7, the
  publisher's name and version and the model's id, title, language, digest and
  size

#### Scenario: A cited file's record

- **WHEN** a component owns `src/model/load.mjs` and one relation cites it
- **THEN** the manifest records that path once, with its digest, size, last
  change date, the component as its owner and the relation's id

### Requirement: Plate head and key

A plate's head SHALL be its number, its view's title and its question. Its key
SHALL be one line at 848 points of what its figure shows and no more: in
`cards`, the kinds, boundary and statuses; in `bolts`, the age bands by their
spans, the strip's thickness, the line weights present, the hub, the boundary
and the statuses.

#### Scenario: A plate's key

- **WHEN** a plate's figure shows commands and checks inside the boundary
- **THEN** its key lists command, check and the boundary on one line above the
  foot, and no kind it does not show

#### Scenario: A woven plate's key

- **WHEN** a `bolts` plate shows files in all three bands and lines of one and
  two citing files and no hub
- **THEN** its key names the three bands, the thickness and the two weights,
  and no hub
