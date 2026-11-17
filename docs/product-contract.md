---
subject: architecture-publisher:product-contract
role: policy
state: canonical
relations:
  canonical_for: product meaning, inputs, outputs and quality boundaries
---

# Architecture Publisher product contract

## Product

Architecture Publisher draws the architecture of any repository from an
explicit model. The `archpub` command turns one Architecture Model into a
delivery: a print edition, one PDF with a plate for each view and the overview
the publisher draws from what the model states of it, its pages as
images, one interactive page that answers the model's question, the model, the
pinned edition as data and a reader file for a reader that works from text, and
a manifest that binds every artifact to its inputs. The page
is the guide its author writes when the model names one, and otherwise answers
the question view by view.

A delivery is figures first, and its text assists them. The print edition is
for people who explain a system to other people, in a talk, a report or a
lesson: its pages are landscape, made for a screen or a projector, and serve as
slides. The page is interactive and is for a reader who explores it at a screen
of their own; it does not suit a formal presentation or a publication. The two
media serve different occasions and are designed apart. Each draws its own
figures: the edition's plates are the publisher's engine's and the page's
diagrams are Archify's, and nothing drawn for one is carried into the other.
The data and the reader file serve a reader that works from text, an agent
first.

The model says what the architecture is: components, relations, their details
and the repository files that support them. Architecture Publisher owns how that
meaning becomes a clear figure: rows, placement, routing, typography and the
reading floor. It does not infer architecture from code, judge whether the model
is true or decide whether a figure is good enough to publish. The model's author
owns its meaning, and a named reviewer owns acceptance.

No input says where anything stands. A model names a work's parts, relations and
views and what its author states of them; position, size, alignment and type are
the publisher's. The overview is stated the same way: the model says what its
page holds, and the publisher lays it out. No input of the kind the retired
overview composition was, a file that places words and lines by coordinates, is
added.

The product is general. Nothing in it is specific to one repository, language
or framework, and nothing in it names where a delivery goes: the caller chooses
the media, their sizes and quality and the directory a delivery is published
to. The same rules apply to every model, in any of the languages its page
speaks: English, Simplified and Traditional Chinese, Spanish and Korean.

## Inputs

- One [Architecture Model](reference/model.md): a JSON file its author writes,
  or imports from a LikeC4 workspace with `archpub import likec4`.
- Optionally, a checkout of the described repository. With `--repo`, the files
  each component claims are resolved at the model's pinned revision through Git,
  without fetching, prompting or changing the checkout: each file in the scope
  goes to its most specific claim, and every owned or cited file's digest is
  recorded.

The repository being described gains no files, dependencies or configuration.
A model may live anywhere, including in a separate publications repository.

## Processing

1. **Validate** the model against its schema and report every problem with its
   JSON path in one pass.
2. **Bind files** at the pinned revision when a checkout is given.
3. **Plan views**: the declared views, however many, or one view of every
   component when it fits, or an overview of the groups and one view per group.
4. **Lay out** each view as rows of cards on one column lattice, as wide as
   their text on plates, with an exact placement and routing that never draws
   an overlap.
5. **Compose** each view as one plate and **typeset** the print edition and its
   images with Typst; **explain** the model on one page of the vendored Archify:
   the guide the model names, or one native diagram per view.
6. **Deliver** the artifacts, the model, the data, the reader file and the
   manifest into a new directory, staged and renamed into place only when
   complete, after the reader file and every plate's face are held to the model.

The same model, repository revision and publisher version produce the same
bytes on one platform; without a checkout, the print edition is reproducible
when the caller sets `SOURCE_DATE_EPOCH`.

## Outputs

