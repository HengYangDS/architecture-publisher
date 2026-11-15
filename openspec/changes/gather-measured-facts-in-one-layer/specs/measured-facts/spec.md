## Purpose

Measure in one layer every fact a plate draws that its author did not state, each with its subject, its unit and
whether it was measured or stated, so that every projection reads the same facts and measures none itself.

## ADDED Requirements

### Requirement: One layer of measured facts

The publisher SHALL measure in one unit, `src/facts`, every fact a plate draws that its author did not state: for
each part its owned files, their number, their bytes and each file's share and age band; for the edition the bytes
of its largest part, the pin's date and release and the number of files read; for each relation the number of files
it cites; for each view its hub and the age bands its parts hold.

#### Scenario: A part that owns two files

- **WHEN** a part owns one file of 3000 bytes and one of 1000 bytes at the pin
- **THEN** the layer holds for it 2 files, 4000 bytes, and shares of three quarters and one quarter in path order

#### Scenario: A part that owns no files

- **WHEN** a part claims no file
- **THEN** the layer holds for it 0 files and an empty list, and no bytes, share or age band

#### Scenario: Two parts of equal size

- **WHEN** two parts each own 5000 bytes and no part owns more
- **THEN** the edition's largest part is 5000 bytes, and the layer holds the same bytes for both

#### Scenario: A relation that cites no file

- **WHEN** a relation names no file
- **THEN** the layer holds 0 cited files for it

#### Scenario: A relation of the overview

- **WHEN** an overview's relation stands for two relations of the model that cite three files, one of them in both
- **THEN** the layer holds 3 cited files for it

#### Scenario: A view without a hub

- **WHEN** two relations of a view end at one part and two at another
- **THEN** the layer holds no hub for the view

#### Scenario: A view with a hub

- **WHEN** three relations of a view end at one part and fewer at every other
- **THEN** the layer holds that part as the view's hub

#### Scenario: A group the overview draws

- **WHEN** the overview draws a group whose two members own 2000 and 3000 bytes
- **THEN** the layer holds for the group both members' files in path order and 5000 bytes
- **AND** the edition's largest part is at least 5000 bytes

### Requirement: The plan keeps its count of joined relations

The number of relations an overview's relation stands for SHALL stay a detail of the planned relation, formed by
the plan together with that relation, and SHALL NOT be a fact of the layer.

#### Scenario: An overview's relation that stands for several

- **WHEN** an overview's relation stands for three relations of the model
- **THEN** the layer holds the files those three cite as its cited files
- **AND** it holds no fact of their number, which the planned relation carries as a detail

### Requirement: A fact names its subject, unit and origin

Each fact SHALL carry the property it is a value of, the part, file, relation, view or edition it is a fact of, its
value, its unit, and its origin: `measured` with what it was measured from, the pin or the model, or `stated`. The
layer's catalogue SHALL list each property once with its name, the kind of its subject, its unit and its origin,
and the layer SHALL hold no fact of a property the catalogue lacks.

#### Scenario: A part's bytes

- **WHEN** the layer is built from a checkout read at the pin
- **THEN** the fact of a part's bytes names the part, a whole number, the unit `bytes`, the origin `measured` and
  the pin

#### Scenario: A relation's cited files

- **WHEN** the layer is built with or without a checkout
- **THEN** the fact of a relation's cited files names the relation, the unit `files`, the origin `measured` and
  the model

#### Scenario: Ownership without a checkout

- **WHEN** the layer is built without a checkout and a component claims two paths
- **THEN** the fact of the part's owned files holds the two declared paths with the origin `stated`

#### Scenario: A claimed directory without a checkout

- **WHEN** the layer is built without a checkout and a component claims a directory and a file
- **THEN** the fact of the part's owned files holds both claims as their author wrote them, with the origin
  `stated`

#### Scenario: A property outside the catalogue

- **WHEN** a test asks the layer for a fact of a property the catalogue does not list
- **THEN** the layer refuses, and names the property

### Requirement: A fact that was not measured is absent

Without a checkout read at the pin, the layer SHALL hold no bytes, no share, no age band, no largest part, no date
of the pin and no release, and SHALL NOT hold zero or a default in their place. The facts measured from the model
alone, a relation's cited files and a view's hub, SHALL be held in every build.

#### Scenario: A build without a checkout

- **WHEN** a model that claims files is built without `--repo`
- **THEN** the layer holds each relation's cited files and each view's hub
- **AND** it holds no bytes and no age band for any part
- **AND** it holds the number of declared paths as the files read, with the origin `stated`

#### Scenario: A file changed after the pin's clock

- **WHEN** a file's last change is recorded later than the pin's commit time
- **THEN** its age band is the newest, as it is drawn today

### Requirement: Projections read the layer

The plates, the edition's record and the page SHALL take every measured fact they show from the layer and SHALL
measure none: a plate drawn from a layer whose values differ from the model and the binding SHALL show the layer's
values. No module under `src/poster`, `src/edition`, `src/map` or `src/overview` SHALL import `src/sources` or
`src/facts`, or define or call a measure the catalogue names.

#### Scenario: A false hub

- **WHEN** a strip plate is drawn from a layer that names as the view's hub a part only two relations end at
- **THEN** those two lines are drawn as lines into the hub, and the key names that part

#### Scenario: A false count

- **WHEN** a strip plate is drawn from a layer that holds 9 cited files for a relation whose model names none
- **THEN** that relation's line carries the number 9

#### Scenario: A false size

- **WHEN** a strip plate is drawn from a layer that holds 1000 bytes for a part whose files hold 100000
- **THEN** the part's strip and caption show 1000 bytes on the edition's scale

#### Scenario: A drawing module that measures

- **WHEN** a module under `src/poster` defines a function with the name of a measure in the catalogue, or imports
  a module of `src/sources`
- **THEN** the boundary test fails and names the module

#### Scenario: The page's first file

- **WHEN** the page is built with a checkout and a component owns files
- **THEN** the file the page cites for the component is the first owned file the layer holds for it

### Requirement: The layer is not delivered

The layer SHALL add no file to a delivery, no field to the manifest and no field to the result of
`archpub check --json`, and the manifest's version SHALL stay as it is. A delivery built through the layer SHALL be
the bytes the commit before the layer builds from the same model, checkout, platform and date source.

#### Scenario: The twelve editions

- **WHEN** each of the six works is built in both of its languages by the commit before the layer and by the
  commit that holds it, on one platform with one date source, and each pair is given to `archpub compare`
- **THEN** every comparison says the two deliveries are identical and lists no plate and no file

#### Scenario: The check's result

- **WHEN** `archpub check --json` runs on one model with a checkout before and after the layer
- **THEN** the two results are the same JSON

#### Scenario: A revision the checkout lacks

- **WHEN** a model that claims and cites no file asks for strips and names a revision its checkout does not hold
- **THEN** the build is refused for the unknown revision, as it is for a model that claims files, and not for the
  marks
