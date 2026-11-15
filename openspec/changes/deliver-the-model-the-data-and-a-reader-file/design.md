## Context

See [proposal.md](proposal.md). This Change serves the queue item `reader-and-data`, the second Change of step 3 of
the design kept in `openspec/changes/archive/2026-11-14-queue-the-roadmap-and-name-roles/design.md`, called the
design below. The design's row reads: "adds `model.json`, `<id>.json`, the data face and, as E1 decides, the reader
file to the delivery; the evidence table is gathered on the output side only and the model is untouched; the
manifest version rises once. From here on the figure-reading items are generated from the data face". Its
acceptance is "the reader file's statement ids equal the model's and every plate's data face equals its view's
statement set, mechanically; the figures in the explainer script are checked against the model", and its stop line
"If the layout or typesetting engine would need rewriting, stop and re-estimate".

It starts from the state `fact-layer` leaves: a unit `src/facts` that holds every measured fact as a value with its
property, subject, unit, origin and what it was measured from, a catalogue of eleven properties, and plates, the
edition's record and the page reading that layer.

What a delivery holds today (`src/build.mjs`, `buildDelivery`): `<model id>.pdf`, `<model id>.html`, `images/` and
`manifest.json`, and after `archpub accept` the three files it writes. The manifest is version 7
(`DELIVERY_VERSION` in `src/build.mjs`). It already carries most of what the pinned edition is made of, in three
places: `sources.records` (the binding's record of every claimed and cited file), `evidence` (the details, status
and files of every component and relation) and `views`. The guide's citations are read by `guideCitations` in
`src/map/guide.mjs` for the re-pin worklist and reach a delivery only as the page renders them. The model's bytes
are attached inside the PDF.

What the passing arm of the reader experiment was given (`trials/reader/protocol.md` of the publications): a room
with `repo/`, the repository at the pin, and `work/`, "the English work as published at that pin, its `model.json`,
`overview.typ` and `guide/`". The record of the runs keeps each subject's answer, tool calls and tokens, and does
not keep which files a subject opened.

## Goals / Non-Goals

**Goals:**

- Every delivery holds the model, the pinned edition as data and a reader file, each deterministic, each listed in
  the manifest and each part of `archpub compare`.
- The reader file holds what the passing arm's readers were given, as far as a build has it as text, and every
  statement of the model under its id.
- One evidence table, written once in a delivery.
- A plate's data face is taken from the drawing and compared with the plan, so the comparison can fail.
- The data and the reader file take the content of `model-four` without a second change of format.

**Non-Goals:**

- Any field in the model: questions, written statements, line ranges, strength, basis category (`model-four`).
- Any change to what a plate, the print edition or the page shows, and with it alternative text, marks that link
  to their statement and the round trip from the PDF's text layer (`blocks-by-question`).
- The single anatomy and the levels of detail (`one-anatomy`).
- The record of who accepted what, and the merging of manifest and acceptance (`roles-and-records`).
- A fixed address for the reader file and the entry line in each described repository (`six-works`).
- A new format with a version of its own, a service, a second command, or an option that leaves the files out.

## Decisions

### The form is argued from what arm B's readers had, and the file says where it goes beyond that

Arm B's room held three things beside the repository: the model as its author wrote it, the guide's directory, and
the overview's composition. The delivery now holds:

| Given in arm B                                     | In the delivery                                        |
| -------------------------------------------------- | ------------------------------------------------------ |
| `model.json`                                       | `model.json`, the same bytes                           |
| `guide/guide.archify.md`                           | carried whole as the last part of the reader file      |
| the diagram documents the guide names, in `guide/` | not as text; their citations are in the evidence table |
| `overview.typ`                                     | not as text; the reader file names it as not covered   |

The reader file also holds what no arm tested: the statements arranged by view under each view's question, one line
each; the facts the tool measured at the pin; ownership and digests resolved at the pin; counts; and how to check
again. Whether that arrangement helps a reader more than the plain model and guide text is what the design's rerun
measures ("reader file against arm B"), and the design names the fallback: "its minimum form, placed in the
delivery and listed in the manifest". This Change shapes the file so that the fallback is a deletion: the minimum
form is the head and the carried guide text beside `model.json`, both of which are written here already.

Rejected: a reader file generated from the model alone, as the design's paragraph on the reader file reads when
taken by itself. It would drop the guide's text, which arm B's readers had beside the model, and the rerun would
then compare a file with less content against arm B. Rejected also: delivering nothing but the model and the
guide, which the design gives only as the outcome when arms B and D both fail.

### Three files at the top of the delivery, named as the design names them

| File              | What it is                 | Format                                             |
| ----------------- | -------------------------- | -------------------------------------------------- |
| `model.json`      | the model the build read   | the author's bytes, unchanged                      |
| `<model id>.json` | the pinned edition as data | JSON, UTF-8, two-space indent, one final newline   |
| `<model id>.md`   | the reader file            | Markdown, UTF-8; it ends as the guide's draft ends |

