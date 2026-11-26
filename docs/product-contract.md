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
images and each view's figure alone, one interactive page that answers the model's question, the model, the
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

Two readers come first when a work decides what it covers: one who is new to
the repository and has to find the way in, and one who has to review it or
decide about it.

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
   their text and strips on plates, with an exact placement and routing that
   never draws an overlap.
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
`00-overview.png` and each plate's page as `NN-<view>.png`, at 3840 px or the
widths the caller names; in `figures/`, each plate's figure and key alone as
`NN-<view>.png`, on a transparent ground, and `NN-<view>.svg`; and `manifest.json`. A build may deliver either medium
alone. The [operations reference](reference/operations.md#the-delivery) lists
the manifest fields.

Every delivery, whichever media it carries, also holds `model.json`, the model
the build read, byte for byte; `<model id>.json`, the pinned edition as data:
the work, the pin, the views, every component, relation and group with its
origin, every measured fact, one evidence table of every file the model claims
or cites and every range the guide cites, and for each plate what it drew and
where; and `<model id>.md`, the reader file, a document in the model's language
that states the same statements and facts and ends with the guide as prose,
for a reader at a Markdown viewer and an agent alike. The build refuses when
the reader file does not name each statement of the model once, when a plate's
face is not its view's statements, or when a drawn projection holds what the
data lacks. The [data reference](reference/data.md) describes the three files.

The print edition opens with a title page of the work's name, question and
summary and a byline of its release, editors, licence and publisher, then
contents that link to the overview and to every plate beside the scope, the
limits and a reading note, then the overview and one plate per view, and it
ends with an index of the parts by name, each a short paragraph of what it is,
what it relates to, the files it claims and the plates that draw it, which a
part's name on a plate links to; over the repository, the files read, the page
and the data. A plate shows the
view's title and question and its figure: each component as one card of its
name, the strip of the files it owns, its kind beside the kind's icon with the
number and size of its files, and its details where the plate has the room,
and each relation's label and details. Its key holds what the figure shows and
no card says, such as the strips' age bands and scale, the boundary and the
statuses, and lists no kind. A figure that leaves part of the page gives it to the view's
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
- On plates each card is as wide as its text and its strip, the cards of one
  lattice column share one width and the cards of a row one height, and all sit
  on shared row lines; the page's diagram cards share one width. Wires are
  horizontal and vertical only; no segment is shared by two relations, no wire
  crosses a card and no label touches a card, a label, another wire or the
  system boundary. A layout that cannot meet this is never drawn, and a view no
  layout draws is refused. Crossings the relations force are allowed and
  counted, as are route defects, and each plate prefers the fewest of both.
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
  change between two pins, the plans, an important part opened, and an index of the parts with what the edition
  was built from and who accepted it.
- The overview holds the whole on one page and is the edition's map: it names, as a link, the page that enlarges
  each of its parts, and each later page takes one topic and says where it stands in the whole. The overview
  and every plate fill their page; the contents and the index are lists, whose rows keep their height and take
  the pages they need, the last not filled. A text of more than one line is justified.
- One palette for a work, and a house style.
- Three carriers drawn from one model, each for what its reader does with it: the landscape edition for a room
  that looks while someone speaks, a figure a page; the portrait edition for one reader, the same figures laid
  out anew for the tall page with the words a speaker would say, the reading and each part's details; the page in
  a browser for a reader who questions and checks, the guide with its sources. They share the work's question and
  claim, the views' numbers and names, one vocabulary and one pin, and each leads to the others. None holds what
  another could not: a thing stands on a carrier for what its reader does there.
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

On 2026-11-18 the owner took the design of a committee on the edition's three carriers
([record](research/edition-carriers-committee-2026-11-18.md)). `edition-map` joined the list after `overview`, and
`compositions` moved before `portrait-edition`: the landscape edition comes first, and its plates are to be full
before a second form is built. That moves `delivery-layout`, the rest of `composable-parts` and `portrait-edition`
back by two items, and `page` forward to follow `portrait-edition`.

On 2026-11-18 the owner directed that performance be optimised to the limit in every repository ETHOS governs
(「要做极致的性能优化」), after the pipeline of one landing had held the host's one slot for
seventy minutes. `performance` joined the list before `edition-map`: every Change of every later item runs the
suite in its proof and in two pipelines, so what the suite and a build cost is paid by each of them. That moves
every open item back by one.

On 2026-11-19 the owner read the six works as 0.15.0 built them and named what the works lacked that the owner had asked
for (「不要漏我的指示」). Readers other than the maintainer went through all the owner had said since 2026-10-26 and gave
each ask what holds it; twenty-four had nothing. Three of them are items of their own and joined the list before
`performance`, since each is an ask that was dropped and no new wish: `figures-alone`, promised on 2026-11-17 and
never listed; `page-figures`, since nothing is placed by hand and the page's diagrams were; and `reader-file`.
That moves `performance` and every item after it back by three. Seven items took in what they had not named, and
`gallery` joined at the end.

On 2026-11-19 the owner asked where the last page had gone (「之前提到的尾页设计，怎么没有任何提及了」): the committee's
ruling of 2026-11-18 had stood a day without a drawing. `edition-map` moved to follow `figures-alone`, which moves
`page-figures`, `reader-file` and `performance` back by one. The owner then saw the page drawn and ruled on it and on the
contents: both are designed again, the contents may take further pages and so may the last page of a large work
(「目录页是允许多页的；如果真的中间页数比较多，尾页也不是不能允许多页」), and a table of parts against plates is out, since
a part stands on few plates (「单一组件所属图版是稀疏的」). The item below says so; it no longer holds the contents to
one page or names who accepted the edition, which the acceptance's own page states.

On 2026-11-20 the owner asked where a work states its repository's address, was shown the eighty-six files of the
six works that hold it, and made one source for each fact a hard requirement of everything built here
(「事实出处应该唯一，否则要维护多处」; 「SSOT,DRY,MECE,SOLID, 深模块，小表面积，充分解耦，声明式等最佳实践，是硬性要求」).
A census of the product ([record](research/one-source.md)) found some forty facts that its source, its schema and
its documents state more than once, one of them already wrong in a reference document. `one-source` joined the list
before the open rest of `edition-map`, whose next Changes write on the names it puts in one place; that moves the
rest of `edition-map` and every item after it back by one. `derived-references` joined before `performance`, which
moves `performance` and every item after it back by one more. `page-figures` says of the repository and the pin
what it says of positions: a guide's diagram file states nothing the model holds.

On 2026-11-22 the owner asked, of ETHOS and every repository it governs, for the strategy that optimises
performance and speeds iteration to the limit; the session that measures the host relayed it with this
publisher's share of the host's proofs. Its own records count 41 proofs in the seven days before, 13.0 hours in
all, its behaviour gate a median of 927 seconds, and its pipelines on the host's guests ran 40.9 hours, nearly half
of it a commit run a second time ([record](research/build-and-suite-time.md)); every heavy step of every
repository waits for the one slot they hold. The reason that moved `edition-map` before `performance` on
2026-11-19, its contents and last page, is met. `performance` moves before the open rest of `edition-map`, after
`one-source`; that moves the rest of `edition-map`, `page-figures`, `reader-file` and `derived-references` back by
one.

On 2026-11-25 the publisher's part of `page-figures` was finished: its five Changes lay out and pin every kind of a
guide's diagram. Its last step, the published works' diagram files losing their positions and their repository,
waits for a release of Archify that takes a guide's files without them. An outside wait holds only the work that
needs it: `page-figures` moves after `reader-file`, which needs nothing from it.

On 2026-11-25 the owner asked whether a part on a plate of the PDF could show an explanation on hover, or behind a
small icon, and asked for the need beneath the ask (「理解下底层的本质需求，而不是按照我表面要求的这样」). The need read
from it: a part's explanation one action away from the plate and back, which a talk on a screen can use; links work
in every PDF reader, hovers in few. Of three forms, the owner chose the index widened, a short paragraph a part, and
ruled out a page a part (「可以尝试 3a，独立的部件页不是个好主意」); seen as a sample of two works, the Change was
left to the maintainer (「按你认为最优的方式推进吧」). `parts-index` joined the list after `reader-file`, which moves
`page-figures` and every item after it back by one.

On 2026-11-26 `page-figures` still waited for that release of Archify, and `derived-references`, which needs
nothing from it, was ready: it moves before `page-figures`, by the same rule.

On 2026-11-27 `page-figures` still waited for that release, and `compositions`, which needs nothing from it,
was ready: it moves before `page-figures`, by the same rule.

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
- [x] `overview`: the overview drawn by the publisher from what the model states of it, as blocks without positions: a
      masthead's claim and lead, a course of steps with their stations, parallel tracks and lines, further courses
      with one outcome that leaves them, and headed lists, tables and groups. The publisher lays them out on one grid
      by measure and refuses a page too tall for them; the overview composition is retired. It stands before the rest
      of `composable-parts` because the owner ruled on 2026-11-17 that nothing is placed by hand.
- [x] `figures-alone`: a view's figure for use outside the edition. Beside each page's image a delivery holds the
      figure and its key alone, without the page around them, as PNG on a transparent ground and as SVG. A line or
      a boundary is broken where a label stands on it, so no patch of the ground covers anything and the figure
      reads on any light ground. A page's image is 3840 px wide unless the caller names its widths.
- [x] `one-source`: a fact that the product's source forms stands in one place of it, and what repeats the fact
      reads it there. A model states its repository's address once: the address of a file follows from it for
      the two public Forges and is stated only for another host. A delivery's file names, a plate's key and its
      number in two digits, the labels and the staged files that the JavaScript and the Typst share, and the
      house's measures each have one place that states them; a literal that restates a token of the house reads
      the token, and a measure the class repeats becomes a token. A test refuses each repetition that a search
      can find. No delivered byte changes.
- [x] `performance`: a build, the suite and a pipeline take the time their work needs and no more. Each cause a
      profile shows is removed with every delivered byte unchanged, one cause to a commit, measured before and
      after under like conditions and recorded whether it is kept or taken back; the suite runs as wide as its
      machine allows; the two media of a build are made side by side where a measurement shows a gain; and what
      would bring a cost back is refused by a test that counts work, where a bound in
      seconds would fail for the host's reasons. The item ends when the largest cause that a profile of a build
      and of the suite still shows holds under a tenth of its time, or lies in another product and is reported
      there. The times stand in the [record](research/build-and-suite-time.md) and are read at each landing.
- [x] `edition-map`: the landscape edition read as one map. A plate's header names the part of the overview it
      enlarges, as a link back; every plate prints the answer to its question in one place; the overview is set in
      three sizes with fixed roles, for a room, a screen and the zoom. The contents set the overview apart from the
      plates' rows and may take further pages, its rows of one height and the last page not filled; the last page is
      an index of the parts by name, each followed by the numbers of the plates that draw it and no table of parts
      against plates, with what the edition was built from under it, and may take further pages for a large work.
      Every view is reached from the overview, a fact is stated once a page, a note in a narrow column breaks between
      the words of its script, and no justified line is spread wide because the token after it cannot break.
- [x] `reader-file`: the reader file reads as well rendered in a Markdown viewer, for a reader at a screen, as it
      does for one that parses it: one title, no line of the guide's own syntax and no empty link, the names of
      its fields in the model's language, and a check of the file as rendered.
- [x] `parts-index`: a reader learns about a part one link away from the plate. Each part of the index is a short
      paragraph: its name, kind and plates, the details the model states, the parts it reaches and those that reach
      it, each a link to that part's paragraph, and the paths it claims, each a link to the source at the pin. A
      part's name on a plate links to its paragraph. No page a part.
- [x] `derived-references`: the model's vocabulary and the reference documents each have one source. A model's
      fields, enumerations, patterns and limits are stated once, and the schema and the loader's checks both come
      from that statement; the refusal codes stand in one registry; and a table of a reference document that
      restates the source (the commands and their options, the refusal codes, a delivery's files, the versions
      of supplies) is written from the source by a command, so that a document cannot say what the source does
      not.
- [ ] `compositions`: more than one composition of a view, chosen by the view's shape or named by its author:
      tiers, a matrix, a spine and a radial one. A plate's blank space and balance are improved by that choice
      and no longer only recorded. What a census of a built page still finds untidy and no gate holds, more
      styles or stroke weights on a page than the house allows and one mark drawn in two weights, becomes a gate
      or is dropped with its reason.
- [ ] `page-figures`: the page's diagrams are laid out by the publisher. A diagram file of a guide states parts and
      relations and no position, size, row or column; the publisher lays out each kind of diagram and refuses a
      file that places anything. The published works' diagram files lose the positions they hold. A diagram
      file states no repository and no pin either: the publisher fills them from the model, and the works'
      files lose that block.
- [ ] `portrait-edition`: the edition for one reader, as a booklet read on a screen: the overview recomposed for
      the tall page from the same statement, then one page a view, its figure laid out anew for that page and under
      it the reading and a table with a row for each part the figure draws, and the index. It carries the words a
      speaker would say beside the landscape edition's figures, and nothing that another carrier could not hold.
      With it the name "print edition" leaves the product's words and documents: an edition is landscape or
      portrait, and both are made for a screen.
- [ ] `page`: the page in a browser for a reader who questions and checks. It shares the work's question and
      claim, its terms, its pin and the plates' numbers with the editions, gives each view and part a stable
      address, and is checked against the model for them; then it is measured against what Archify offers, and
      what it leaves unused is taken up. It opens with an overview drawn from the model's statement and is titled
      with the model's question. It carries what its reader uses and each cited file once, and its weight is
      measured on the published works ([record](research/page-weight.md)).
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
- [ ] `carriers`: figures of the edition's own for what a work covers beyond its structure, each drawn from what
      the model states and none from positions its author gives. First, from what the product already reads: the
      structure of its repository, an important part
      opened, its history in time and the change between two pins. Then, with what the model newly states: the
      course of a mechanism, the technology it stands on, its plans, its rules and what it writes. With them, an
      author's notes on parts and relations, and a figure of what the work covers and where it is silent. What a
      work is asked to cover follows the kind of repository it describes, and a page that is mostly text is
      composed of tables, lists and code blocks in a layout, never of paragraphs alone.
- [ ] `palettes-and-styles`: style moves beside the model; the built-in palettes take in those the research of
      2026-11-13 held to the print rules; and the house gains further styles, one of them the owner's own.
- [ ] `roles-and-records`: an acceptance records the role, its holder, the delegation and what was judged; the
      reviewer's Skill.
- [ ] `foreign-work`: one work on a repository that is not the maintainer's, written by an agent from the Skill
      alone.
- [ ] `gallery`: the published works shown in public as a gallery, once the product's form is whole. The
      gallery is made by the publisher's own command from the works a publications repository declares, so a
      new work, a new language or a new medium appears in it with nothing listed or placed by hand; the owner
      consented to publishing the works on 2026-11-21 and said that they will grow (「未来会扩展」).
