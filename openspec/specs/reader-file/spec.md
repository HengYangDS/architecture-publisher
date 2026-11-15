# reader-file Specification

## Purpose

Deliver with every work one reader file in the work's language that states the work, its pin and its statements
with their evidence, so that a reader starts from text that is complete and can be checked against the data.

## Requirements

### Requirement: A reader file in every delivery

Every delivery SHALL hold `<model id>.md` at its top, the reader file: Markdown in UTF-8, written from the data
and the guide's draft, the same bytes from two builds of one state. It SHALL hold, in this order: a
title and a head; a note on its keys; the model's scope and limits; the work's question and summary; one section
for each planned view; the statements no view selects; what is not covered; how to check the delivery again; and
last, when the model names a guide, the guide's text.

#### Scenario: A delivery of the page alone

- **WHEN** a model is built with `--media page`
- **THEN** the delivery holds its reader file, with every statement and no plate named

#### Scenario: Two builds

- **WHEN** a model is built twice with the same version, checkout and date source on one platform
- **THEN** the two reader files are byte-identical

#### Scenario: The parts in order

- **WHEN** a model with two views, one statement in no view and a guide is built
- **THEN** the reader file holds the head, the note on its keys, scope and limits, the question, two view sections,
  the section of statements no view selects, what is not covered, how to check again and the guide's text, in that
  order

### Requirement: The head

Under the title, one sentence SHALL name the work's id, its language and the publisher's version, and the head
SHALL state the pin, with the repository's name and revision, the state of the binding and, when measured, its
date and release; the file, version, size and SHA-256 of the model; the file and SHA-256 of the data; the numbers
of components, relations and groups with the three counts; the other files of the delivery; and the facts of the
edition. It SHALL state no time of writing.

#### Scenario: The data's digest

- **WHEN** a delivery is built
- **THEN** the SHA-256 the head states for the data is the digest the manifest lists for `<model id>.json`

#### Scenario: A build without a checkout

- **WHEN** a model that claims files is built without `--repo`
- **THEN** the head states the pin's state as `unverified` and no date of the pin

### Requirement: The three counts

The head SHALL count the model's components and relations as `cited`, `unchecked` and `uncited`. A statement SHALL
count as `cited` when it names files and the build read them at the pin, as `unchecked` when it names files and
the build had no checkout, and as `uncited` when it names no file. The head SHALL state no count the build cannot
decide.

#### Scenario: A build with a checkout

- **WHEN** a model of five components and relations, four of which name files, is built with its checkout
- **THEN** the head states cited 4, unchecked 0 and uncited 1

#### Scenario: A build without a checkout

- **WHEN** the same model is built without `--repo`
- **THEN** the head states cited 0, unchecked 4 and uncited 1

### Requirement: A section for each view

Each view's section SHALL be headed by the view's question, or by its title when it has no question or an earlier
section carries the same one, SHALL state the view's summary, SHALL name the view's id and, when the edition is
delivered, its plate and image, SHALL state the facts of the view, and SHALL hold one list item for each statement
the view selects. A statement SHALL stand with its full item once, in the first view that selects it, and by type
and id alone in each later view.

#### Scenario: A statement in two views

- **WHEN** two views select the component `store`
- **THEN** the first view's section holds its full item and the second holds its type and id alone

#### Scenario: Two views with one question

- **WHEN** a view asks the question the view before it asks
- **THEN** the first section is headed by the question and the second by its view's title

### Requirement: A statement's item

A statement's item SHALL begin with its type, `component`, `relation` or `group`, and its id between backticks, and
SHALL state its text, its status when the model states one, its origin and the files it claims or cites or, for a
group, its members; beneath it, each detail the model states and the facts the data holds for it, each line of
facts led by its origin. A relation's text SHALL be written `source —label→ target`. A field that has no value
SHALL NOT be written.

#### Scenario: A component's line

- **WHEN** the model holds a component `store` of the kind `authority`, labelled "Configuration store", that
  claims `internal/store/`
- **THEN** its item begins with `component` and the id `store` and states the label, the kind, the origin
  `stated` and the claimed path

#### Scenario: A statement without a status

