## Why

A delivery holds what a person looks at: the print edition, its images and the page. What a reader that works from
text needs is in none of them as text. The model is attached inside the PDF, the measured facts are drawn as lengths
and dyes, the files a statement rests on are spread over the manifest's `sources` and `evidence` and the guide's
`@source` lines, and no file says where on a plate a part or a relation stands.

The reader experiment of the roadmap's first step decided that this is worth building. A reader given the work's
model and guide text beside the repository named the paths of a later change with a recall of 0.652, against 0.450
for the repository alone; the plates as images scored below the repository alone, and one hand-written page of
constraints did not help (`trials/2026-11-15-outcome.md` and `trials/reader/2026-11-15-record.md` of the
publications). By the outcome table of the design of the queue
(`openspec/changes/archive/2026-11-14-queue-the-roadmap-and-name-roles/design.md`, called the design below) "B
passes: the reader file is made as designed". The queue asks for it "in the form the reader experiment supports".

The item before this one, `fact-layer`, left every measured fact in one unit, `src/facts`, with its property,
subject, unit and origin. This Change writes that layer, the model and the binding into the delivery, as data and as
text, and holds every projection to them.

## What Changes

- **Breaking:** every delivery gains three files at its top: `model.json`, the model the build read, byte for byte;
  `<model id>.json`, the pinned edition as data; and `<model id>.md`, the reader file. The manifest's version rises
  once, from 7 to 8.
- The data holds the work's identity, the pin, the views with the statements each selects, every component, relation
  and group with its origin, every fact of the layer with its property, subject, unit and origin, the catalogue of
  properties, one evidence table, and for every plate its data face.
- One evidence table is gathered on the output side: every path the model claims or cites and every path and line
  range the guide cites, each path once, with its state, digest, size, last change, owner, the relations that cite
  it and the ranges cited in it. The model and the guide are not changed and gain no field.
- The manifest names the three files and no longer repeats what the data holds: its `evidence` and the records of
  its `sources` move into the data, where they stand once.
- A plate's data face records the parts, groups and relations the drawing drew, by id, each relation written
  `source —label→ target`, with the box of each part and every stretch of each relation's line in the plate's
  drawing space, beside the frame of the figure on its page, the page, the images and the scales the plate uses.
  The drawing reports what it drew; the face is not copied from the view.
- The reader file is Markdown in the model's language: a head with the work, the pin, the publisher's version and
  the digests of the model and the data, the counts of statements by what their evidence reaches, scope and limits;
  one section per view under the view's question with one line per statement; the statements no view selects;
  what is not covered and how to check again; and last the guide's text, carried whole.
- **Breaking:** a model that names a guide has the guide read whichever media are built, since the reader file
  carries its draft and the evidence table its citations. A guide that is absent now refuses a build or a check of
  the edition alone with `guide_missing`.
- The build and `archpub check` refuse when the reader file's statement ids differ from the model's, when a plate's
  data face differs from its view's statement set, and when a projection holds an id or a fact the data lacks.
- The diagrams of a guide are checked against the model: a node that cites a file is matched to the component that
  owns the file at the pin, and the nodes and connections that match no statement are counted and listed, never
  refused.
- `archpub check --json` gains one key, `data`, with the counts of what a build would write and that list.
- A build or a check of a model whose id is `model`, `manifest`, `acceptance` or `colophon` is refused with
  `delivery_name_taken`, because one of its files would take the name of another file of the delivery. The model's
  own validation does not change.

What waits for `model-four`, and is absent here and not written as empty: questions with ids and the entries of the
question table they answer, written statements of other kinds, line ranges stated in the model, the strength and
the basis category of evidence, the counts "supported" and "silent", and the list of silences. The data and the
reader file take them as new members and new fields; no member written here changes its meaning.

