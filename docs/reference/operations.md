---
subject: architecture-publisher:operations
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Operations reference

`archpub` turns one [Architecture Model](model.md) into a delivery: a print
edition with one plate per view and one interactive page that answers its
question view by view. This page lists the commands, what the build does and the
delivery it writes; the [refusals reference](refusals.md) lists every refusal.

## Installation

Each release delivers the command as one archive per platform the CI verifies:
`archpub-<version>-<platform>.tar.gz` for `linux-arm64`, `linux-x64` and
`macos-arm64`. An archive holds `archpub/bin/archpub`, the Node.js and Typst it
runs in `archpub/libexec`, the package with the libraries it bundles in
`archpub/lib/architecture-publisher` and the licenses of all of them in
`archpub/licenses`.
Unpacked anywhere, the command needs only Git on the path. The release's
`architecture-publisher-<version>.mise.toml` names each archive with its SHA-256
for `mise`, as an `http:archpub` tool:

```toml
[tools."http:archpub"]
version = "<version>"

[tools."http:archpub".platforms]
macos-arm64 = { url = "<release>/archpub-<version>-macos-arm64.tar.gz", checksum = "sha256:<digest>", bin_path = "archpub/bin" }
```

The release's `architecture-publisher-<version>.tgz` is the same command as an
npm package; install it with `npm install --global --ignore-scripts` where
Node.js 22.13 or later is present, with Typst 0.15.1 on the path for the print
edition. The package bundles its four runtime npm dependencies, commander and
clack, which its command line is built on, and fast-wrap-ansi and
fast-string-width, which fit a report to the terminal, with the three small
packages they depend on, so installing it fetches nothing else. The fonts, the house
faces, the measuring library, icons, Archify and the LikeC4 parser are bundled
with their digests, so a build downloads nothing. Git is needed only to resolve
and verify the model's files with `--repo`, and Typst 0.15.1 on the path only
to build the print edition. Git and Archify run with only the caller's `PATH`,
`PATHEXT`, `HOME`, `USERPROFILE`, `TMPDIR`, `TEMP`, `TMP` and `SystemRoot`, so
no other variable, such as `GIT_DIR` or an `ARCHIFY_*` setting, changes what
they read or decide.

## Commands

<!-- commands: written from archpub --help --json by tools/docs/references.mjs; do not edit -->

```text
archpub check <model.json> [--repo <checkout>] [--media <list>] [--png <widths>] [--quality <profile>] [--against <revision>] [--json]
archpub build <model.json> --out <directory> [--repo <checkout>] [--media <list>] [--png <widths>] [--quality <profile>] [--json]
archpub scaffold guide <model.json> --out <directory> [--json]
archpub import likec4 <workspace> --out <model.json> --id <id> [--title <text>] [--question <text>] [--locale <tag>] [--json]
archpub migrate <model.json> --out <model.json> [--json]
archpub compare <delivery> <delivery> [--json]
archpub accept <delivery> --reviewer <name> [--seal-name <name>] [--note <text>] [--sign <key>] [--json]
archpub verify <delivery> [--allowed-signers <file>] [--json]
archpub publish <delivery> --to <root> [--version <name>] [--json]
archpub skill [--json]
archpub <command> --help | archpub help [command]
archpub --version | --help [--json]
```

<!-- end of commands -->