They are written in every delivery, whichever media it carries. `model.json` is `loaded.content` of
`src/model/load.mjs`, so its digest in the manifest's `artifacts` equals `manifest.model.sha256`, which a test
holds. Its `overview` and `guide` name files beside the author's model that the delivery does not hold; the
delivered model is a record and no input to build from.

A model id is any name of the pattern `^[a-z0-9][a-z0-9._-]{0,127}$`, so `<model id>.json` can be `model.json`,
`manifest.json` or `acceptance.json`, and a model whose id is `colophon` would name its print edition
`colophon.pdf`, which `accept` writes. Nothing refused such an id: a model named `colophon` built, and `verify` and
`accept` then reported `delivery_changed`. A build and a check now refuse those four ids with
`delivery_name_taken`, straight after the model is read, naming the file and the two things it would be. The
model's own validation is untouched, since the model's format does not change here; the rule is the delivery's.
Rejected: other names for the new files (`<id>.data.json`, `<id>.model.json`), which leave the design's names and
still need a rule for `manifest`; and a directory `data/`, which hides the reader file one level down from where a
reader lands.

Rejected: a normalised model in place of the author's bytes. The print edition already attaches the author's bytes
and prints their digest, and two forms of one model in a delivery would need a rule for which one is the model.

### The data is the identity projection: what the build holds, written once, in the order it holds it

`<model id>.json` has these members, in this order. Keys stand in a fixed order and lists in one order each, so two
builds of one state give the same bytes: the work's fields and the statements in the model's order, the views in
the plan's, the catalogue and the facts in the layer's, the evidence by path and the plates by number.

| Member       | Holds                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------ |
| `delivery`   | the delivery's format and version, as the manifest states them                                   |
| `publisher`  | name and version                                                                                 |
| `work`       | id, language, title, question, summary, scope, limits, editors, licence, coverage                |
| `model`      | `file`, digest, size, format and version of the model                                            |
| `pin`        | the declared repository; the binding's state; date and release when measured                     |
| `views`      | each planned view: id, title, question, summary, origin, tiers, the ids it selects, its plate    |
| `statements` | `components`, `relations`, `groups`: each with its id, text, details, status when stated, origin |
| `catalogue`  | the properties of the layer: name, kinds of subject, unit, origin, measured from, spans          |
| `facts`      | every fact of the layer: property, subject, value, unit, origin, measured from                   |
| `evidence`   | the evidence table                                                                               |
| `guide`      | the guide's path, digest and named files, whether its sources were verified, its matched figures |
| `overview`   | the overview's composition and images, and `face: false`                                         |
| `plates`     | each plate: number, views, page, images, frame, scales, face                                     |
| `media`      | the media the build delivered                                                                    |

A relation's text is written `source —label→ target` with the two ids and the model's label, in `statements` and in
every face. Every statement's `origin` is `stated`: the author wrote it. A fact's origin is the layer's. A member a
build could not measure is absent, as the layer holds it: without a checkout the data has no digest, size, date or
release, and never a zero in their place. `guide` stands when the model names a guide and `overview` when the
edition is built for a model that names a composition.

A fact is written as the layer hands it over, with the field names `fact-layer` landed: `property`, `of`, `value`,
`unit`, `origin` and, when measured, `from`. Its subject `of` is `{ kind: "edition" }`, a part, group, relation or
view as `{ kind, id }`, or a file as `{ kind: "file", id, part }`. This Change adds no fact, and the writer refuses
a fact of a property the catalogue lacks. A test compares the data's `facts` with the layer's own list, both ways.
Without a checkout the layer holds each part's claims as their author wrote them, a directory as a directory, as
its `owned-files` with the origin `stated`, and the data writes that as it writes every other fact. The facts of an
overview's line that stands for several relations stand under the line's own id, `overview-N`, which is the id the
face gives that line and no statement of the model.

Three things the first draft of this design did not list were added while the data was built, each a value the
build already held: `work.coverage`, which the reader file's last part needs for the paths the scope excludes;
`spans` on the catalogue's entry for the age bands; and the member `overview`.

The data and the reader file belong to the delivery's format and carry no version of their own. The design's budget
gives the manifest two rises through the roadmap and `model-four` none, so the data must take that item's content
by addition. The rule, held by a requirement: a later release may add a member, a key of an entry or a value of a
list; it changes the meaning of no key written here and removes none without a rise of the delivery's version; a
reader ignores a key it does not know; an absent key means the build does not hold it. Under that rule `model-four`
adds `questions` beside `views`, `statements.texts` beside the three lists, and `lines`, `strength` and `basis` on
the entries of `evidence` and on a statement's citations.

Rejected: a format name and version for the data, which is a fourth format where the design budgets three.
Rejected: naming the member for views `questions` now. The model has views that carry a question; a question that
selects statements by id and answers entries of the question table is what `model-four` defines.

Worked example, from the work `aigw-client` in English (`publications/aigw-client/en/model.json` of the
publications; 21 components, 40 relations, 6 views). Ids, labels, paths and the model's digest and size are the
work's own; the values marked `…` and every number of a fact, a digest of a file, a date and a count are
placeholders.

