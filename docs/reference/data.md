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

The data is `<model id>.json` and the print edition `<model id>.pdf`, so a model whose id is `model`, `manifest`,
`acceptance` or `colophon` would give two files of its delivery one name. `archpub check` and `archpub build` refuse
it with `delivery_name_taken` straight after reading the model, and name the file that would be two things.

## The data

The members of `<model id>.json`, in the order the file holds them. This table and the evidence table's are the
format's statement of its members and of an evidence row's keys, and the publisher's tests hold the data to them,
in their order.

| Member       | Holds                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `delivery`   | The delivery's `format` and `version`, as the manifest states them.                                                                                                      |
| `publisher`  | Its `name` and `version`.                                                                                                                                                |
| `work`       | The model's `id`, `locale`, `title`, `question`, `summary`, `scope`, `limits`, `editors`, `license` and `coverage`.                                                      |
| `model`      | The delivered model's `file`, `sha256`, `bytes`, `format` and `version`.                                                                                                 |
| `pin`        | The `repository` the model declares; `state`, the binding's `verified`, `unverified` or `none`; `date` and `release` when a checkout was read.                           |
| `views`      | Each planned view, in the plan's order: `id`, `title`, `question`, `summary`, `origin`, `tiers`, the ids of its `components`, `groups` and `relations`, and its `plate`. |
| `statements` | `components`, `relations` and `groups`, in the model's order.                                                                                                            |
| `catalogue`  | Each property of a fact once: `property`, `of` (the kinds of its subject), `unit`, `origin`, `from`, and for the age bands their `spans` in seconds.                     |
| `facts`      | Every fact the build holds, in the order the layer of facts hands them over.                                                                                             |
| `evidence`   | [The evidence table](#the-evidence-table), in path order.                                                                                                                |
| `guide`      | [The guide's record](#the-guides-record), when the model names a guide.                                                                                                  |
| `overview`   | When the model states an overview and the edition is built: its `statement`'s SHA-256, its `images` and `face: false`, since its marks are tied to no statement.         |
| `plates`     | [Each plate's record](#a-plates-record-and-face), by number; an empty list when no edition is built.                                                                     |
| `media`      | The media the build delivers.                                                                                                                                            |

A component holds its `id`, `label`, `kind`, its `status` when the model states one, its `details`, each name with
its values, the `files` it claims and its `origin`. A relation holds its `id`, `from`, `to`, `label`, its `text`,
written `<from> —<label>→ <to>` with the two ids and the model's label, its `status` when stated, its `details`, the
`files` it cites and its `origin`. A group holds its `id`, `label`, `members` and `origin`. The origin of every
statement is `stated`: its author wrote it. A view's `plate` is the number of the plate that draws it and is absent
when no edition is built; a statement that no view selects stands in `statements` and in no view's lists.

A fact is `{ property, of, value, unit, origin, from }`. Its subject `of` is `{ "kind": "edition" }`, a part, group,
relation or view as `{ "kind", "id" }`, or a file as `{ "kind": "file", "id", "part" }` with its path and the part
that owns it. Its `origin` is `measured`, with `from` naming the `pin` or the `model` it was measured from, or
`stated`, without `from`. The facts of a relation include those of an overview's line that stands for several
relations, under the line's own id, which a plate's face carries too. Without a checkout the data holds what the
model alone gives: each relation's cited files, each view's hub, each part's claims as their author wrote them, a
directory as a directory, as its `owned-files` with the origin `stated`, and the number of declared paths as
`files-read`. It then holds no bytes, share, age band, date or release, and `pin` has no `date`.

A key the data does not hold means that the build did not hold the value; none is written as zero, null or a
default. The data and the reader file belong to the delivery's format and carry no version of their own. A later
release of the same delivery version may add a member, a key of an entry or a value of a list; it removes no key
written here and changes the meaning of none. A reader ignores a key it does not know.

## The evidence table

`evidence` holds every path the work rests on once, in path order: each file the model claims or cites, as the
binding recorded it, and each path only the guide cites.

| Key         | Holds                                                                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`      | The path in the repository.                                                                                                                                                            |
| `state`     | `verified` when the build read the path at the pin, `unverified` otherwise.                                                                                                            |
| `sha256`    | The file's digest at the pin; only on a verified row.                                                                                                                                  |
| `bytes`     | Its size at the pin; only on a verified row.                                                                                                                                           |
| `changed`   | The UTC date of its last change at the pin; only on a verified row.                                                                                                                    |
| `owner`     | The component whose claim holds it, when one does.                                                                                                                                     |
| `relations` | The ids of the relations that cite it.                                                                                                                                                 |
| `ranges`    | Each citation of the guide in it, in the guide's order: `lines` as first and last line, absent for a whole file, and `where` it is cited, as `@source <id>` or a diagram node's place. |

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

Each entry of `plates` holds the plate's `number`, its `views`, its `images` with their `width` and `file`, its
`figures`, the two files of its figure set alone, with their `format` (`png`, `svg`) and `file`, and:

- `page`: the plate's page in the PDF, counted from 1. Only a build that typesets the edition knows it; a check
  reports the record without it.
- `frame`: where the figure stands on its page, as `x`, `y`, `width` and `height` in points from the page's top left
  corner, and `pixelsPerPoint`, the scale of the figure's drawing space. An element at `x`, `y` of the drawing space
  stands at `frame.x + x / pixelsPerPoint` and `frame.y + y / pixelsPerPoint` points on the page, and a point is
  `width / 1600` px in an image of that width.
- `scales`: where the edition draws strips, the property `owned-bytes` with its `unit`, the `value` in bytes of the
  edition's largest part and the `length` in px it is drawn at; an empty list where it draws none.
- `face`: what the plate drew, by id.

A face holds `components`, `groups` and `relations`. A component or a group is its `id` and its `box`, as `x`, `y`,
`width` and `height` in the drawing space. A relation is its `id`, the ids of its two ends as `from` and `to`, its
`segments` and its `label`, the box of its label or `null` when the figure sets none, and either its `text`, as the
data's statement writes it, or, for an overview's line that stands for several relations of the model, the ids of
those as `relations`. `segments` is a list of stretches, each a list of points, in the order they are drawn: every
stretch the relation is stroked on, so two relations that share a trunk both list it. The numbers are the ones the
plate's SVG is written from. A face repeats no value of a fact: it names the element, and `facts` holds its values.

The face is what the drawing reports as it draws, and no copy of the view. The overview's page has no face.

## The guide's record

`guide` holds the draft's `path` and `sha256`, the `files` the draft names, each with its `name` and `sha256`,
`sources` and `figures`. A model that names a guide has it read for every medium, since its draft ends the reader
file and its citations are evidence: a guide that is absent refuses the build or the check with `guide_missing`,
with `--media edition` too.

`sources` is `verified` when the page was built from the guide with a checkout, for a model that names its
repository's URL and revision, so that Archify verified the guide's sources at that revision, and `declared`
otherwise; when no page is built, as with `--media edition`, it is `declared`.

`figures` matches the guide's diagrams to the model. The nodes of a guide's diagrams carry their author's ids, so a
node is matched to the components that own the files it cites, by the verified rows of the evidence table, and a
connection whose two ends are matched to the relations of the model between their components, whichever way they
run. It holds `state`, `verified` when the files were read at the pin and `unverified` otherwise; `nodes`, each with
its `file`, `id` and `components`; `connections`, each with its `file`, its `id` when it has one, `from`, `to` and
`relations`; and `unmatched`, the `nodes` and `connections` with no match. A match refuses nothing, and neither does
its absence; without a checkout no file has an owner and nothing is matched.

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
