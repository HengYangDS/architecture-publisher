## MODIFIED Requirements

### Requirement: Plate head and key

A plate's head SHALL be its number, its view's title and its question. Its key SHALL list what its figure shows and
cannot say where it stands, and no more, on one line where the body holds it, its baseline at 850 points on every
plate and each mark centred on its label's mid-line: the age bands and the pin's date, the scale bar, the citation
count, the hub, the boundary, the statuses and the ground of a part outside the repository. It SHALL list no kind.

#### Scenario: A plate's key

- **WHEN** a plate's figure shows commands and checks inside the boundary
- **THEN** its key lists the boundary on one line above the foot and neither kind, and each card names its kind
  beside the kind's icon

#### Scenario: A strip plate's key

- **WHEN** a plate shows files in all three bands and relations that cite files and no hub
- **THEN** its key names the three bands, the pin's date, the scale bar and the citation count, and no hub

#### Scenario: A part outside the repository

- **WHEN** a plate shows a part outside the repository
- **THEN** its key holds the ground of such a part with the edition's word for outside

#### Scenario: Marks of different heights

- **WHEN** a plate's key holds a band, a sample strip, a citation count, a hub's line and a boundary's outline
- **THEN** each is centred on the same line as the labels' text

### Requirement: Key samples from the value table

The key's sample of the hub's line, of the citation count and of the boundary SHALL be drawn with the weight,
pattern and type size the value table gives its row, at the plate's own scale. A key SHALL hold an entry for a row
of the table exactly when the plate's figure draws that row.

#### Scenario: The hub's entry

- **WHEN** a plate's figure draws lines into a hub
- **THEN** the key's sample of them is as heavy as those lines, in their colour, and its words name a heavy line
  and the hub in the edition's language

#### Scenario: The boundary's sample

- **WHEN** a plate's figure draws the system boundary
- **THEN** the key's sample of it has the dash and gap of the boundary on the plate

### Requirement: Edition palette in the manifest

The manifest SHALL record the palette's name or `custom`, the resolved palette
roles, and where the edition draws strips the spans of its age bands, the pin's
date and the length its largest part is drawn at. It SHALL record no marks.

#### Scenario: A custom palette

- **WHEN** a model gives its own palette
- **THEN** the manifest names the palette `custom` and records its ground, ink,
  dye steps and accent

#### Scenario: An edition without file facts

- **WHEN** a model is built without `--repo`
- **THEN** the manifest's style records the palette, null for its bands, and no length

## RENAMED Requirements

- FROM: `### Requirement: Edition marks in the manifest`
- TO: `### Requirement: Edition palette in the manifest`

## ADDED Requirements

### Requirement: The grounds in a key

A plate's key SHALL say of each sort of part on the outside ground what is true of it, exactly when the plate shows
one: of a part outside the repository, the edition's word for outside; of a neighbour that a group's view shows as
context, which lies inside the repository, that it stands outside the group.

#### Scenario: A part outside the repository

- **WHEN** a plate shows an external tool and no context neighbour
- **THEN** its key holds the outside ground once, with the word for outside

#### Scenario: A group's view

- **WHEN** a group's view shows two neighbours as context and no part outside the repository
- **THEN** its key holds the outside ground once, with the words for a neighbour outside the group, and does not
  say that anything lies outside the repository

### Requirement: A part without file facts

When a build has no bound file facts, because it reads no checkout or the model claims no files, the edition SHALL
draw every part without a strip and without a count, and its key SHALL hold no entry of a strip. The build SHALL
NOT warn of it: a part is drawn with the facts it has.

#### Scenario: No checkout

- **WHEN** a model is built without `--repo`
- **THEN** every part is a card with its name, its kind and its details, no strip is drawn, and the result carries
  no warning about marks

## REMOVED Requirements

### Requirement: Mark defaults and fallback

**Reason**: A part is one card, so an edition chooses no marks and has no fallback between two.

**Migration**: Remove `edition.marks` from a model. A build without file facts draws parts without strips and warns
of nothing; `marks_fallback` and `marks_need_files` no longer occur.