```json
{
  "delivery": { "format": "architecture-publisher.delivery", "version": 8 },
  "publisher": { "name": "architecture-publisher", "version": "…" },
  "work": {
    "id": "aigw-client",
    "locale": "en",
    "title": "AIGW Client Projection",
    "question": "How does AIGW turn one reviewed configuration into guarded client files in every admitted client?"
  },
  "model": {
    "file": "model.json",
    "sha256": "4b8d6e30229fbf56adce893fb887c21062e7d48e6951ff563cc1a10c6de96da5",
    "bytes": 36083,
    "format": "architecture-publisher.model",
    "version": 3
  },
  "pin": {
    "repository": { "name": "aigw-cli", "revision": "ed8b2fed94ef569f0f2d7fdfd2ec3259c65e37e2" },
    "state": "verified",
    "date": "…",
    "release": "…"
  },
  "views": [
    {
      "id": "overview",
      "question": "How does one reviewed configuration become guarded client files in each admitted client?",
      "origin": "declared",
      "components": [
        "commands",
        "use-cases",
        "synchronization",
        "configuration-store",
        "adapter-seam",
        "…"
      ],
      "groups": [],
      "relations": ["synchronization-configuration-store", "synchronization-adapter-seam", "…"],
      "plate": 1
    }
  ],
  "statements": {
    "components": [
      {
        "id": "synchronization",
        "label": "Synchronization",
        "kind": "coordinator",
        "details": {
          "converges": ["client selections and their client files"],
          "commits": ["one configuration transition with guarded compensation"]
        },
        "files": ["internal/app/synchronization/"],
        "origin": "stated"
      }
    ],
    "relations": [
      {
        "id": "synchronization-configuration-store",
        "from": "synchronization",
        "to": "configuration-store",
        "label": "persists",
        "text": "synchronization —persists→ configuration-store",
        "details": {},
        "files": ["internal/app/synchronization/preview.go", "…"],
        "origin": "stated"
      }
    ],
    "groups": []
  },
  "facts": [
    {
      "property": "owned-bytes",
      "of": { "kind": "part", "id": "synchronization" },
      "value": 0,
      "unit": "bytes",
      "origin": "measured",
      "from": "pin"
    },
    {
      "property": "cited-files",
      "of": { "kind": "relation", "id": "synchronization-configuration-store" },
      "value": 5,
      "unit": "files",
      "origin": "measured",
      "from": "model"
    }
  ]
}
```

The second fact's value is real: the relation names five files in the model. A fact whose value is a list, such as
a part's `owned-files`, is stated in the reader file by its length.

### One evidence table, keyed by path, gathered where the build already reads

Evidence is in four places today: a component's and a relation's `files` in the model; the binding's records, which
resolve them at the pin (`src/sources/bind.mjs`); the guide's `@source` lines and the sources of its diagrams'
nodes, with line ranges (`guideCitations` in `src/map/guide.mjs`); and the manifest, which repeats the first two as
`evidence` and `sources.records`. The print edition has no source table yet.

The delivery writes one table, `evidence` in the data. Each path stands once, in path order:

- `path`, and `state`: `verified` when the build read it at the pin, `unverified` otherwise.
- `sha256`, `bytes` and `changed`, the date of its last change at the pin, when verified.
- `owner`, the component whose claim holds it, when one does.
- `relations`, the ids of the relations that cite it.
- `ranges`, each range the guide cites in it: `lines` as first and last line, or none for the whole file, and
  `where` it is cited (`@source readme-what`, `parts.architecture.json/components/1/sources/0`).

Its rows are the binding's records, plus the paths only the guide cites, which the binding does not read today.
With a checkout those are read at the pin by `readAtPin` in `src/sources/bind.mjs`, with Git only read, so that
every such row has a digest. They do not join the binding's records: the fact `files-read`, which the edition
prints, counts what the model claims and cites and stays as it is.

The table refuses nothing; the build's reading of the guide does. With a checkout, a path the guide cites that is no
file at the pin refuses the build or the check with `guide_file_missing`, whichever media it delivers, as the decision
"A guide's citation of a file absent at the pin is refused" below says, so no row of a path the build looked for and
did not find is written. Without a checkout nothing is read and every row is `unverified`. Whether a cited range lies
within its file is checked by Archify when the page is built, as today; this Change adds no refusal for it.

The model and the guide are read and not changed. Line ranges enter on the output side only, from the guide; a
statement of the model cites paths, as the model's format allows.

The manifest stops repeating the table. In version 8 it keeps `sources.state` and the count of records, as
`archpub check --json` already reports them, and loses `sources.records` and `evidence`. Only
`tests/delivery.test.mjs` and `tests/facts-pin.test.mjs` read either, and both now read the data. Rejected: keeping
both in the manifest and writing them again in the data, which states one fact in two files of one delivery and
leaves a reader to wonder which one binds. Rejected: leaving the table in the manifest and pointing the data at it,
which makes the build record the carrier of content and leaves the data incomplete. The design's sentence is "There
is one evidence table; `files`, `@source` and the source table all point to it".

