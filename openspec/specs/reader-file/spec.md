# reader-file Specification

## Purpose

Deliver with every work one reader file in the work's language that states the work, its pin and its statements
with their evidence, so that a reader starts from text that is complete and can be checked against the data.

## Requirements

### Requirement: A reader file in every delivery

Every delivery SHALL hold `<model id>.md`, the reader file: a Markdown document in the model's language, written
from the data and the guide, the same bytes from two builds of one state. It SHALL hold, in order: a title and a
head; a note on its words; scope and limits; the question and summary; a section for each planned view; the
statements no view selects; what is not covered; how to check again; and last, with a guide, the guide as prose.

#### Scenario: A delivery of the page alone

- **WHEN** a model is built with `--media page`
- **THEN** the delivery holds its reader file, with every statement and no plate named

#### Scenario: Two builds

- **WHEN** a model is built twice with the same version, checkout and date source on one platform
- **THEN** the two reader files are byte-identical

#### Scenario: The parts in order

- **WHEN** a model with two views, one statement in no view and a guide is built
- **THEN** the reader file holds the head, the note on its words, scope and limits, the question, two view
  sections, the section of statements no view selects, what is not covered, how to check again and the guide, in
  that order

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
- **THEN** the head states the pin's state as unverified, in the model's language, and no date of the pin

### Requirement: The three counts

The head SHALL count the model's components and relations as cited, unchecked and uncited, each in the model's
language. A statement SHALL count as cited when it names files and the build read them at the pin, as unchecked
when it names files and the build had no checkout, and as uncited when it names no file. The head SHALL state no
count the build cannot decide.

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

A statement's item SHALL begin with the language's word for its type and its id between backticks, and SHALL state
its text, its status when stated, its origin and its files or members; beneath it, each detail and each line of
facts, led by its origin in the model's language, each property and value with its unit between backticks. A
relation's text SHALL be written `source —label→ target`. A field without a value SHALL NOT be written.

#### Scenario: A component's line

- **WHEN** the model holds a component `store` of the kind `authority`, labelled "Configuration store", that
  claims `internal/store/`
- **THEN** its item begins with the language's word for a component and the id `store`, and states the label, the
  kind, the origin and the claimed path

#### Scenario: A statement without a status

- **WHEN** a component states no status
- **THEN** its item holds no status and no word in its place

#### Scenario: A measured fact

- **WHEN** the data holds 5 cited files for a relation, counted from the model
- **THEN** beneath the relation's item stands a line led by the language's words for a count from the model that
  states `cited-files` as `5 files`

#### Scenario: A list

- **WHEN** the data holds a part's owned files as a list of two paths
- **THEN** the part's line of facts states `owned-files` as `2 paths`

### Requirement: The reader file's statement ids equal the model's

The build and `archpub check` SHALL read the ids of the reader file's items as it will be delivered, an item a line
that begins with the language's word for its type and its id between backticks, and SHALL refuse with
`reader_ids_differ` unless they are exactly the ids of the model's components, relations and groups, each type
compared by itself and each once. The refusal SHALL name each id found on one side only, with its type.

#### Scenario: A line left out

- **WHEN** the reader file's text lacks the item of one relation of the model
- **THEN** the build refuses with `reader_ids_differ`, names the relation, and writes nothing

#### Scenario: A component written as a relation

- **WHEN** the reader file's text holds the id of a component under the word for a relation
- **THEN** the build refuses with `reader_ids_differ` and names the id under both types

#### Scenario: A statement in no view

- **WHEN** a component of the model is in no planned view
- **THEN** its item stands in the section of statements no view selects, and the build is not refused

### Requirement: What is not covered

The reader file's generated parts SHALL say what the file does not cover: the paths the model's scope excludes,
with the model's reasons; the statements no plate draws; the absence of a guide or of a checkout; that it lists no
written statement beyond components, relations and groups and judges no statement supported; and that the text of
an overview's page and of a guide's diagram documents is not carried.

#### Scenario: An excluded path

- **WHEN** the model's scope excludes `**/*_test.go` with a reason
- **THEN** the part names that pattern and the reason

#### Scenario: A model with a guide

- **WHEN** a model with a guide is built
- **THEN** the part says that the text of the guide's diagram documents is not carried

### Requirement: How to check again

After what is not covered, the reader file SHALL name the commands that check the delivery again: `archpub verify`
on the delivery and `archpub check` on the model with a checkout at the pin.

#### Scenario: The commands

- **WHEN** a delivery is built
- **THEN** the closing part names `archpub verify` and `archpub check` with `--repo`

### Requirement: The guide as prose

With a guide, the reader file SHALL end, under one heading, with the guide as Archify's parser reads it, in plain
Markdown: its answer, then a section a panel; a figure named by its title and file; each citation a footnote, in
ascending order at one place, after one sentence naming the pin. No line or mark of the guide's syntax and no link
without text SHALL remain. A draft the parser refuses SHALL be refused with `guide_unparsed`.

#### Scenario: A guide with citations

- **WHEN** a model with a guide whose panels cite sources is built
- **THEN** the reader file's guide part holds no `@` line and no link without text, and each citation is a footnote
  that names the source's path and lines

#### Scenario: A guide with a checklist after a list

- **WHEN** a model with a guide whose panel holds facts and then a checklist is built
- **THEN** the checklist's items keep their boxes, and the facts and the checklist take different markers, so a
  Markdown viewer shows two lists

#### Scenario: A guide Archify refuses

- **WHEN** a model names a guide of no panel and is built with `--media edition`
- **THEN** the build refuses with `guide_unparsed`

### Requirement: One language, its code as the data's

The words the publisher sets in the reader file SHALL be in the model's language, for every language the publisher
sets an edition in. Ids, paths, property names, values and units SHALL be written as code, as the data writes them,
in every language.

#### Scenario: A Chinese work

- **WHEN** a model whose language is `zh-CN` is built
- **THEN** the reader file's headings, words of its items and sentences are Chinese, and outside its code it holds
  no English word of a key

#### Scenario: Two languages of one work

- **WHEN** the English and the Chinese model of one work, with the same ids, are built at one pin
- **THEN** the two data files hold the same ids, facts and rows of evidence, and the two reader files name the same
  statement ids

### Requirement: A guide's figures as text

With a guide, the reader file SHALL write what each of the guide's figures says as text under the line that names
it, from the figure's document: its items in bold with what the figure writes beside them, each line between two
items under the one it leaves, an order the figure draws numbered, fields beside their entity or type, and dates
and spans as tables. A citation of a figure's item SHALL be a footnote.

#### Scenario: A figure of parts

- **WHEN** a model with a guide whose panel shows an architecture file of two parts and one connection is built
- **THEN** the reader file lists the two parts under the figure's line, the connection under the part it leaves

### Requirement: Steps that walk a figure stand with its items

Steps of the guide that each name a different item of one figure SHALL stand with those items, in the steps'
order, and SHALL NOT be written again on their own.

#### Scenario: Steps that walk a figure

- **WHEN** a guide's panel shows a figure and then steps, each naming one of its items
- **THEN** each item stands once, in the steps' order, with the step's words