- **WHEN** a component states no status
- **THEN** its item holds no status and no word in its place

#### Scenario: A measured fact

- **WHEN** the data holds 5 cited files for a relation, measured from the model
- **THEN** beneath the relation's item stands a line led by `measured (model)` that states `cited-files` as 5
  `files`

#### Scenario: A list

- **WHEN** the data holds a part's owned files as a list of two paths
- **THEN** the part's line of facts states `owned-files` as 2 `paths`

### Requirement: The reader file's statement ids equal the model's

The build and `archpub check` SHALL parse the reader file's text as it will be delivered, and SHALL refuse with
`reader_ids_differ` unless the ids of its component, relation and group items are exactly the ids of the model's
components, relations and groups, each type compared by itself. The refusal SHALL name each id found on one side
only, with its type.

#### Scenario: A line left out

- **WHEN** the reader file's text lacks the item of one relation of the model
- **THEN** the build refuses with `reader_ids_differ`, names the relation, and writes nothing

#### Scenario: A component written as a relation

- **WHEN** the reader file's text holds the id of a component under the type `relation`
- **THEN** the build refuses with `reader_ids_differ` and names the id under both types

#### Scenario: A statement in no view

- **WHEN** a component of the model is in no planned view
- **THEN** its item stands in the section of statements no view selects, and the build is not refused

### Requirement: The guide's text is carried whole

When the model names a guide, the reader file SHALL end with the guide's text: after one heading of the reader
file's own, the bytes of the guide's draft from first to last, unchanged, to the end of the file. No generated
line SHALL follow them, and the statement items the publisher parses SHALL be those before that heading. A model
without a guide SHALL have no such part, and the reader file SHALL say so among what is not covered.

#### Scenario: The draft's bytes

- **WHEN** a model with a guide is built
- **THEN** the reader file's bytes after that heading are byte for byte the guide's draft
- **AND** their SHA-256 is the digest the data records for the guide

#### Scenario: A guide that holds a line shaped like a statement

- **WHEN** the guide's draft holds a list item that begins with `component` and an id the model lacks
- **THEN** the build is not refused, because the item stands after the guide's heading

#### Scenario: A model without a guide

- **WHEN** a model that names no guide is built
- **THEN** the reader file holds no guide part and names the absence among what is not covered

### Requirement: Words in the model's language, keys in none

The words the publisher sets in the reader file SHALL be in the model's language, for every language the publisher
sets an edition in. Ids, paths, the type words `component`, `relation` and `group`, the origins `stated` and
`measured`, property names and units SHALL be written as the data writes them, in every language. The data files
of two languages of one work, built from models with the same ids at the same pin, SHALL agree in every id, fact
and row of evidence.

#### Scenario: A Chinese work

- **WHEN** a model whose language is `zh-CN` is built
- **THEN** the reader file's headings and sentences are Chinese, and its statement items begin with `component`,
  `relation` or `group`

#### Scenario: Two languages of one work

- **WHEN** the English and the Chinese model of one work, with the same ids, are built at one pin
- **THEN** the two data files hold the same ids, facts and rows of evidence, and differ only in texts

### Requirement: What is not covered

The reader file's generated parts SHALL say what the file does not cover: the paths the model's scope excludes,
with the model's reasons; the statements no plate draws; the absence of a guide or of a checkout; that it lists no
written statement beyond components, relations and groups and judges no statement supported; that the text of an
overview's page and of a guide's diagram documents is not carried; and, with a guide, that the guide's part is
transitional.

#### Scenario: An excluded path

- **WHEN** the model's scope excludes `**/*_test.go` with a reason
- **THEN** the part names that pattern and the reason

#### Scenario: A model with a guide

- **WHEN** a model with a guide is built
- **THEN** the part says that the guide's text follows unchanged and is a transitional part

### Requirement: How to check again

After what is not covered, the reader file SHALL name the commands that check the delivery again: `archpub verify`
on the delivery and `archpub check` on the model with a checkout at the pin.

#### Scenario: The commands

- **WHEN** a delivery is built
- **THEN** the closing part names `archpub verify` and `archpub check` with `--repo`