This is not the `sources` register that release 0.8.0 removed. That register was written by the author into the
model, with ids and digests, and made half of each model (`openspec/changes/archive/2026-11-04-own-files-by-path`).
This table is written by the build from what it reads, and no author sees or keeps it. The Change of `fact-layer`
holds no note on that removal, so the comparison rests on that archive's proposal alone.

```json
"evidence": [
  {
    "path": "README.md",
    "state": "verified",
    "sha256": "…",
    "bytes": 0,
    "changed": "…",
    "relations": [],
    "ranges": [{ "lines": [3, 6], "where": "@source readme-what" }]
  },
  {
    "path": "internal/app/synchronization/transaction.go",
    "state": "verified",
    "sha256": "…",
    "bytes": 0,
    "changed": "…",
    "owner": "synchronization",
    "relations": ["synchronization-adapter-seam", "synchronization-configuration-store"],
    "ranges": [{ "lines": [41, 119], "where": "parts.architecture.json/components/1/sources/0" }]
  }
]
```

The paths, ids, ranges and places are the work's own; `README.md` lies outside the model's coverage scope, so no
component owns it.

### A plate's data face lives in the data, and is what the drawing reports

Each entry of `plates` holds the plate's number, its views, its page in the PDF, its images with their widths, and:

- `frame`: where the figure stands on its page, in points from the page's top left corner, with its width and
  height, and `pixelsPerPoint`, the scale of the figure's drawing space (1.5 in `src/house.json`). An element at
  `x` in the drawing space stands at `frame.x + x / pixelsPerPoint` points on the page, and at that many points
  times `width / 1600` pixels in an image of that width.
- `scales`: for each property the plate draws on a scale, the property, its unit, the value at the scale's end and
  the length it is drawn at, as the style records them today (`longest`, the largest part's bytes); an empty list
  for a plate of cards.
- `face`: `components`, `groups` and `relations`. A component or group entry holds its `id` and its `box` in the
  drawing space. A relation entry holds its `id`, the ids of its two ends, its `segments` and its `label`, the box
  of its label or `null` when the figure sets none, and either its `text` as `source —label→ target` or, when the
  overview draws several relations as one line, the `relations` it stands for.

`segments` is a list of point lists: every stretch the relation is stroked on, in drawing order. The first draft
had one list `points`; one relation can be stroked on a trunk it shares with others and on a branch of its own, so
each relation lists the trunk too.

The numbers are written as the plate's SVG writes them. A fact's value is not repeated in the face: the face names
the element and the data's `facts` hold its values.

The face is built from what `drawFigure`, the strip's drawing and `drawLines` report as they draw: each card or
strip with its id and the rectangle they set, each stroked path with its relations and its points, and each label
with its relations and its box. `composePlates` passes the report on with the plate, and `src/pinned/face.mjs`
turns it into the face. No layout is recomputed and nothing drawn changes.

The frame needs nothing from Typst. The house class sets a figure at the page's margin, at the body's top and as
tall as the body or, under a summary set above it, as tall as it was composed and standing on the body's bottom;
the frame repeats that arithmetic on the house's tokens, and a test holds it against the pixels of a plate's image.
The page of a plate is known only after typesetting, which hands back each plate's page; a check, which typesets no
edition, reports faces without pages.

Rejected: building the face from the view and the layout, beside the drawing. The comparison "the face equals the
view's statement set" would then compare the plan with itself. Rejected: one file per plate beside its image. It
adds as many files as plates at every delivery, the invariants and the figure-reading generator would read many
files where one serves, and nothing in this item reads a face without the statements beside it. `archpub compare`
then reports a changed face as a change of `<model id>.json`, a file of the whole edition, beside the plate's
images; that is accepted.

Rejected: positions in page points alone. They would be products of a division, and the drawing space's own
numbers are exact.

The overview's page is set by hand in `overview.typ`; its marks are tied to no statement and it has no face. The
data names its composition and its images under `overview` and says `face: false`.

```json
"plates": [
  {
    "number": 1,
    "views": ["overview"],
    "page": 3,
    "images": [{ "width": 2400, "file": "images/01-overview.png" }],
    "frame": { "x": 48, "y": 112, "width": 1504, "height": 714, "pixelsPerPoint": 1.5 },
    "scales": [{ "property": "owned-bytes", "unit": "bytes", "value": 0, "length": 0 }],
    "face": {
      "components": [{ "id": "synchronization", "box": { "x": 0, "y": 0, "width": 0, "height": 0 } }],
      "groups": [],
      "relations": [
        {
          "id": "synchronization-configuration-store",
          "from": "synchronization",
          "to": "configuration-store",
          "text": "synchronization —persists→ configuration-store",
          "segments": [[[0, 0], [0, 0]]],
          "label": { "x": 0, "y": 0, "width": 0, "height": 0 }
        }
      ]
    }
  }
]
```

Every `0` is a placeholder. The frame is that of a figure that keeps the whole body: `x: 48` and `y: 112` are the
page's margin and the body's top in `src/house.json`, and a figure under a summary set above it starts lower.

### "Equals its view's statement set" is a comparison of two sets with different sources

Components, relations and groups have ids today; `model-four` gives ids to written statements, which no plate
draws. A view's statement set is what the plan put in the view: the ids of its components that are no group, of
its groups, and of its relations, an aggregated relation counting as the relations it stands for (as
`undrawnStatements` in `src/plan/views.mjs` already counts them). A face's set is what the drawing reported.

The build and the check refuse with `data_face_differs`, naming the plate and each id on one side only, when the
two sets differ, and when a relation's `text` in a face is not the `source —label→ target` of the model's relation
with that id. The tests feed the comparison a face with one relation removed, one with a part added, and one with
a relation's ends swapped, and each must be refused; a test removes one path from a drawing's report and finds the
gathering of the pinned edition refused, which a check and a build both run before anything is written.

### The reader file: generated lines by question, then the guide's text, whole

The file has these parts, in this order:

1. The title, one sentence that names the work, its language and the publisher's version, and a head: the pin with
   the binding's state; the file, version, size and digest of `model.json`; the file and digest of
   `<model id>.json`; the counts of statements; the other files of the delivery; the facts of the edition.
2. One paragraph that explains the keys.
3. Scope and limits, as the model states them.
4. The work's question and summary.
5. One section per planned view, headed by the view's question (its title when it has none or an earlier section
   carries the same question), with its summary, a line naming the view and the plate and image that draw it, the
   facts of the view, and one item per statement the view selects.
