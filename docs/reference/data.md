---
subject: architecture-publisher:data
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Data and reader file reference

Every delivery holds the model, the data and the reader file at its top beside its media, whichever media it
carries; the [delivery's table](operations.md#the-delivery) names them. Together they are the pinned edition as text:
what the build read, measured and drew of one work at one pin, for a reader that works from text and not from the
plates. The model is the author's bytes, unchanged; the data is JSON in UTF-8 with a two-space indent and one final
newline; the reader file is Markdown in UTF-8, in the model's language.

The manifest lists each among its artifacts with its size and SHA-256, so `archpub verify`, `accept`, `compare` and
`publish` cover them like every other file, and the digest of `model.json` is the manifest's `model.sha256`. The
delivered model names its overview and its guide as files beside the author's model, which the delivery does not
hold: it is a record, and no input to build from. No file holds the time of its writing, a host path or the name of
an account, and keys and lists stand in one fixed order, so two builds of one state on one platform write the same
bytes of all three.

<!-- taken: written from src/delivery.json by tools/docs/references.mjs; do not edit -->

A model whose id is `model`, `manifest`, `acceptance` or `colophon` would give two files of its delivery one name: `model.json` would be both its data and the model the build read, `manifest.json` would be both its data and the manifest, `acceptance.json` would be both its data and the record an acceptance writes and `colophon.pdf` would be both its print edition and the colophon page an acceptance writes.

<!-- end of taken -->

`archpub check` and `archpub build` refuse such a model with `delivery_name_taken` straight after reading it, and
name the file that would be two things.

## The data

The data's schema, [`src/pinned/data.schema.json`](../../src/pinned/data.schema.json), is the format's statement:
each member and each key of an entry, in its order, with its type and what it holds. The publisher writes the data in
the shape it states; the package carries it, so that an agent can hold a delivery's data to it; and the tables of this
reference are written from it.

<!-- members: written from src/pinned/data.schema.json by tools/docs/references.mjs; do not edit -->

The pinned edition as data, `<model id>.json` at the top of a delivery: what the build read, measured and drew of one work at one pin. Each object holds its keys in the order the schema lists them, so two builds of one state write the same bytes. A key the build held no value for is absent; none is written as zero, null or a default. The schema states the data of the release that ships it. A later release of the same delivery version may add a member, a key of an entry or a value of a list; it removes no key and changes the meaning of none, so a reader of its data ignores a key it does not know.

| Member       | Holds                                                                                                                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `delivery`   | The delivery's format and its version, as the manifest states them: `format` and `version`.                                                                                                                                                                             |
| `publisher`  | The publisher that built the delivery, by its name and its version: `name` and `version`.                                                                                                                                                                               |
| `work`       | The work as its model states it, a field the model does not state absent: `id`, `locale`, `title`, `question`, `summary`, `scope`, `limits`, `editors` (`name` and `url`), `license` and `coverage` (`include` and `exclude` (`path` and `reason`)).                    |
| `model`      | The model the delivery carries beside the data, as the build read it: `file`, `sha256`, `bytes`, `format` and `version`.                                                                                                                                                |
| `pin`        | The repository the model declares, the state of its binding, and the pin's date and release when a checkout was read: `repository` (`name`, `url`, `browse` and `revision`), `state` (`verified`, `unverified` or `none`), `date` and `release`.                        |
| `views`      | Each planned view in the plan's order, with what the plan put in it, by id, and the number of the plate that draws it: `id`, `title`, `question`, `summary`, `origin`, `tiers` (`id`, `label` and `members`), `components`, `groups`, `relations` and `plate`.          |
| `statements` | Every statement of the model, each type in the model's order: `components`, `relations` and `groups`.                                                                                                                                                                   |
| `catalogue`  | Each property of a fact once, as the layer of facts lists it, with the kinds of its subject, its unit, what it is measured from and, for the age bands, their spans in seconds: `property`, `of`, `unit`, `origin` (`measured`), `from` (`pin` or `model`) and `spans`. |
| `facts`      | Every fact the build holds, in the order the layer of facts hands them over.                                                                                                                                                                                            |
| `evidence`   | Every path the work rests on, once, in path order.                                                                                                                                                                                                                      |
| `guide`      | The guide's record, when the model names a guide.                                                                                                                                                                                                                       |
| `overview`   | When the model states an overview and the edition is built, the overview's page, drawn from the model's statement in Typst rather than by the publisher's drawing: `statement`, `images` (`width` and `file`) and `face` (`false`).                                     |
| `plates`     | Each plate's record, by number; an empty list when no edition is built.                                                                                                                                                                                                 |
| `media`      | The media the build delivers.                                                                                                                                                                                                                                           |

<!-- end of members -->

The data and the reader file belong to the delivery's format and carry no version of their own.

## The statements

<!-- component: written from src/pinned/data.schema.json by tools/docs/references.mjs; do not edit -->

A component of `statements`, as its author stated it.

| Key       | Holds                                                    |
| --------- | -------------------------------------------------------- |
| `id`      | The component's id.                                      |
| `label`   | Its label.                                               |
| `kind`    | Its kind, when the model gives it one.                   |
| `status`  | Its status, when the model states one.                   |
| `details` | Its details, each name the model states with its values. |
| `files`   | The files it claims.                                     |
| `origin`  | Who made the statement, always its author: `stated`.     |

<!-- end of component -->

<!-- relation: written from src/pinned/data.schema.json by tools/docs/references.mjs; do not edit -->

A relation of `statements`, as its author stated it.

| Key       | Holds                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------- |
| `id`      | The relation's id.                                                                                  |
| `from`    | The id of the component it leaves.                                                                  |
| `to`      | The id of the component it reaches.                                                                 |
| `label`   | Its label.                                                                                          |
| `text`    | The relation as a reader reads it, `<from> —<label>→ <to>`, with the two ids and the model's label. |
| `status`  | Its status, when the model states one.                                                              |
| `details` | Its details, each name the model states with its values.                                            |
| `files`   | The files it cites.                                                                                 |
| `origin`  | Who made the statement, always its author: `stated`.                                                |

<!-- end of relation -->

<!-- group: written from src/pinned/data.schema.json by tools/docs/references.mjs; do not edit -->

A group of `statements`, as its author stated it.

| Key       | Holds                                                |
| --------- | ---------------------------------------------------- |
| `id`      | The group's id.                                      |
| `label`   | Its label.                                           |
| `members` | The ids of its members.                              |
| `origin`  | Who made the statement, always its author: `stated`. |

<!-- end of group -->

A statement that no view selects stands in `statements` and in no view's lists.

## The facts

<!-- fact: written from src/pinned/data.schema.json by tools/docs/references.mjs; do not edit -->

A fact of `facts`: one value of one property the catalogue lists, of one subject.

| Key        | Holds                                                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `property` | The property, one the data's `catalogue` lists.                                                                                                       |
| `of`       | Its subject, the edition, a part, a group, a relation or a view by its id, or a file by its path with the part that owns it: `kind`, `id` and `part`. |
| `value`    | Its value, in its unit: a number, a text, a list, or null where the build found none, as a release at a pin no release is tagged at.                  |
| `unit`     | Its unit, the one the catalogue gives the property.                                                                                                   |
| `origin`   | Whether the publisher measured the value or the model's author stated it: `measured` or `stated`.                                                     |
| `from`     | For a measured value, what it was measured from, the checkout at the pin or the model alone: `pin` or `model`.                                        |

<!-- end of fact -->

The facts of a relation include those of an overview's line that stands for several relations, under the line's own
id, which a plate's face carries too. Without a checkout the data holds what the model alone gives: each relation's
cited files, each view's hub, each part's claims as their author wrote them, a directory as a directory, as its
`owned-files` with the origin `stated`, and the number of declared paths as `files-read`. It then holds no bytes,
share, age band, date or release, and `pin` has no `date`.

## The evidence table

<!-- evidence: written from src/pinned/data.schema.json by tools/docs/references.mjs; do not edit -->

A row of `evidence`: one path the work rests on, a file the model claims or cites, as the binding recorded it, or a path only the guide cites.

| Key         | Holds                                                                                                                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`      | The path in the repository.                                                                                                                                                                                      |
| `state`     | Whether the build read the path at the pin: `verified` or `unverified`.                                                                                                                                          |
| `sha256`    | The file's digest at the pin; only on a verified row.                                                                                                                                                            |
| `bytes`     | Its size at the pin; only on a verified row.                                                                                                                                                                     |
| `changed`   | The UTC date of its last change at the pin; only on a verified row.                                                                                                                                              |
| `owner`     | The component whose claim holds it, when one does.                                                                                                                                                               |
| `relations` | The ids of the relations that cite it.                                                                                                                                                                           |
| `ranges`    | Each citation of the guide in it, in the guide's order, with the first and last line it cites, absent for a whole file, and where it is cited, as `@source <id>` or a diagram node's place: `lines` and `where`. |

<!-- end of evidence -->

With `--repo`, the paths only the guide cites are read at the pin through Git, which is only read, so that their
rows carry a digest, a size and a date too. They join no record of the binding: the number of files read, which the
print edition prints, counts what the model claims and cites and is the same with and without a guide. Without a
checkout every row is `unverified`.

The table refuses nothing; the reading of the guide does. With `--repo`, a build or a check refuses with
`guide_file_missing` a guide's citation of a path that is no file at the model's revision, whichever media it delivers
and before a view is planned: a delivery names as evidence only what the build read at the pin. The refusal names the
guide, and each of its problems the place of a citation, as `@source <id>` or a diagram's file and the JSON pointer of
the node's source, and the path. A path the build read is `verified`; no row says that a path was looked for and not
found. Without `--repo` nothing is read and nothing is known to be absent: the same model builds, and the path's row
is `unverified` like every other. Whether a cited range lies within its file is Archify's check, when the page is
built from the guide with `--repo` and a model that names its repository's URL and revision.

The model and the guide gain no field for the table: it is gathered from what the build reads.

## A plate's record and face

<!-- plate: written from src/pinned/data.schema.json by tools/docs/references.mjs; do not edit -->

A plate of `plates`, as the drawing reports it.

| Key       | Holds                                                                                                                                                                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `number`  | The plate's number, counted from 1 in reading order.                                                                                                                                                                                                     |
| `views`   | The ids of the views it draws.                                                                                                                                                                                                                           |
| `page`    | Its page in the PDF, counted from 1. Only a build that typesets the edition knows it; a check reports the record without it.                                                                                                                             |
| `images`  | Its page's images at each width: `width` and `file`.                                                                                                                                                                                                     |
| `figures` | The two files of its figure set alone, each with its format, the file's extension: `format` and `file`.                                                                                                                                                  |
| `frame`   | Where the figure stands on its page, in points from the page's top left corner, and the scale of its drawing space in pixels per point: `x`, `y`, `width`, `height` and `pixelsPerPoint`.                                                                |
| `scales`  | The scales its strips are drawn on, an empty list where the edition draws none, each as the property drawn with its unit, the value of the edition's largest part and the length in px that value is drawn at: `property`, `unit`, `value` and `length`. |
| `face`    | What the plate drew, by id.                                                                                                                                                                                                                              |

<!-- end of plate -->

An element at `x`, `y` of the drawing space stands at `frame.x + x / pixelsPerPoint` and
`frame.y + y / pixelsPerPoint` points on the page, and a point is `width / 1600` px in an image of that width.

<!-- face: written from src/pinned/data.schema.json by tools/docs/references.mjs; do not edit -->

What a plate drew, by id, in the numbers of its drawing space, which its SVG is written from. A face repeats no value of a fact: it names the element, and `facts` holds its values.

| Key          | Holds                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `components` | Each component drawn, with the box it is set in: `id` and `box` (`x`, `y`, `width` and `height`). |
| `groups`     | Each group drawn, with the box it is set in: `id` and `box` (`x`, `y`, `width` and `height`).     |
| `relations`  | Each relation drawn, in the order first stroked.                                                  |

<!-- end of face -->

<!-- face-relation: written from src/pinned/data.schema.json by tools/docs/references.mjs; do not edit -->

A relation a plate drew: a relation of the model, or an overview's line that stands for several of them.

| Key         | Holds                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`        | The relation's id, or the line's.                                                                                                               |
| `from`      | The id of the end it leaves.                                                                                                                    |
| `to`        | The id of the end it reaches.                                                                                                                   |
| `text`      | For a relation of the model, its text, as the data's statement writes it.                                                                       |
| `relations` | For an overview's line, the ids of the relations of the model it stands for, in place of a text.                                                |
| `segments`  | Every stretch the relation is stroked on, in the order drawn, each a list of points `[x, y]`, so two relations that share a trunk both list it. |
| `label`     | The box of its label, or null when the figure sets none: `x`, `y`, `width` and `height`.                                                        |

<!-- end of face-relation -->

On a plate drawn as a matrix a relation is stroked on no line: its `segments`
hold one stretch, the closed outline of its cell, and its `label` is the box of
the label as the matrix sets it, the head's box when a row or a column says the
label once for all its cells.

The face is what the drawing reports as it draws, and no copy of the view. The overview's page has no face.

## The guide's record

<!-- guide: written from src/pinned/data.schema.json by tools/docs/references.mjs; do not edit -->

The guide a model names, as `guide` records it: its draft, the files it names, whether its sources were verified, and its diagrams matched to the model.

| Key       | Holds                                                                                                                                                                                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`    | The draft's path, as the model names it.                                                                                                                                                                                                                                            |
| `sha256`  | The draft's SHA-256.                                                                                                                                                                                                                                                                |
| `files`   | The files the draft names, each with its SHA-256: `name` and `sha256`.                                                                                                                                                                                                              |
| `sources` | Whether Archify verified the guide's sources at the model's revision, as it does when the page is built from the guide with a checkout for a model that names its repository's URL and revision, or they stand as declared, as when no page is built: `verified` or `declared`.     |
| `figures` | The guide's diagrams matched to the model: `state` (`verified` or `unverified`), `nodes` (`file`, `id` and `components`), `connections` (`file`, `id`, `from`, `to` and `relations`) and `unmatched` (`nodes` (`file` and `id`) and `connections` (`file`, `id`, `from` and `to`)). |

<!-- end of guide -->

A model that names a guide has it read for every medium, since its draft ends the reader file and its citations are
evidence: a guide that is absent refuses the build or the check with `guide_missing`, with `--media edition` too.

The nodes of a guide's diagrams carry their author's ids, so a node is matched to the components that own the files
it cites, by the verified rows of the evidence table, and a connection whose two ends are matched to the relations of
the model between their components, whichever way they run. A match refuses nothing, and neither does its absence;
without a checkout no file has an owner and nothing is matched.

## The reader file

`<model id>.md` is a Markdown document for a reader at a viewer and for an agent, written in the model's language
from the data and from the guide as Archify reads it. The data is the one machine source: ids, paths, property names,
values and units are written as code, as the data holds them, and every other word is in the model's language. Its
parts, in order:

1. The work's title, one sentence naming the work, its language and the publisher's version, and a head: the pin
   with its state and, when measured, its date and release; the model's file, version, size and SHA-256; the data's
   file and SHA-256; the numbers of components, relations and groups with the numbers cited, unchecked and uncited;
   the other files of the delivery; and the facts of the edition.
2. One paragraph that explains the words of the lines, in the model's language.
3. The model's scope and limits, then its question and summary.
4. One section for each planned view, headed by the view's question, or by its title when an earlier section
   carries the same question: its summary, a line with the view's id and, when the edition is built, its plate and
   image, the facts of the view, and one item for each statement it selects.
5. The statements no view selects.
6. What the file does not cover, and the two commands that check the delivery again.
7. When the model names a guide, one heading and the guide as prose: its answer, then a section for each panel with
   its paragraphs, terms, tables and steps. A figure is named by its title and its file, and what it says follows as
   text: its parts or states as a list, each line between two under the one it leaves; a flow's steps, a sequence's
   messages and a life's main path numbered; entities and types with their fields; a tree nested; dates and spans
   as tables. Steps that walk a figure, each naming one of its items, stand with those items once, in the steps'
   order. Citations, the guide's and those of a figure's items, are footnotes, several at one place in ascending
   order, after one sentence naming the pin their lines are those of.

Each line of the head is a list item: the publisher's word for it, a colon, and its fields parted by `·`, the
other files of the delivery by commas. A view's line is
`` - <view> `<id>` · <plate> <number> · `<image>` · `<figure PNG>` · `<figure SVG>` ``, and `` - <view> `<id>` ``
when no edition is built.

A statement's item is ``- <type> `<id>`<colon><text> · <fields>``. The type is the model's language's word for a
component, a group or a relation. The text is a component's or a group's label, with a component's kind, or a
relation's `<from> —<label>→ <to>`. The fields are its status when stated, its origin and its files or members.
Beneath it stand each detail the model states and its facts. A statement stands with its full item once, in the
first view that selects it, and as ``- <type> `<id>` `` in each later view. A field without a value is not written.

A line of facts is ``- <origin><colon>`<property>` `<value> <unit>` · …``, its origin in the model's language: a
fact the author stated, one the publisher measured at the pin, or one it counted from the model. Under an item it
states facts of that statement; at the margin, facts of the edition in the head or of the view named above it. A
list is stated by its length, a value that is no number without its unit, and the facts of single files stand in
the data alone.

The head states the digest of the data and cannot state the manifest's, which seals the reader file.

## What is held before anything is written

`archpub check` and `archpub build` gather the data and the reader file and hold them to the model and to each
other. Each difference is a refusal that names what differs: in the reader file's items (`reader_ids_differ`), in a
plate's face (`data_face_differs`), or in a statement or property a projection names (`projection_fact_unknown`); the
[refusals reference](refusals.md) gives each code's meaning. A refused build leaves no output.

The diagrams of the page the publisher generates are read back to the model's ids and held to the data's statements.
A guide is its author's document: its diagrams are matched and their unmatched members counted, as said above, and
are held to nothing.

The manifest names the data and the reader file with their counts, and `archpub check --json` carries the same
counts under `data`: see [the delivery](operations.md#the-delivery).