- `check` validates the model, resolves and verifies its
  [files](model.md#files-and-the-repository) when `--repo` names a checkout,
  plans the views, composes each view as a plate of the edition, draws and
  checks the overview the model states and checks each diagram and the page with Archify, and writes no delivery; Archify's work files stay
  in a temporary directory that it removes. It lists the components and
  relations that no planned view draws, the components that claim no file,
  the relations that cite none and the counts of the [data](data.md) a build would write. For each plate it reports its figure's share
  of the body, whether its reading is set beside it, above it or in its head,
  and the balance gates it misses. With
  `--repo`, it reports the model's [coverage](model.md#coverage) of the
  repository at its revision, and with `--against <revision>` how far the
  repository has moved since and what [re-pinning](model.md#re-pinning) to that
  revision would change; `--against` without `--repo` is a usage error.
- `build` does the same and writes a new delivery directory. `--out` must not
  exist; the delivery is staged beside it and renamed into place only when
  every artifact is written, so a refused build leaves nothing behind.
- `--media` names the media to deliver, `edition`, the print edition with its images and figures alone, and `page`;
  by default both. A build composes only what it delivers, so `--media edition` runs no Archify and `--media page`
  needs no Typst; a guide the model names is read for either. `--png` names the widths of the edition's images,
  comma-separated, from 1 to 6000 px, by default 3840. `--quality` is `showcase`, the default, or
  `standard`, which delivers a draft instead of refusing a page diagram that
  misses its checks. An invalid value is refused before the model is read.
- `import likec4` writes a model from a LikeC4 workspace and lists, with its
  file and line, every construct the model cannot represent. `--locale` names
  the model's language; the import's own words, an unnamed relation's label and
  a missing question, are set in it. It names no editors and refuses to
  overwrite an existing file.
- `scaffold guide` writes the page the publisher generates for a model as a
  starting [guide](#the-guide) into a new directory.
- `migrate` writes a version 1 or 2 model as version 3 into a new file. Each
  component of a version 1 model claims the files its sources named and each
  relation cites its sources' files; the command names each file that several
  components cited, which stays with the first of them. A model with an
  `attribution` is refused with `attribution_not_migrated` until its author
  declares `editors` beside it, and the attribution is then dropped. The
  command refuses to overwrite an existing file.
- `accept` records a named reviewer's acceptance of an unchanged delivery and
  sets its [colophon page](#acceptance-and-publication). `--seal-name` names the
  mark instead of the reviewer, and `--sign` signs the acceptance record with an
  SSH key.
- `verify` checks an accepted delivery against its manifest, its acceptance
  record and its colophon page, and with `--allowed-signers` the record's
  signature.
- `publish` copies an accepted delivery with its colophon page, acceptance
  record and signature to `<root>/<model id>/<version>/`, in any directory the
  caller names.

What a command prints is the subject of the [command line reference](command-line.md): its help and usage errors, its exit
statuses, its `--json` result, the report it draws for a reader at a terminal,
and its progress.

## Layout and media

Each view becomes rows of cards on one column lattice. On a plate each card is
as wide as its text and strip within its lattice slot, the cards of one column
share the widest of those widths, and every card of a row has one height; the
page's diagram cards share one width. Declared tiers are the rows, in order; a
tier wider than a row wraps into consecutive rows. Otherwise rows follow the
relations: every relation points down or stays within one row, and the publisher
chooses the rows that skip the fewest rows with their relations, then have the
fewest relations within a row, then the fewest rows. The placement of cards
within their rows is exact: it minimizes a weighted count of crossings, bends
and unused columns over the whole lattice. Relations run through the channels
between rows as buses, corridors, lanes beyond the outermost cards and straight
arrows. A relation that skips rows takes the free column gap, empty cell or lane
that crosses the fewest wires, then runs shortest, and on plates then leaves the
most paper beside the cards it passes.

The layout never draws an overlap. A diagonal segment, a segment shared by
different relations, a wire through a card or a label touching a card, another
label, another wire or the system boundary rejects that layout, and a view is
refused only when no row wrapping, width or type step lays it out. Each channel
takes the routing with the fewest crossings, even when that needs another label
row, and on plates then the one whose own wires make the fewest route defects;
it keeps parallel wires 24 px apart and a label 16 px from another relation's
wire wherever the cards leave room, and a wire that turns on a label row within
the span of a card it does not connect turns 48 px from it. A card's one port
stands 40 px off its centre when that centre lines up with a wire into the card
across the channel that its own wire does not enter. Two relations' jogs and
labels on one label row, and the tracks of one band, keep 48 px apart, or the
row reads as one labelled bus; a lane keeps at least 48 px from the cards and
the system boundary. Crossings that the relations force are allowed; they and
the route defects, wires closer than those distances or closer than 40 px for
more than 96, arrowheads closer than two heads, a wire that stops less than 48
px short of another in line with it, so seems to continue it, a wire that turns
less than 48 px beside a card it does not connect, so seems to leave that card,
two relations' runs in line less than 400 px apart across a third relation's
wire, unless both leave or enter one card, two wires closer than 40 px that
each turn inside the other's length, and a relation label on its own run less
than 48 px above or below another relation's turn, so seems to label that wire,
are counted in each plate's measures.
Each row wrapping is also laid out with channels that take more label rows so
that no wire turns in a band beside another card than its own; a plate takes
that taller figure when the body holds it and it has no more route defects.

Each view is one plate: a figure laid out for the edition's body, 2256 × 1071 px
at two thirds of a point each, with no text below 14 px. Cards are as large as
what they hold and never stretch; a sparse view is instead set at a larger type
step, up to 32 px labels and 24 px details. A plate tries every type step and
row wrapping, with its rows centred over all its cards, over the cards inside
the boundary, and uncentred, and with its numbered tier labels in one column
before the figure or each before the edge its tier starts at. It takes the
fewest crossings, then the fewest route defects, then the largest step, then the
widest wrapping, then the least of the body left blank, and the manifest records
its composition. A tier wrapped into several rows has its label level with its
first row, beside a bracket that spans them all. Each plate is measured against
four balance gates over the body: its largest blank rectangle covers at most 12
percent of it, no blank band 96 px or taller runs across it, at most 40 percent
of it lies in empty squares of 240 px or more, and its centre of mass lies
within 12 percent of the centre across and down. The gates a plate misses are
recorded with their values and limits, not refused; a view no composition lays
out is refused with `plate_unfittable`. Figure text is measured in Source Sans
3, its semibold for heavy text, and Noto Sans CJK SC for the characters the
first lacks; lines break at spaces but not at no-break spaces, and between Han
and Kana characters, keeping closing punctuation on the line before. A plate
draws each part as [one card](model.md#parts-and-palette) in the edition's
palette; a card is a box as wide as its widest region, so placement and every
gate run on boxes. It is composed for cards without details, and its cards set
every detail when that costs it no room, no type step and no wiring, which its
composition records. A plate is drawn as the SVG of its shapes and a list of
text runs, which the edition sets as text.

A plate's page is its figure and its view's reading. The figure takes the
narrowest of 100, 80 and 65 percent of the body's width at which it wires with
no more crossings and route defects than at the full width. A view with a
summary gives up at least a fifth: its figure takes 80 percent, at the type step
that width allows, or 65 percent when that keeps the same step. When 80 percent
would wire worse, the figure keeps the full width and gives up the top of the
body instead: the engine breaks the summary at 17 points of Source Serif 4 into
lines of at most 32 ems, and the figure takes the body's height less 24 points
for each line and 16 points more. The plate then sets the summary above the
figure, justified within 32 ems in the title's column, its first baseline 24
points below the body's top, and the figure stands on the body's bottom. When
the figure would wire worse there too, it keeps the whole body and the summary
stands in its head, at most three lines (the manifest's `omitted`), more refused
with `edition_reading_too_long`; one above has neither the paths nor their heading. The engine measures
the summary as Typst sets it, with a quarter em between Han and the letters and
digits beside it, some full-width marks at half their width and the faces' own
pair kerning; should Typst need more lines than the engine reserved, the plate
sets the engine's lines flush left. A view without a summary gives up only width
its figure leaves at the full width, at its own step, and only when one of its
components claims files. Beside the figure, 40 points from it, the plate sets
the view's summary, justified like the edition's prose at any width of its
column, and then where each component it shows lives: its label and the paths it
claims. When the summary and the paths together are taller than the body, the
plate sets the summary alone, without the heading or the paths. A summary taller
than the body on its own, or paths taller than it beside no summary, is refused
with `edition_reading_too_long`, since text is never shrunk. `check` and the
manifest, which plan plates without typesetting them, record such a reading as
set. Blank inside a figure, which the view's structure leaves, stays: `check`
reports it, and reshaping the view is its author's choice.

The print edition is typeset by Typst 0.15.1 with the house class into
`<model id>.pdf`, pages of 1600 × 900 points:

- a title page of the work's name, question and summary over a byline of its
  release and revision, editors, licence and publisher;
- contents: the overview's entry, scope, limits and reading note, then a linked row a plate, ten a half at most;
- the overview, drawn from what the model states when it states one;
- one plate per view, headed by its number, title and question and a link back to the overview, its figure
  beside the view's reading when it leaves part of the body or below it, or the answer in its head, when it
  keeps the full width, with a key of what its figure shows and its cards do
  not say: the commit the age bands count from, whose date the foot states, the bands, a scale bar, a count of cited
  files, a line into the hub, the boundary, the ground of a part outside it or,
  in a group's view, outside the group, and the statuses, and no kind;
- an index of the parts by name, each a short paragraph: its kind and its plates' numbers as links, the details
  the model states, the parts it reaches and those that reach it, each a link to that part's paragraph, and the
  paths it claims, each a link to the source at the pin (the house's `indexPaths` at most, the rest counted; a path
  wider than the column breaks after its slashes); over the repository, files read, page and data.

Every page after the title page shares one frame: a head at the margin, a body
from 112 to 826 points, the key and a foot of a rule and the work's title,
release, revision and date, which links back to the contents. The key's baseline
is at 850 points on every plate, each mark centred on its label's middle; a key
wider than the body takes a second line, the two about 850 points, and one that
two lines do not hold is refused with `edition_key_too_long`. Prose is justified
and hyphenated within a measure of 32 ems, in Source Serif 4 for titles and
Source Sans 3 for text, with Noto Sans CJK SC for Han. Each plate's runs are set
where the engine measured them, with the faces' kerning; in a Chinese edition a
part's details wrap as a paragraph, a last line of one character taking the unit
before it, and each line but a detail's last is spread to their measure unless
its slack is over a tenth of an em for each place it opens. A run Typst sets
wider, or a summary line above its figure wider than 32 ems, is refused with
`edition_text_wider`, a title longer than its line with
`edition_title_too_long`. A card's title links to its component's paragraph in
the index, whose paths link to the source at the pinned revision where the model's
repository has an address to browse. Each plate is a figure with alt
text of its title and question, its shapes and key artifacts; the model is
attached as `model.json` with the relationship `source`, so the PDF conforms to
PDF/A-3a and PDF/UA-1. Its title, authors, subject, keywords and language come
from the model; it is dated by the revision's commit with `--repo`, otherwise by
`SOURCE_DATE_EPOCH` when set, and otherwise by the time it is typeset, which the
manifest records. Typst also renders the overview's page and each plate's page
as PNG at each `--png` width, at width × 72 / 1600 pixels per inch.

The page is one Archify explainer, delivered by the vendored, unmodified
Archify 3.3.0. Its heading is the model's question, its conclusion the summary,
listed beside it the titles of up to four panels, each a link to its panel, and
its scope the model's scope, limits and editors. Each view is a panel
titled with the view's question, or its title when it asks the model's own
question, in the plan's order, holding the view's native architecture diagram,
named by the view's own title or else its question, which opens Archify's full
interactive viewer, and one step per component, in
the diagram's reading order, that lights the component and gives every one of
its details; a card shows the first detail it holds whole, or none.

A view's diagram is laid out by the same grid with Archify's text metrics, at
widths of 960, 840 and 720 units with its rows wrapped at five, four and three
cards, or at two and one when none of those lays out; its cards are at least as
wide as its longest label needs, at most 200 units unless that label needs more,
and a label wider than 640 units is refused. Archify routes the relations and
places their labels. A relation between neighbors in a row runs below the row
when its label does not fit between them, and a relation that skips rows or
passes cards in its row names no sides, so Archify routes it around the cards
between. A candidate omits the system boundary when the outside components
cannot stay outside it. Each candidate is measured with the grid's connection
sides and with every side left to Archify, which plans all sides together.
Archify validates every candidate at the build's quality profile and lays out
its routes, which archpub measures for what Archify does not report: two routes
that read as one, running side by side closer than 8 units along more than 16,
lining up within 8 units of one line and less than 32 units apart with no card
between them, or ending at one point, unless they leave one card there and at
most one carries a label, as one labelled relation fans out; a route along a
card's or the boundary's edge, closer than 12 units along more than 16; two
routes doubled, 8 to 24 units apart along more than 64; a relation label read as
another's, when another route, a card or another label comes nearer it than 8
units or than one and a half times its own route's distance, or when a route
running the same way past its other side stands less than one and a half times
as far from its text, taken as five sixths as wide as Archify estimates it, as
the route it is set beside; a label that crowds, when anything else, a
boundary's outline included, comes nearer than 16 units or than two and a half
times its own route's distance; and two route ends less than 24 units apart on
one side of a card. Among the candidates that pass, the page takes the fewest
routes that read as one or run along an edge, then the fewest crossings, then
the fewest labels read as another's, then one narrow enough for Archify's reader
to set beside its steps at 1440 px, then the fewest doubled routes, routes over
two bends, crowded labels, crowded route ends and route stretch, then the shape
nearest 1.0 to 1.8 times as wide as high. When the best stands above its steps,
the view is also measured in rows of two at 720 and 600 units wide. When the
choice still crosses, reads two routes as one, runs a route along an edge, has a
label read as another's or crowded, or stands above its steps, the connections
involved take other sides, one at a time from the three best diagrams and the
three best beside their steps, within 96 measured changes, wherever that ranks
the diagram higher. A label still read as another's or crowded is then pinned,
on the three best diagrams by their routes, inside the canvas on or beside the
middle of a segment of its own route, or three eighths, a quarter or an eighth
of the way from either end, where nothing else is taken for it, and the page
chooses again, in up to three rounds that each pin anew what the round before
left misplaced. A label that another route's line, carried 40 units past its
corner, runs into counts as crowded. A pin is an offset from where Archify
anchors the label: an anchor of its own would take the route's ends out of
Archify's spreading, so that they could meet another route's. The pin is found
on the layout with the label at that anchor, where its route already takes the
course it keeps once pinned. Archify runs other routes around a pinned label, so
a label read as another's is also pinned alone, and a label pinned on a segment
masks its route, which runs on at least 8 units past it at either end. A view
without a candidate that passes refuses the build with Archify's findings; a
diagram never drops a component or relation to fit.

When the model declares a repository URL and revision, each step cites the
component's first file, the first file of its first claim, as a numbered page
source at that revision, listed under the component's name, and the step of a
component without details names that file; the checkout's remotes are not
read. Without a checkout, only a first claim that names one file is cited.
Archify will not cite a file of a sensitive class, such as a path with a
`secrets` segment, so such a file is withheld from the page and recorded as
withheld in the manifest, and the component cites its next file. In a 1440 × 900 window every preview fits its panel, primary
labels render at 13.25 CSS px or more in the previews and at 14 CSS px or more
in the full viewer.

## The overview

The publisher draws the overview from the model's
[statement](model.md#overview): the course across the first band, each step as
wide as what it holds, and the blocks in the order stated, in halves and thirds
chosen by measured height. A point or a block that names its view is followed by
its plate's number, a link in the edition. A text of more than one line is
justified. A page too tall at the house's spacing is set closer, at the same
sizes, and one too tall at both is refused with `overview_too_tall`,
naming the first block that does not fit; the rows share the height they leave,
so the page is full. The page is drawn in a root Typst may not leave, with the
house faces, Noto Sans CJK SC and no package; each text's glyph box must stay 48
pt from either side and 16 pt from the top and the bottom, over no other text
and under no line or ring (`overview_text_over_line`). The print edition sets
the page in place with the edition's foot, so its text stays text; it is
delivered as `images/00-overview.png` and at each other `--png` width, the same
bytes from the same inputs.

## The guide

When the model names a [guide](model.md#guide), the page is the guide. The build
reads the draft and the files its `@diagram source=`, `@chart data=` and `@image
path=` arguments name, each a regular file in the draft's own directory, and
refuses a link, another path or a missing file. A draft whose `@meta` names a
`repo_url` or `repo_revision` other than the model's repository URL and revision
is refused. Before Archify reads the draft, the publisher lays out its diagrams: an
architecture file among Archify's own layouts, ranked by what a reader
misreads, as the generated page's diagrams are; an entity-relationship or class
file on a grid of two to four columns, a domain's members side by side; a
workflow in the columns its edges give; a dataflow on Archify's five rows, each
stage in a row pattern of Archify's own examples, the first candidate Archify
passes with every route measure zero, else the first it passes; a
sequence's messages 48 apart from 160 down, as Archify's draft shorthand sets them. With `--repo`, each file names the
model's repository and revision, and the Forge and link mode the draft names,
so that Archify verifies the sources it cites. The manifest records the files
as the author wrote them. Archify validates and delivers the
draft at the build's quality, with its writing checks strict at `showcase` and
warnings at `standard`.

With `--repo` and a model that names its repository URL and revision, the build
hands Archify a temporary clone of the checkout that shares its objects, with
`origin` at the model's repository URL and `HEAD` at the model's revision.
Archify verifies every repository source and line range the guide cites against
that commit and pins its code excerpts; the clone is removed once the page is
written, and the checkout is only read. Archify recognizes repositories on
`github.com`, `gitlab.com` and `gitee.com`; a guide whose repository is a
self-hosted GitLab names `repo_provider=gitlab` in its `@meta`. Without
`--repo`, or when no page is built, the guide's sources are recorded as declared.

`archpub scaffold guide` writes the page the publisher generates as a starting
guide: `guide.archify.md` and one architecture document per view, without the
layout and repository the publisher sets when the guide is built. Its prose is
the model's, which the strict writing checks may hold to shorter sentences;
Archify reports each one at its line. Archify 3.2.0 cut a validation receipt
over 64 KiB on macOS, as an 11-view page's was (not measured with 3.3.0); Archify's own
guidance keeps a page to four native diagrams.

## The delivery

| File                            | Content                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `<model id>.pdf`                | The print edition, unless excluded.                                                                         |
| `<model id>.html`               | The standalone interactive page, unless excluded.                                                           |
| `images/00-overview.png`        | The overview's page at 3840 px wide, when the model states an overview.                                     |
| `images/NN-<view>.png`          | Plate `NN`'s page at 3840 px wide, numbered from 01 in reading order.                                       |
| `images/<name>-<width>.png`     | The overview's or a plate's page at each other width `--png` names.                                         |
| `figures/NN-<view>.png`, `.svg` | Plate `NN`'s figure and key alone: a PNG on a transparent ground, and an SVG of shapes and outlined glyphs. |
| `model.json`                    | The model the build read, byte for byte; in every delivery.                                                 |
| `<model id>.json`               | The pinned edition as [data](data.md); in every delivery.                                                   |
| `<model id>.md`                 | The [reader file](data.md#the-reader-file); in every delivery.                                              |
| `manifest.json`                 | The build record, which names every file above with its digest.                                             |
| `acceptance.json`               | The acceptance record `archpub accept` writes; absent until then.                                           |
| `acceptance.sig`                | The record's SSH signature, when the reviewer signs it.                                                     |
| `colophon.pdf`                  | The colophon page `archpub accept` sets; absent until then.                                                 |

Nothing else is written at the top of the delivery.

The manifest records its format and version 9, the publisher's name and version, the model id, title, language,
digest, size and file, the declared repository, the build's quality and media, in `style` the edition's
palette's id (`custom` for the model's own) with its Chinese and English names and its resolved ground, ink, dye
steps and accent, and where it draws strips the age bands' spans in seconds, the pin's date and the length in px its
largest part is drawn at, in `sources` the binding's state and the count of the files it recorded, the digest of each
bundled supply, each view with its tiers, members and plate number, the edition's file, page count, Typst version,
house class digest, release, date and what dated it, each plate with its number, views, share of the body, reading,
images, figure files, composition, measures and the gates it misses, the page's file, quality profile and gates, a guide's draft
path and digest, each file it names, its writing level and whether its sources were verified, each view diagram's
width, height, rows, sides, re-sided connections, pinned labels, whether its preview stands beside its steps,
candidate count and Archify route measures, the files the page withholds, with the overview its statement's digest,
the house class's digest, the Typst version, the revision's date and the number of texts, in `data` the
data's file with its counts of statements, facts, rows and cited ranges of evidence, each plate's face and a guide's
matched figures, in `reader` the reader file's name, size in bytes and number of statements, and the path, size and
SHA-256 of every artifact. The record of each cited file and the details, status and files of every component and
relation stand once, in the [data](data.md), and no longer in the manifest. It contains no host path or user name,
and the edition's date is the revision's commit or `SOURCE_DATE_EPOCH`, so building the same model with the same
version on one platform reproduces every byte; without either, the edition is dated when it is typeset and differs
from build to build. `archpub check --json` carries the manifest's counts of the data under `data`.

## Acceptance and publication

`archpub accept` verifies every artifact against the manifest, sets the colophon
page and writes `colophon.pdf`, `acceptance.json` and, when the reviewer signs,
`acceptance.sig` beside the delivery. None of them is in the manifest, and no
artifact changes. A changed artifact, any of the three files already present,
an empty reviewer or an empty seal name is refused.

Acceptance records who accepted which bytes and when; it does not certify that
the architecture is correct.

The colophon page is one page in the edition's size and language, set by the
house class with the pinned Typst and the house faces. Its round mark in
cinnabar carries the publisher's word for accepted, such as ACCEPTED or 验收,
and the date on its rim, and the reviewer's name, or the seal name, across a
band through its centre: at the largest size from 13 down to 7 percent of the
mark's width that fits one line, or else two lines at that size, broken where
they are most even. A name with a character the house faces (Latin, Greek,
Cyrillic, Han, Kana and Hangul) do not draw is refused with
`acceptance_name_unset`, and `--seal-name` gives the mark a name they draw,
which the slip then uses too; a name too long for two lines at 7 percent is
refused with `acceptance_name_too_long`. The mark carries nothing else.

Beside it, the acceptance slip names the reviewer, the UTC time of acceptance,
the subject (the model's title and release), the commit, the manifest's
SHA-256, the signing key's fingerprint or "Unsigned", and any note; below them
stand the sentence on what acceptance establishes and the published files that
hold the record, with the command that checks them. The same acceptance sets
the same bytes. A note with a character no house face draws is refused by
Typst's PDF/A check with `colophon_typst_error`.

`acceptance.json` is an [in-toto Statement](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md)
version 1 of `manifest.json` and `colophon.pdf` by SHA-256, with the
`predicateType` `https://github.com/HengYangDS/architecture-publisher/acceptance/v2`
and a predicate of `reviewer`, `sealName` and `note` when given, `acceptedAt`
(UTC to the second, or `SOURCE_DATE_EPOCH`), the `model` id and, when signed,
the `signer`'s fingerprint `SHA256:<base64>`.

With `--sign <key>`, or a public key whose private half ssh-agent holds
through the caller's `SSH_AUTH_SOCK`, `ssh-keygen -Y sign -n archpub-acceptance`
signs the exact bytes of `acceptance.json` into `acceptance.sig`; a key it
cannot use is refused with `acceptance_sign_failed` before anything is written.

`archpub verify` checks, and refuses at the first link that fails, every
artifact against the manifest, the record's form and predicate version, its
manifest digest, the colophon page's digest, that `acceptance.sig` is present
exactly when the record names a signer and, with `--allowed-signers <file>`,
that `ssh-keygen -Y verify` accepts `acceptance.sig` over `acceptance.json` for
the reviewer as principal in the namespace `archpub-acceptance`, by the key the
record names. The file is ssh-keygen's, one principal and key to a line, a name
with spaces in double quotes; by hand the check is
`ssh-keygen -Y verify -f <file> -I <reviewer> -n archpub-acceptance -s acceptance.sig < acceptance.json`.
Without `--allowed-signers` the result says whether the record is signed.

`archpub publish` verifies the delivery as `verify` does without signers and
copies it with its colophon page, record and signature. The version defaults to
the first 12 hexadecimal digits of the manifest digest. The copy is staged and
verified before it is renamed into place; publishing an identical delivery
again changes nothing, and a different one under an existing version is refused.

`verify` and `publish` refuse a record of an earlier release or predicate
version with `acceptance_version_unsupported`: remove it and accept the
unchanged delivery again. Published versions keep their records.