6. The statements no view selects.
7. What is not covered, and how to check again.
8. The guide's text, to the end of the file.

A statement's item is a list item: the type word `component`, `relation` or `group`; the id in backticks; a colon;
its text; then fields parted by `·`: its status when stated, its origin, and `files` with the paths it claims or
cites, or `members` for a group. Under it, indented: each detail the model states, and its facts. A relation's
text is `source —label→ target`. A statement stands with its full item once, in the first view that selects it, in
plan order; a later view names it by type and id alone. A field without a value is not written, and a text of the
model that holds a line break is folded onto one line, so no text of the model can begin a line of the file.

A line of facts is written in keys, not in translated phrases: ``- measured (pin): `owned-bytes` 3000 bytes · …``,
led by `stated`, `measured (pin)` or `measured (model)`, each fact as its property, value and unit. Under an item
it states facts of that statement; at the margin, facts of the edition in the head or of the view named above it.
A list is stated by its length, a fact without a value is not stated, and the facts of single files stand in the
data alone. The parser reads these lines back to values, which is what lets the third invariant hold the file to
the data; one translated paragraph explains the keys to a reader.

The counts in the head are three, each a predicate the build decides: `cited`, statements whose files were all
read at the pin; `unchecked`, statements with files in a build without a checkout; `uncited`, statements
that name no file (what `archpub check` lists as uncited today). They count components and relations, which alone
can name files. The design's "supported" needs a reviewer's verdict on each statement and its "silent" needs the
question table; both are absent until their items land.

The guide's text is the draft's bytes from first to last, unchanged, after one heading of the reader file, and it
is the file's last part: nothing generated follows it, so the file's tail equals the draft, a test holds its
digest to the one the build records for the guide, and the parser of statement lines stops at that heading and
cannot take a line of the guide for a statement. The design puts what is not covered and how to check again at
the end; here they end the generated parts and stand before the guide. The draft is Archify's Markdown with its
directives; it is what arm B's readers read. The part is transitional and the file says so: when `model-four`
takes the guide's sentences into the model, it shrinks. A work without a guide has no such part and says so under
"not covered". Rejected: demoting the draft's headings to fit the file's outline, after which "unchanged" would
need a rule of its own; and delivering the guide as a fourth file, which makes the set of files differ between
works with and without a guide and splits what a reader starts from.

Not carried, and named under "not covered": the text of the overview's page, which arm B's room held as
`overview.typ`, and the diagram documents a guide names, whose citations stand in the evidence table. The rerun of
the reader experiment records the difference from the tested room.

The head states the digests of the model and of the data. It cannot state the manifest's digest, which the design
asks for: the manifest lists the reader file's digest, so the file cannot hold the manifest's. The manifest seals
the reader file, the data and the model by digest, and names the reader file's size in `reader.bytes`, which is
the design's "its byte count goes into the manifest". The time of the file's writing is never printed.

How the parts of `model-four` join: questions become sections beside or in place of the views' sections, built the
same way; written statements are lines of the type `text` under the same grammar; `lines`, `strength` and `basis`
are further fields of a line; "supported" and "silent" are further counts; the list of silences is a further part
before "not covered". When the guide's sentences have entered the model as statements, the last part shrinks to
what is left, and the design's acceptance, "delete the explainer script, and the reader file and the edition are
still complete", is then tested.

Worked example, the same work; every `…` is a placeholder:

