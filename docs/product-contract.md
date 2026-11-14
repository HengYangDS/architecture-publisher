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
its author composes with the house class when the model names one, its pages as
images, one interactive page that answers the model's question, and a manifest
that binds every artifact to its inputs and keeps the evidence the drawings
leave out. The page
is the guide its author writes when the model names one, and otherwise answers
the question view by view.

The model says what the architecture is: components, relations, their details
and the repository files that support them. Architecture Publisher owns how that
meaning becomes a clear figure: rows, placement, routing, typography and the
reading floor. It does not infer architecture from code, judge whether the model
is true or decide whether a figure is good enough to publish. The model's author
owns its meaning, and a named reviewer owns acceptance.

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
6. **Deliver** the artifacts and the manifest into a new directory, staged and
   renamed into place only when complete.

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
revision. The manifest keeps every detail, status, claim, cited file, owner,
digest and verification state.

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
- The media are the print edition and the page. Slides and mobile layouts are
  not produced.
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

### Queue

The product is built in the order below, one item at a time. The Change `queue-the-roadmap-and-name-roles`, kept
in `openspec/changes/archive/`, records the design behind each item, its acceptance and the line at which it
stops. Every Change's proposal ends with the item it serves, as `Queue: <item>`, or with `Queue: maintenance`
when it changes no product behaviour; `tests/evolution-queue.test.mjs` refuses a Change that names no item, an
item not listed here, or an item that an unfinished one precedes, and a maintenance Change that changes the
layout, plate, page, overview or edition source. A new direction joins the list by a commit that says what it
moves back. Items marked as work on the publications are finished there and ticked by the next Change here.
[Roadmap details](roadmap.md) says what each item does.

- [x] `carrier`: this queue and its test, the roles named without a kind of holder, and a README that claims no
      more than the check proves.
- [ ] `command-line`: commands, help and status output built on established libraries, for readers at a terminal
      and for agents alike. The owner put it here on 2026-11-14: 「archpub 的 cli 在屏幕上看起来好丑」「利用好成熟工具
      和框架，减少手撸」. It moves `paper-and-experiments` back by its own length.
- [ ] `paper-and-experiments`: no product code. The reviewer's procedure and its seeded checks, the question
      matrices of three works, the table of what each mark on a plate now means, the reader experiment, the author's
      timing, and the comparison of lines on screen with a first figure-reading check. Work on the publications.
- [ ] `line-table`: a command that compares two deliveries, and one table of line weights and patterns that holds
      only the rows the experiments passed.
- [ ] `fact-layer`: the facts a plate draws, measured in one layer that every projection reads; no delivered
      byte changes.
- [ ] `reader-and-data`: the model, the pinned edition as data and a reader file in every delivery, in the form
      the reader experiment supports.
- [ ] `sample-book`: one work set by hand as a whole book: its contents are the question table, silence is
      printed, and one page compares the publisher's own plates with Archify's. The owner's first look. Work on the
      publications.
- [ ] `model-four`: the model's one new version: questions, written statements, line ranges, the strength and
      origin of evidence; style moves beside the model; `check` reports each question-table entry's state.
- [ ] `one-anatomy`: one anatomy for every part, its regions drawn where the part has the fact; the choice
      between strips and cards goes.
- [ ] `blocks-by-question`: the page blocks the sample book used and no others; the edition set by question.
- [ ] `roles-and-records`: an acceptance records the role, its holder, the delegation and the verdict on each
      statement; the reviewer's Skill.
- [ ] `six-works`: the six works completed, set anew and accepted, each named from its own repository. The
      owner's second look. Work on the publications.
- [ ] `freeze-and-foreign-work`: the model, manifest and acceptance formats held still for one cycle, and one
      work on a repository that is not the owner's, written by an agent from the Skill alone.

Until `freeze-and-foreign-work` is finished the product takes no new palette, style, composition or typeface, no
binding an author can write, no new channel of distribution, platform or language, and no service.