Out of scope: any change to the model's format, to what a plate, the print edition or the page draws, and to
`src/layout`, `src/plan` and the typesetting; alternative text, marks that link to their statement and the round
trip from the PDF (`blocks-by-question`); who accepted what (`roles-and-records`); the entry line in each described
repository (`six-works`).

The design gives the roadmap's third step one week for its two Changes. This one has three working days and the
step's stop line: if the layout or the typesetting engine would need rewriting, the work stops and is estimated
again.

## Capabilities

### New Capabilities

- `pinned-edition`: the delivered model, the pinned edition as data, the evidence table, a plate's data face, the
  rule that every projection holds only what the data holds, and how the data grows without a new version.
- `reader-file`: the reader file of a delivery, its parts, the line of a statement, the guide's text carried whole,
  its words in the model's language, and the rule that its statement ids equal the model's.

### Modified Capabilities

- `edition-delivery`: a delivery holds three more files; the manifest is version 8, names them, and hands its
  evidence and source records to the data; `archpub check --json` reports the data's counts; a model whose id
  would give two files of a delivery one name is not built; a guide the model names is read for every medium.
- `measured-facts`: the requirement "The layer is not delivered" is removed, since the layer's facts are now
  written into the data.
- `source-binding`, `architecture-model` and `interactive-map`: four requirements said that the manifest records
  each cited file, carries every statement's details, status and files, and keeps what the page does not print.
  The data holds them now; what the model and the page do is unchanged. The binding gains one requirement: a file
  it cannot read at the revision is refused, and never recorded as verified.

`poster-composition` and `overview-page` keep every requirement as it reads, and the model's format is untouched.

## Impact

New: the unit `src/pinned/` (the evidence table, the data face, the data, the reader file, the invariants) and its
tests; two flat units beside the build, `src/manifest.mjs` (the manifest's assembly and the summaries a check
shares, moved out of `src/build.mjs`) and `src/projection.mjs` (gathers the pinned edition, runs the invariants,
refuses a taken id; the one unit that imports `pinned`); the reader file's words in `src/locale.mjs` for the five
languages; the reference page `docs/reference/data.md`. Changed: `src/build.mjs` (calls only: the three files, the
manifest's version and records, the `data` key of a check; it ends at 372 effective lines, from 491),
`src/poster/figure.mjs`, `src/poster/lines.mjs`, `src/poster/strip.mjs` and `src/poster/compose/plates.mjs` (the
drawing reports what it drew and where), `src/edition/typeset.mjs` (hands back each plate's page),
`src/sources/bind.mjs` (`readAtPin` reads the files only the guide cites at the pin, and a file the binding cannot
read is refused), `src/cli/facts.mjs` and
`src/cli/report.mjs` (the check's `Data` group), `tests/module-boundaries.test.mjs`, the tests of deliveries,
acceptance, the command's results and reports, and the tests of the edition's class and plates. Documents:
`docs/product-contract.md` (Outputs, the queue's tick), `docs/reference/operations.md` (the delivery's table, the
manifest's fields, the refusals), `docs/reference/command-line.md` (the check's report), `docs/reference/model.md`
and `docs/tutorial.md` (where they said what the manifest keeps), `docs/reference/development.md`,
`docs/glossary.md`, the index pages, the README, the Skill and `CHANGELOG.md` under `Unreleased` as a breaking
change. Untouched: `src/layout`, `src/plan`, `src/overview`, `src/house.json`, the model's schema, and every byte
of a delivery's PDF, images and page.

`archpub verify`, `accept`, `compare` and `publish` read a manifest's format and never its version, so a delivery
of version 7 keeps verifying, and a comparison of a version 7 delivery with a version 8 one lists the three new
files and the manifest.

For the publications: the six works' inputs do not change and no test there reads a delivery. Its README names the
three files and the publisher's release that writes them; the reader experiment is run again with the reader file
against the plain model and guide text, as the design asks, and recorded under `trials/`; the figure-reading items
are generated from the data face from here on. None of the three is a completion condition of this Change.

Queue: `reader-and-data`.
