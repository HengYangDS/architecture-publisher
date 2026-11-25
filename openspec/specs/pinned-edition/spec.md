# pinned-edition Specification

## Purpose

Deliver the model, the pinned edition as data, one evidence table and each plate's data face with every work, so
that a reader working from text finds every statement, fact and source a projection shows, under the same id.

## Requirements

### Requirement: The delivered model

Every delivery SHALL hold `model.json` at its top: the bytes of the model the build read, unchanged. Its digest in
the manifest's artifacts SHALL equal the digest the manifest records for the model.

#### Scenario: The model's bytes

- **WHEN** a model is built
- **THEN** the delivery's `model.json` is byte for byte the model file the build was given
- **AND** its SHA-256 is the manifest's `model.sha256`

#### Scenario: A build of one medium

- **WHEN** a model is built with `--media page`
- **THEN** the delivery holds `model.json`

### Requirement: The pinned edition as data

Every delivery SHALL hold `<model id>.json` at its top, the pinned edition as data, with these members in this
order: `delivery`, `publisher`, `work`, `model`, `pin`, `views`, `statements`, `catalogue`, `facts`, `evidence`,
`guide` when the model names one, `overview` when the build sets one, `plates` and `media`. Its `delivery` SHALL
state the format and version the manifest states, and its `model` the file, digest, size, format and version of the
delivered model.

#### Scenario: The members

- **WHEN** a model with a guide and an overview is built with its checkout
- **THEN** the data holds the fourteen members in that order

#### Scenario: A build of the page alone

- **WHEN** a model is built with `--media page`
- **THEN** the data holds every statement, fact and row of evidence, an empty list of plates and no overview

### Requirement: The work and the pin in the data

The data's `work` SHALL hold the model's id, language, title, question, summary, scope, limits, editors, licence
and coverage, as the model states them. Its `pin` SHALL hold the repository the model declares, the state of the
binding, `verified`, `unverified` or `none`, and the pin's date and release only when a checkout was read at the
pin.

#### Scenario: A build with a checkout

- **WHEN** a model that claims files is built with its checkout
- **THEN** the pin states `verified` and the date of the revision

#### Scenario: A build without a checkout

- **WHEN** the same model is built without `--repo`
- **THEN** the pin states `unverified`, and no date and no release

### Requirement: Views and statements in the data

The data SHALL hold each planned view with its id, title, question, summary, origin and tiers, the ids of the
components, groups and relations it selects and the number of its plate, and every component, relation and group
of the model with its id, label, details, status when the model states one, the files it claims or cites, a
group's members, and the origin `stated`. A relation's text SHALL be written `source —label→ target` with the ids
of its two ends and the model's label.

#### Scenario: A relation's text

- **WHEN** the model holds a relation `sync-store` from `sync` to `store` with the label `persists`
- **THEN** the data's relation `sync-store` holds the text `sync —persists→ store`

#### Scenario: A statement no view selects

- **WHEN** a component of the model is in no planned view
- **THEN** the data's statements hold it, and no view's list names it

#### Scenario: A view without a plate

- **WHEN** a model is built with `--media page`
- **THEN** no view of the data names a plate

### Requirement: The same state gives the same data

The data SHALL be JSON in UTF-8 with a two-space indent and one final newline, its keys in one fixed order,
statements in the model's order, views in the plan's order, evidence in path order and plates by number, so that
two builds of one state on one platform give the same bytes. It SHALL hold no timestamp of the build, host path or
name of an account.

#### Scenario: Two builds

- **WHEN** a model is built twice with the same version, checkout and date source on one platform
- **THEN** the two data files are byte-identical

### Requirement: The data holds the layer's facts and no other

The data's facts SHALL be the facts of `src/facts`, each with its property, what it is a fact of, its value, its
unit, its origin and, when measured, what it was measured from, and the data's catalogue SHALL be the layer's. The
data SHALL hold no fact the layer lacks and SHALL lack none the layer holds. A value the layer does not hold SHALL
be absent from the data and SHALL NOT be written as zero, null or a default.

#### Scenario: A part's bytes

- **WHEN** a model is built with a checkout and a component owns files of 4000 bytes together
- **THEN** the data holds for that component a fact of the property `owned-bytes` with the value 4000, the unit
  `bytes`, the origin `measured` and the pin as what it was measured from

#### Scenario: A build without a checkout

