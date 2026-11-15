## MODIFIED Requirements

### Requirement: Plate head and key

A plate's head SHALL be its number, its view's title and its question. Its key SHALL list what its figure shows and
no more, on one line where the body holds it, its baseline at 850 points on every plate and each mark centred on its
label's mid-line: with cards, the kinds, boundary and statuses; with strips, the age bands and the pin's date, the
scale bar, the citation count, the hub, the boundary and the statuses.

#### Scenario: A plate's key

- **WHEN** a plate's figure shows commands and checks inside the boundary
- **THEN** its key lists command, check and the boundary on one line above the foot, and no kind it does not show

#### Scenario: A strip plate's key

- **WHEN** a strip plate shows files in all three bands and relations that cite files and no hub
- **THEN** its key names the three bands, the pin's date, the scale bar and the citation count, and no hub

#### Scenario: Marks of different heights

- **WHEN** a strip plate's key holds a band, a sample strip, a citation count, a hub's line and a boundary's outline
- **THEN** each is centred on the same line as the labels' text, and the text stands where a card plate's key sets
  its own

## ADDED Requirements

### Requirement: Key samples from the value table

The key's sample of the hub's line, of the citation count and of the boundary SHALL be drawn with the weight,
pattern and type size the value table gives its row, at the plate's own scale. A key SHALL hold an entry for a row
of the table exactly when the plate's figure draws that row.

#### Scenario: The hub's entry

- **WHEN** a strip plate's figure draws lines into a hub
- **THEN** the key's sample of them is as heavy as those lines, in their colour, and its words name a heavy line
  and the hub in the edition's language

#### Scenario: The boundary's sample

- **WHEN** a plate's figure draws the system boundary
- **THEN** the key's sample of it has the dash and gap of the boundary on the plate

### Requirement: Comparison of two deliveries

`archpub compare <delivery> <delivery>` SHALL report every file that differs in bytes between two deliveries or
stands in one alone: a plate's page images, at every width, under that plate by its number and views, and every
other file a manifest lists, and the manifest itself, as a file of the whole edition. The result SHALL say that the
deliveries are identical exactly when no such file differs. The command SHALL write nothing.

#### Scenario: One model built twice

- **WHEN** one model is built twice by one commit of the publisher on one platform with one date source, and the two
  deliveries are compared
- **THEN** the result says the deliveries are identical and lists no plate and no file
- **AND** the exit status is 0

#### Scenario: One plate's image replaced

- **WHEN** one delivery holds another valid image in place of one plate's page image, with its manifest brought
  into line, and it is compared with the delivery as built
- **THEN** the result lists exactly that plate, with that image
- **AND** it lists the manifest among the files of the whole edition, and no other file

#### Scenario: One value of the table changed

- **WHEN** a model is built by the publisher and by a copy of it whose value table gives the boundary another gap,
  and the two deliveries are compared
- **THEN** the result lists exactly the plates whose figure draws the boundary, each with its image files
- **AND** it lists the print edition among the files of the whole edition
- **AND** no plate without a boundary is listed

#### Scenario: A file in one delivery alone

- **WHEN** one delivery holds a plate's image at a width the other was not built at
- **THEN** the result lists that image under its plate and says which delivery holds it

#### Scenario: A comparison with JSON output

- **WHEN** `archpub compare` runs with `--json` on two deliveries that differ in one plate
- **THEN** standard output holds one JSON object with `ok: true`, `identical: false`, that plate's number, views and
  changed files, each with its digest in either delivery, and the changed files of the whole edition

#### Scenario: A comparison's report

- **WHEN** `archpub compare` runs without `--json` on two deliveries that differ in one plate
- **THEN** the report's title names the first delivery as it was typed, a group lists that plate by its number and
  views, and the closing line says how many plates and files of the whole edition differ

### Requirement: What a comparison refuses and leaves out

`archpub compare` SHALL first check each delivery against its own manifest and refuse, with status 1 and the
delivery's name, a directory that is no delivery or whose files differ from its manifest. It SHALL exit with status
0 whenever it compared, whether or not they differ. It SHALL NOT compare an acceptance record, its signature or the
colophon page. Its help and the command line reference SHALL say that two builds are the same bytes only on one
platform with one date source.

#### Scenario: A delivery changed after its build

- **WHEN** one of the two deliveries holds an image edited after its build
- **THEN** the comparison refuses with `delivery_changed`, names that delivery and names the image
- **AND** the exit status is 1

#### Scenario: A directory that is no delivery

- **WHEN** one of the two directories holds no manifest
- **THEN** the comparison refuses with `delivery_manifest_missing` and names the directory

#### Scenario: Deliveries that differ

- **WHEN** the two deliveries differ in a plate's image
- **THEN** the exit status is 0

#### Scenario: An accepted delivery

- **WHEN** a delivery is compared with a copy of it that a reviewer has accepted
- **THEN** the result says the deliveries are identical