```markdown
# AIGW Client Projection

Reader file of the work `aigw-client` in `en`, written by Architecture Publisher ….

- Pin: `aigw-cli` `ed8b2fed94ef569f0f2d7fdfd2ec3259c65e37e2` · state verified · date … · release `…`
- Model: `model.json` · version 3 · bytes 36083 · sha256 `4b8d6e30229fbf56adce893fb887c21062e7d48e6951ff563cc1a10c6de96da5`
- Data: `aigw-client.json` · sha256 `…`
- Statements: components 21 · relations 40 · groups 0 · cited 61 · unchecked 0 · uncited 0
- Also in this delivery: `aigw-client.pdf`, `images/`, `aigw-client.html`, `manifest.json`
- measured (pin): `largest-part` … bytes · `files-read` … files

Keys: `stated` was written by the author; …

## How does one reviewed configuration become guarded client files in each admitted client?

- view `overview` · plate 1 · `images/01-overview.png`
- measured (model): `hub` `adapter-seam` part
- component `synchronization`: Synchronization, coordinator · stated · files `internal/app/synchronization/`
  - converges: client selections and their client files
  - commits: one configuration transition with guarded compensation
  - measured (pin): `owned-files` … paths · `owned-bytes` … bytes
- relation `synchronization-configuration-store`: synchronization —persists→ configuration-store · stated · files `internal/app/synchronization/preview.go`, …
  - measured (model): `cited-files` 5 files

## Not covered

…

## Checking again

…

## The guide's text

# How does AIGW keep every AI client of a team in step with one reviewed configuration? {#guide}

AIGW is a local-first control plane for a team's AI clients.[](source:readme-what) …
```

### The publisher's words are in the model's language; keys are not translated

A delivery is one language: each language of a work is a model of its own with the same id, and the publications
hold `en/` and `zh/` with the same ids (compared for all six works). So the data and the reader file are one each
per delivery, and with that one per language, and every language of a work gets the same three files.

The reader file's own words (the headings, "Pin", "Statements", "measured at the pin", the sentences of the last
part) come from `src/locale.mjs` for its five languages, as the print edition takes its words from the model's
language. Not translated, in the data or in the reader file: ids, paths, the type words `component`, `relation`
and `group`, the origins `stated` and `measured`, property names and units. They are keys the invariants parse and
they equal the data's values. Across the languages of one work the data agrees in every id, fact and row of
evidence and differs only in texts; that is a test on a fixture with two languages.

Rejected: an English reader file for every language, which fails the owner's rule that a work is delivered in
every language with the same set of files and would set English headings over Chinese statements.

### Three invariants of projection are refusals, in `check` and in `build` alike

Each is decided before anything is written. The fourth new code, `delivery_name_taken`, is the rule on ids above.

| Code                      | Refused when                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `reader_ids_differ`       | the statement ids parsed from the reader file's text differ from the model's, by type |
| `data_face_differs`       | a plate's face differs from its view's statement set, or a relation's text is wrong   |
| `projection_fact_unknown` | a plate, the reader file or the generated page holds an id or a value the data lacks  |

The first reads the text the build is about to deliver, not the object it was written from, so a writer that drops
or doubles a line is caught. The third parses the reader file's lines of facts back to values and finds each in
the data's `facts`; takes every id a plate's face names, the two ends of each of its relations and every id the
generated page's diagrams draw, and finds each in `statements`; holds each scale a plate draws to the catalogue;
and leaves the numbers a plate draws from the layer to `fact-layer`, which holds them with its substitution tests.
A plate's text runs are not handed to the unit, so they are not read. The writer of the data refuses a fact of a
property the catalogue lacks under the same code. Each has a test with a deliberately broken input, as the design
asks of every invariant.

The generated page's diagrams are read back to the model's ids, a card through the diagram's table of nodes and a
connection through the names Archify is given for the view's relations, and are held to the data. A page that is a
guide is its author's document, and the nodes of its diagrams carry ids of their own (`parts-store` where the model
has `configuration-store`). They cannot be found "under the same id", and all six works have guides. So the
design's acceptance "the figures in the explainer script are checked against the model" is read as a count and a
list, the way the design treats marks of the hand-written overview: a node that cites files is matched to the
components that own them in the verified rows of the evidence table; a connection is matched to the relations of
the model between the components its two ends matched, whichever way they run; the data's `guide.figures` holds
its state, each match, and the nodes and connections with none. Nothing is refused. Without a checkout no file has
an owner and nothing is matched.

### `archpub check --json` gains one key, `data`

`fact-layer` left the key to this Change. A check writes no file, so it reports what a build would write, in
counts: `data.statements` (components, relations, groups, and cited, unchecked and uncited), `data.facts`,
`data.evidence` (paths and ranges), `data.faces` (per plate, the numbers of components, groups and relations), and
for a guide `data.figures` (its state, the numbers of matched nodes and connections, and the lists of unmatched
ones). They are the counts the manifest of a build records under `data`, and the text report prints one group,
`Data`, for them. Rejected: the facts themselves under `facts`, or the whole data under `data`: the same content in
a second carrier, as `fact-layer` argued. A reader that wants the data builds a delivery.

### The manifest is version 8, and nothing begins to read the version