A delivery holds the print edition as `<model id>.pdf`; the interactive page as
one standalone `<model id>.html`; in `images/`, the overview's page as
`00-overview.png` and each plate's page as `NN-<view>.png`, at 2400 px or the
widths the caller names; and `manifest.json`. A build may deliver either medium
alone. The [operations reference](reference/operations.md#the-delivery) lists
the manifest fields.

Every delivery, whichever media it carries, also holds `model.json`, the model
the build read, byte for byte; `<model id>.json`, the pinned edition as data:
the work, the pin, the views, every component, relation and group with its
origin, every measured fact, one evidence table of every file the model claims
or cites and every range the guide cites, and for each plate what it drew and
where; and `<model id>.md`, the reader file, which states the same statements
and facts as text in the model's language and ends with the guide's text. The
build refuses when the reader file's statements are not the model's, when a
plate's face is not its view's statements, or when a projection holds what the
data lacks. The [data reference](reference/data.md) describes the three files.

The print edition opens with a title page of the work's name, question and
summary and a byline of its release, editors, licence and publisher, then
contents that link to every page beside the edition's facts, scope, limits and
a reading note, then the overview and one plate per view. A plate shows the
view's title and question, its figure with each component's icon and details
and each relation's label and details, and a key of the kinds, boundary and
statuses it shows. A figure that leaves part of the page gives it to the view's
reading: its summary and where each of its components lives. Its text is text, and each card title links to its
component's first file when the model names a browsable repository. The edition
conforms to PDF/A-3a and PDF/UA-1 and carries the model it was built from. It
prints the model digest and the number of files read among its facts, but no
verification states, claim records or tables. The words the publisher sets
itself are in the model's language.

A guide is the page as its author wrote it, held by Archify to its checks at
the build's quality, with strict writing at showcase; with a checkout, its
repository sources and code excerpts are verified at the model's revision.
Without a guide, the page heads with the model's question and its summary as the conclusion,
beside the list of its panels. Each view is a panel with its native Archify
diagram, which opens Archify's full interactive viewer, and one step per
component with every one of its details and, when the model names its
repository URL and revision, its first file that Archify will cite, at that
revision. The data keeps every detail, status, claim, cited file, owner,
digest and verification state, each once; the manifest names the data and the
reader file with their digests and counts, and no longer repeats them.

## Quality floor

- Every plate is laid out for the edition's body, and no figure text is smaller
  than 14 px. Each plate is measured against the balance gates for its largest
  blank rectangle, blank bands, holes and centre of mass, and the manifest
  records the gates it misses, which the reviewer weighs at acceptance. A view that no
  plate can lay out is refused; text is never shrunk and nothing is cropped,
  and text Typst would set wider than the engine measured it is refused.
- Text is set in the bundled faces, and lines break where the text's writing
  system allows. Text in a right-to-left or shaped script, or with a character
  no bundled face draws, is refused rather than drawn wrong.
- On plates each card is as wide as its text, the cards of one lattice column
  share one width and the cards of a row one height, and all sit on shared row
  lines; the page's diagram cards share one width. Wires are horizontal and
  vertical only; no segment is shared by two relations, no wire crosses a card
  and no label touches a card, a label, another wire or the system boundary. A
  layout that cannot meet this is never drawn, and a view no layout draws is
  refused. Crossings the relations force are allowed and counted, as are route
  defects, and each plate prefers the fewest of both.
- Archify delivers the page at the build's quality profile, showcase unless the
  build asks for standard, and every view diagram passes Archify's checks at
  that profile, or the build is refused with Archify's findings. In a 1440 × 900 window every preview fits its panel,
  primary labels render at no less than 13.25 CSS px in the previews and 14 CSS
  px in the full viewer. Each diagram draws every component and relation of its
  view, and the manifest records its route measures.
- Archify, the fonts, the house faces, the measuring library, the icons and the
  LikeC4 parser are bundled unmodified with recorded digests.

## Acceptance and publication

A build establishes only that the delivery was produced from its inputs. A
reviewer accepts an unchanged delivery with `archpub accept`, which records the
reviewer and the manifest digest. `archpub publish` copies only an accepted
delivery to `<root>/<model id>/<version>/` and never replaces a different
published delivery. Tests and checks never stand in for that acceptance.

A work passes through three roles: its author writes the model, its reviewer accepts a delivery and its
reader uses it. A role is what its holder is given, what it hands over and the record it leaves. Any holder
able to do the work may take a role, human, agent or team, and the record names the holder; nothing in the
product depends on which kind of holder it is.

## Boundaries

- The publisher draws what the model states; it does not discover components,
  rank evidence or fill gaps.
- `archpub check` reports what a model draws, cites and covers of its
  repository, and how far the repository has moved since its revision. These
  are counts for the author and the reviewer; they never refuse a model.
- The media are the print edition and the page. The edition's landscape pages
  are made to be shown as slides; no file of a slide program and no mobile
  layout is produced.
- A build needs no network, account or credential. Publication copies files
  locally; uploading to a Forge or a website is the caller's own step.
- The publisher compiles a model and the files it cites into publications. It
  is not a second intent store, a repository lifecycle, a workflow state
  machine, a code-graph authority, an editor, a marketplace or a resident
  service.

## Evolution

The model format is versioned (`format` and `version`), and an unsupported
version is refused rather than reinterpreted. A change that refuses a model
another release accepted, or that changes the bytes of an existing delivery, is
a breaking release. Earlier releases and their deliveries stay as they were.

### End state

The queue below leads to one state, and each of its items is read against it: one model goes in, one complete
edition comes out, and no page of it is placed by hand.

- One part. A part is a card of regions: its name with its kind's icon, the strip of its files, its kind and its
  counts, what it answers for, an outline that tells its status and a ground that tells whether it lies inside the
  repository. Each region is drawn where the part has the fact. The part is drawn at three sizes, which the figure
  and its room choose and the author does not set: its name alone, the card, and a plate of its own that lists its
  files and the file that carries each relation. The same part stands in every figure.
- One table of lines, in which a meaning has one drawing.
- Every word the edition sets of a measure is made from the fact it measures.
- A mark's meaning stands by the mark. A plate keeps a short key, and one page at the front teaches how the figures
  are read.
- A view's composition is chosen by the view's shape, for a plate that is full and balanced.
- Each page of an edition answers one question with one figure and a few sentences: the title, the contents, how
  to read the figures, the overview, the structure, the repository's structure, the mechanisms, the history, the
  change between two pins, the plans, an important part opened, and the colophon.
- One palette for a work, and a house style.
- The same pages in landscape for presenting and in portrait as a booklet. The page in a browser is a medium of
  its own.
- Tidiness is held by the publisher's gates and not by a reader's eye: a plate that misses one is composed another
  way or refused.

### Queue

The product is built in the order below, one item at a time. Every Change's proposal ends with the item it serves,
as `Queue: <item>`, or with `Queue: maintenance` when it changes no product behaviour;
`tests/evolution-queue.test.mjs` refuses a Change that names no item, an item not listed here, or an item that an
unfinished one precedes, and, where a `dev` ref is known, a maintenance Change that changes the layout, plate,
page, overview or edition source. The design of a Change that names an item names the page of
[research](research/README.md) it rests on, and the same test refuses one that names none. A new direction joins
the list by a commit that says what it moves back.

The open items follow the dimensions of the edition's figure language: its parts, the edition's forms, the
composition of a view, the carriers of what a work covers, and palette and style; the page is a line of its own.
The Change `order-the-queue-by-the-figure-language`, kept in `openspec/changes/archive/`, records why, and what
became of the items it removed; the Change `record-the-figure-language-and-its-end-state` added the end state
above and worded three items against it. The design of the Change `queue-the-roadmap-and-name-roles` is the record of the
six finished items and directs none of the open ones; [Roadmap details](roadmap.md) holds its detail. An item is
accepted on the published works as the product builds them, with what its own gates record of every plate.

- [x] `carrier`: this queue and its test, the roles named without a kind of holder, and a README that claims no
      more than the check proves.
- [x] `command-line`: commands, help and status output built on established libraries, for readers at a terminal
      and for agents alike.
- [x] `paper-and-experiments`: no product code. The reviewer's procedure and its seeded checks, the question
      matrices of three works, the table of what each mark on a plate now means, the reader experiment, the author's
      timing, and the comparison of lines on screen with a first figure-reading check. Work on the publications,
      finished there on 2026-11-15: its `trials/2026-11-15-outcome.md` says what each trial decided. In one run an
      agent reader with a work's model and guide text beside the repository did better than one with the
      repository alone; no person was tested.
- [x] `line-table`: a command that compares two deliveries, and one table of line weights and patterns, with heavy
      lines into a view's hub.
- [x] `fact-layer`: the facts a plate draws, measured in one layer that every projection reads; no delivered
      byte changes.
- [x] `reader-and-data`: the model, the pinned edition as data and a reader file in every delivery, in the form
      the reader experiment supports.
- [ ] `overview`: the overview drawn by the publisher from what the model states of it, as blocks without positions: a
      masthead's claim and lead, a course of steps with their stations, parallel tracks and lines, further courses
      with one outcome that leaves them, and headed lists, tables and groups. The publisher lays them out on one grid
      by measure and refuses a page too tall for them; the overview composition is retired. It stands before the rest
      of `composable-parts` because the owner ruled on 2026-11-17 that nothing is placed by hand.
- [ ] `delivery-layout`: a delivery laid out by kind, so a reader finds each thing where its kind says: the print
      edition, the page and the manifest at the top; each page's image in `images/`, named by what it shows (the
      overview, a plate's number and view), where `00-overview` and a first plate of a view named overview read alike
      today; the model, the pinned data and the reader file in `data/`. The owner asked on 2026-11-17 that what is
      delivered be organised and named by a rule.
- [ ] `composable-parts`: a part is a card of regions that compose: its outline, its name and kind, the strip of
      what it owns, its counts and its details, each drawn where the part has the fact. Cards and strips are no
      longer two exclusive ways of drawing a part. A planned part that owns no file yet has no strip. The words
      the edition sets of a measure are made from the fact. A kind's icon stands by its label on the card, a
      plate's key keeps the strip and the lines, and one page at the front teaches how the figures are read.
- [ ] `portrait-edition`: the edition in a second form, portrait pages for publication as a booklet read on a
      screen, beside the landscape pages for presenting; figures first in both, and each form named for what it is.
- [ ] `compositions`: more than one composition of a view, chosen by the view's shape or named by its author:
      tiers, a matrix, a spine and a radial one. A plate's blank space and balance are improved by that choice
      and no longer only recorded.
- [ ] `carriers`: figures of the edition's own for what a work covers beyond its structure, each drawn from what
      the model states and none from positions its author gives. First, from what the product already reads: the
      structure of its repository, an important part
      opened, its history in time and the change between two pins. Then, with what the model newly states: the
      course of a mechanism, its plans, its rules and what it writes. With them, an author's notes on parts and
      relations, and a figure of what the work covers and where it is silent.
- [ ] `palettes-and-styles`: style moves beside the model, and the house gains a further style.
- [ ] `page`: the page measured against what Archify offers, and what it leaves unused taken up.
- [ ] `roles-and-records`: an acceptance records the role, its holder, the delegation and what was judged; the
      reviewer's Skill.
- [ ] `foreign-work`: one work on a repository that is not the maintainer's, written by an agent from the Skill
      alone.