- **WHEN** a model that claims files is built without `--repo`
- **THEN** the data holds each relation's cited files and each view's hub
- **AND** it holds each part's claims as their author wrote them, a directory as a directory, as its owned files
  with the origin `stated`
- **AND** it holds no fact of bytes, share, age band, date or release

#### Scenario: A fact added beside the layer

- **WHEN** a test hands the writer of the data a fact of a property the catalogue does not list
- **THEN** the writer refuses with `projection_fact_unknown`, and names the property

### Requirement: One evidence table

The data SHALL hold one evidence table with one row for each path the model claims or cites and each path the
guide cites, each path once, in path order. The table SHALL be gathered from the model, the binding and the guide
as they are read; the model and the guide SHALL gain no field for it. With a checkout the build SHALL read at the
pin the paths only the guide cites, and SHALL NOT count them among the files the edition says were read.

#### Scenario: A file only the guide cites

- **WHEN** the guide cites lines 3 to 6 of `README.md`, which lies outside the model's scope, and the build has a
  checkout
- **THEN** the table holds `README.md` with its digest and size at the pin, no owner, no relation and that range
- **AND** the number of files the edition says were read is what it was without the guide

#### Scenario: A model that names no file

- **WHEN** neither the model nor a guide names a file
- **THEN** the table is empty

### Requirement: A row of evidence

A row of the evidence table SHALL hold the path; its state, `verified` when the build read the path at the pin and
`unverified` otherwise; when verified, its SHA-256, its size in bytes and the UTC date of its last change at the
pin; the component that owns it, when one does; the ids of the relations that cite it; and each range the guide
cites in it, with its first and last line, or none for a whole file, and the place of the citation. The table
SHALL refuse nothing.

#### Scenario: A file owned and cited

- **WHEN** a component owns `src/model/load.mjs`, one relation cites it, and the guide cites its lines 10 to 20
- **THEN** the table holds that path once, with its digest, size, last change, the component as its owner, the
  relation's id and one range of lines 10 to 20 with the place of the guide's citation

#### Scenario: A build without a checkout

- **WHEN** a model is built without `--repo`
- **THEN** every row's state is `unverified` and no row holds a digest, a size or a date

### Requirement: A plate's record

For each plate the data SHALL hold its number, its views, its images with their widths, the frame of its figure on
its page in points with the scale of the figure's drawing space in pixels per point, each scale a property is
drawn on, and its face. It SHALL hold the plate's page in the print edition, counted from 1, only when the edition
was typeset. For an overview the data SHALL hold its statement's SHA-256 and its images and SHALL hold no face.

#### Scenario: A box on an image

- **WHEN** a reader scales a face's box by the frame and by an image's width over the page's width of 1600 points
- **THEN** the rectangle lies on that part in the image

#### Scenario: A check

- **WHEN** `archpub check` composes a plate without typesetting the edition
- **THEN** the plate's face is compared as in a build, and no page is reported for it

#### Scenario: The overview's page

- **WHEN** a model states an overview and its edition is built
- **THEN** the data holds the statement's SHA-256 and the overview's images, and no face for it

### Requirement: A plate's data face

A plate's face SHALL hold every component, group and relation the plate drew, taken from what the drawing reports
as it draws. A component or a group SHALL hold its id and its box in the drawing space. A relation SHALL hold its
id, the ids of its two ends, each stretch it is stroked on as a list of points, the box of its label or
none, and either its text as `source —label→ target` or, when it stands for several relations of the model, their
ids. A face SHALL repeat no value of a fact.

#### Scenario: A part's box

- **WHEN** a plate draws a component's card as a rectangle at 120, 80 of 240 by 96 in its drawing space
- **THEN** the face holds that component's id with the box x 120, y 80, width 240, height 96

#### Scenario: An aggregated relation

- **WHEN** an overview's plate draws one line that stands for two relations of the model
- **THEN** the face holds one relation entry that names both relations and holds no text

#### Scenario: A shared trunk

- **WHEN** two relations of a plate are stroked on one trunk and each on a branch of its own
- **THEN** each relation's entry lists the trunk and its own branch among its stretches

### Requirement: A face equals its view's statement set

The build and `archpub check` SHALL refuse with `data_face_differs` when the ids of the components, groups and
relations of a plate's face are not exactly the ids its view selects, an aggregated relation counting as the
relations it stands for, or when a relation's text in a face is not the `source —label→ target` of the model's
relation of that id. The refusal SHALL name the plate and each id found on one side only.