`DELIVERY_VERSION`, which moves with the manifest's assembly to `src/manifest.mjs`, is the only definition. Nothing
in `src` reads it: `verifyDelivery` in `src/delivery.mjs` checks the manifest's `format` alone, and `accept`,
`verify`, `compare` and `publish` go through it. `tests/delivery.test.mjs` asserted 7; the operations reference and
two places of the specification of `edition-delivery` said 7.

Version 8 adds `model.file`, `data` (`file` and the counts a check reports) and `reader` (`file`, `bytes`,
`statements`), changes `sources` to `state` and `count`, and removes `sources.records` and `evidence`. A delivery of
version 7 is not rewritten and keeps verifying, accepting, comparing and publishing as before; a reader of one
finds no reader file and no data beside its manifest, and its model inside the PDF. Rejected: refusing version 7 in
`verify`, which would turn every published delivery into a refusal for no gain.

### The work lives in a unit of its own, `src/pinned`, that receives values

`src/build.mjs` held 491 effective lines of 500 at the lane's base and could gain only calls. The new unit holds
`evidence.mjs`, `face.mjs`, `data.mjs`, `reader.mjs` and `invariants.mjs`, imports `locale` and `refusal` and no
other unit, and is handed the model, the binding, the layer, the views, the plates and the guide's citations as
values, as `fact-layer` hands the layer to the drawing. The name is the design's word for the whole this unit
writes; `edition` is taken by the print edition (`src/edition`, the manifest's `edition`, the medium `edition`),
which is why no key of the data is called `edition` either. Rejected: writing the files inside `src/build.mjs`,
which has no room; and modules of `src/edition`, which typesets the print edition and may not be handed the layer
under another name.

Two flat units stand between the build and `pinned`, and `src/build.mjs` ends at 372 effective lines. `manifest`
(`src/manifest.mjs`) holds the delivery's format and version, the summaries a check and a manifest share and the
manifest's assembly, each moved as it was. `projection` (`src/projection.mjs`) gathers the pinned edition from
what the build prepared, reads the guide, has `sources` read at the pin the files only the guide cites, runs the
three invariants and refuses a model id that takes a delivery's file name; it is the one unit that imports
`pinned`. `tests/module-boundaries.test.mjs` gains `pinned: ["locale", "pinned", "refusal"]`, `manifest: ["map"]`
and a row for `projection`, and `build` gains `manifest` and `projection`. A directory `src/build/` was the first
plan and was not taken: `.gitignore` holds an unanchored `build/`, so Git and the format check would pass over it.

A build gathers the pinned edition twice: once in `prepare`, as a check does, so that a refusal comes before
anything is typeset, and once after typesetting, with each plate's page, which is what it writes.

### A guide is read whichever media are built

The reader file ends with the guide's draft and the evidence table holds the guide's citations, so a model that
names a guide has its draft and the files it names read for every medium. A guide that is absent therefore refuses
`--media edition` with `guide_missing`, where it was refused only when the page was built; that is part of the
breaking change and stands in the changelog on its own line. Only the page has Archify validate the guide, so with
`--media edition` no Archify runs, and the data's `guide.sources` is `declared`: no page verified the guide's
sources. Rejected: a reader file without the guide's text when the page is not built, which would make one work's
reader file differ with the media of the build.

### A guide's citation of a file absent at the pin is refused, with a checkout, for every medium

- **Rests on:** with `--media edition` nothing refused a guide's citation of a file that is absent at the pin; only
  Archify did, with `page_refused` and its finding `repository-evidence/file-missing`, when the page was built with a
  checkout and the model named its repository's URL and revision. The binding refuses a relation that cites a missing
  file (`relation_file_missing`, `src/sources/bind.mjs`). `readAtPin` leaves such a path out, and the evidence table
  wrote its row `unverified` beside verified ones.
- **Considered:** (a) leave the row `unverified` in the evidence table and print it so in the reader file; (b) refuse,
  for every medium, when a checkout is given; (c) refuse always, also without a checkout.
- **Chosen because:** (b). The product's promise is that what a delivery names as evidence was read at the pin. With a
  checkout a file that does not exist there cannot have been read, and a delivery that lists it says more than it has;
  the model's own citations are already refused in that case, and the guide's must not be held to less only because
  the page was not built. Without a checkout nothing is read and every row is `unverified`, so (c) would refuse what
  the product cannot know. (a) keeps a known falsehood in a delivery under a quiet word.
- **Applies to:** every path a `@source` of a guide's draft or a node's source in one of its diagram files cites, for
  `check` and `build`, every medium, whenever `--repo` is given and the model names the revision to read at. The
  refusal is `guide_file_missing`: its message names the guide, and each problem names the place of the citation, as
  `@source <id>` or the diagram's file and the JSON pointer of the source, and the path. `guideOf` in
  `src/projection.mjs` raises it where the guide's paths are read at the pin, straight after the binding and before a
  view is planned or the page prepared; the guide is read once there and handed to the page. The state `unverified`
  stays in the table: it is every row's state without a checkout.

### A file is recorded as verified only when its own bytes were read

- **Rests on:** two demonstrations on the binding as it stood before this decision. A checkout that lacked the
  object of a claimed file, as a partial clone does, bound the model with `state: verified` and recorded the file
  under the digest of the word "missing", `ffa63583dfa6706b87d284b86b0d693a161e4840aad2c5cf6b5d27c3b9621f7d`, and 7
  bytes: Git answers such a name as missing, and the reading kept that word as the file's bytes. A tracked file
  named `src/main.mjs`, a line break, `extra`, whose bytes were the read-me's, was read in a batch of one name a
  line and recorded as `verified` under the digest and the 23 bytes of `src/main.mjs`. Both readings predate this
  Change.
- **Considered:** (a) record such a file as `unverified` beside the verified rows; (b) leave it for a later Change;
  (c) refuse.
- **Chosen because:** (c). The evidence table's `verified` must mean read at the pin, and this Change makes that
  table a delivered file: a row that says `verified` over bytes that are not the file's own is the one thing the
  table must not hold. (a) would mix two states in a build with a checkout, where every other file that is absent
  at the pin is refused. (b) would deliver the falsehood in the first release that delivers the table.
- **Applies to:** every read of the binding, for a check and a build: the files in the components' scope, the files
  relations cite and the paths only the guide cites, through the one function `readFiles` in
  `src/sources/bind.mjs`. The refusal is `source_read_failed` and names the file: an answer of Git that is no file
  of its stated size, a read Git does not finish, and, before anything is read, a path that holds a line break,
  named with the break written as `\n`. A model's validation refuses a line break in a path the model states, so
  that case arises from a tracked file inside a claimed directory. A guide's citation of such a path is left out of
  the read, as before, and refused as `guide_file_missing`.

### No link from the page or the print edition in this Change

The page is the guide as its author wrote it, or Archify's document; the print edition's bytes are held equal
through this Change, which is its cheapest proof. The reader file is the entry: its head names the other files of
the delivery. The entry line in each described repository belongs to `six-works`. Rejected: a sentence in the
edition's reading note that names the reader file, which changes the PDF of every work, in five languages, for a
pointer the file's place beside the PDF already gives.

### The proof is `archpub compare`, base against head, on the twelve editions

Each of the six works is built in both languages at the lane's base and at its head, under the conditions
`fact-layer` used. Every comparison must list exactly four files, `manifest.json`, `model.json`,
`<model id>.json` and `<model id>.md`, and no plate. Two builds of the head must be identical. Rejected: proving
the unchanged files by their digests in a script of the lane, when the product's own comparison says the same and
is the definition the queue's second step wrote.

## Risks / Trade-offs

- [The reader file's generated part is a form no arm tested] → the rerun the design asks for compares it with arm
  B; the fallback is a deletion; the result is no completion condition (D12 of the design).
- [The carried guide text is Archify's source, with directives a reader must read past] → it is the tested bytes;
  rewriting it would test something else.
- [The drawing's report of what it drew adds lines to `src/poster`] → the report is a list the functions already
  compute. In effective lines, base to head: `figure.mjs` 360 to 371, `lines.mjs` 240 to 261, `strip.mjs` 279 to
  281, `plate.mjs` 377 to 377 and `compose/plates.mjs` 256 to 257, against a limit of 500.
- [Moving `evidence` and `sources.records` out of the manifest breaks a consumer this Change did not find] → two
  tests read them in the product; the publications' tests read no delivery; the change is named as breaking.
- [A guide that is absent now refuses a build of the edition alone] → it is named as breaking, on its own line of
  the changelog; all six works hold their guides.
- [Two deliveries of one work differ in more than texts] → the test on a fixture in two languages; the twelve
  editions are compared pairwise by a script of the lane, and a difference is reported, not excluded.
- [The data grows large] → ETHOS has 42 components, 90 relations and 11 views; the size is measured at task 6.1 and
  written into `tasks.md`.
- [Matching a guide's figures by owner finds few matches] → it refuses nothing; the count is reported.
- [A guide's citation of a file that is gone now refuses a build of the edition alone, with a checkout] → it is named
  as breaking, on its own line of the changelog; the six works' guides are held to their pins when each is checked
  with its checkout (task 5.2).
- [The translated words of the reader file in `zh-TW`, `es` and `ko` are drafts] → the keys the invariants parse
  are not translated; the words need a reading pass before the works in those languages are published.
- [The stop line] → the face needs what the drawing knows and no new layout, and the frame repeats the house
  class's arithmetic on its tokens. The stop line was not reached.

## Migration Plan

A delivery built by an earlier release stays as it is and keeps verifying. A consumer that read
`manifest.evidence` or `manifest.sources.records` reads `statements` and `evidence` of `<model id>.json`. A work
whose model's id is `model`, `manifest`, `acceptance` or `colophon` takes another id before it is built; none of
the six works has one. A work whose model names a guide keeps the guide beside the model for every build, of the
edition alone too. The six works are built again by the release that holds this Change; their inputs do not
change. Rolling back is building with the earlier release.

## Open Questions

None.
