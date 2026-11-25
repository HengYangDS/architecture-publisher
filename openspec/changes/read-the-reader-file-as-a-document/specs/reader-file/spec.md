## MODIFIED Requirements

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
SHALL state the pin, with the repository's name and revision, the state of the binding in the model's language and,
when measured, its date and release; the file, version, size and SHA-256 of the model; the file and SHA-256 of the
data; the numbers of components, relations and groups with the three counts; the other files of the delivery; and
the facts of the edition. It SHALL state no time of writing.

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

## REMOVED Requirements

### Requirement: The guide's text is carried whole

**Reason**: The reader file is a document to read: the guide's draft, byte for byte, filled it with the guide's own
syntax (directives, anchors and empty links); the guide now follows as prose (the requirement "The guide as prose").

**Migration**: The draft stays in the work's repository; the manifest records its SHA-256 and the data its
citations.

### Requirement: Words in the model's language, keys in none

**Reason**: The reader file's type words, origins and field names were written alike in every language so that a
parse could read them back; the data is now the one machine source, and the reader file is written in the model's
language throughout (the requirement "One language, its code as the data's").

**Migration**: An agent that read the shared keys reads the data file, which holds every statement and fact keyed.

## ADDED Requirements

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