#### Scenario: A relation the drawing left out

- **WHEN** a view selects three relations and the drawing reports two paths
- **THEN** the build refuses with `data_face_differs`, names the plate and the missing relation, and writes nothing

#### Scenario: A part the view does not select

- **WHEN** a face holds a component its view does not select
- **THEN** the build refuses with `data_face_differs` and names the component

#### Scenario: A relation drawn the wrong way

- **WHEN** a face's relation `sync-store` holds the text `store —persists→ sync` and the model's runs from `sync`
- **THEN** the build refuses with `data_face_differs` and names the relation

#### Scenario: The six works

- **WHEN** each of the six works of the publications is checked in both of its languages
- **THEN** no plate is refused

### Requirement: No projection holds what the data lacks

The build and `archpub check` SHALL refuse with `projection_fact_unknown` when a plate's face or a diagram of the
page the publisher generates names a component, relation or group the data's statements lack, or when a plate
draws a scale of a property the catalogue lacks. The refusal SHALL name the projection and what it holds. A guide's
diagrams SHALL NOT be held to the data. The reader file SHALL be written from the data, and its items' ids SHALL be
held to the model (`reader_ids_differ`).

#### Scenario: A plate that names an unknown part

- **WHEN** a plate's face names a component id the data's statements lack
- **THEN** the build refuses with `projection_fact_unknown` and names the plate and the id

#### Scenario: A reader file with another value

- **WHEN** the data holds 5 cited files for a relation
- **THEN** the reader file states `cited-files` as `5 files`, written from the data, and nothing reads it back

#### Scenario: A generated page

- **WHEN** the page the publisher generates for a model without a guide draws a relation the data lacks
- **THEN** the build refuses with `projection_fact_unknown` and names the relation

#### Scenario: A guide's diagram

- **WHEN** a guide's diagram draws a node whose id the model lacks
- **THEN** the build is not refused, and the node is matched or listed as unmatched

### Requirement: The guide's record

For a model that names a guide, the data SHALL hold the draft's path and digest, each file the draft names with its
digest, whether the guide's sources were verified, and its figures as matched to the model. The sources SHALL be
`verified` only when the page was built from the guide and its sources were verified at the revision, and
`declared` otherwise.

#### Scenario: The page from a guide

- **WHEN** a model with a guide, which names its repository's URL and revision, is built with its checkout and
  the page
- **THEN** the data's guide states its sources as `verified`

#### Scenario: The edition alone

- **WHEN** the same model is built with its checkout and `--media edition`
- **THEN** the data's guide states its sources as `declared`, since no page verified them

### Requirement: A guide's figures are matched to statements

For a model that names a guide, the data SHALL hold for each node of the guide's diagrams the components that own
the files it cites, by the verified rows of the evidence table, and for each connection whose two ends are matched
the relations of the model between their components. Nodes and connections that match no statement SHALL be
counted and listed, in the data and in the result of `archpub check`, and SHALL NOT refuse a build. Without a
checkout nothing SHALL be matched.

#### Scenario: A node that cites an owned file

- **WHEN** a diagram's node `parts-store` cites `internal/store/store.go`, which the component
  `configuration-store` owns
- **THEN** the data matches `parts-store` to `configuration-store`

#### Scenario: A node without a statement

- **WHEN** a diagram's node cites no file, or a file no component owns
- **THEN** the node is listed as unmatched and the build succeeds

#### Scenario: A connection without a relation

- **WHEN** a connection joins two matched nodes and the model holds no relation between their components
- **THEN** the connection is listed as unmatched and the build succeeds

### Requirement: The data grows by addition

The data and the reader file SHALL belong to the delivery's format and SHALL carry no version of their own. A
release that keeps the delivery's version MAY add a member, a key of an entry or a value of a list to the data,
and SHALL NOT remove a key written by an earlier release of that version or change what it means. A key the data
does not hold SHALL mean that the build did not hold the value.

#### Scenario: The delivery's version in the data

- **WHEN** a model is built
- **THEN** the data states the format and version its manifest states, and no other version of a format but the
  model's

#### Scenario: A key from a later release

- **WHEN** a test reads a data file to which a member `questions` and a key `lines` on a row of evidence were added
- **THEN** every invariant of this capability holds on it as it holds without them
