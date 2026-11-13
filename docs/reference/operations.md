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
question view by view. This
page lists the commands, what the build does, the delivery it writes and every
refusal.

## Installation

Each release delivers the command as one archive per platform the CI verifies:
`archpub-<version>-<platform>.tar.gz` for `linux-arm64`, `linux-x64`, `macos-arm64`,
`windows-arm64` and `windows-x64`. An archive holds `archpub/bin/archpub` (`archpub.cmd` on
Windows), the Node.js and Typst it runs in `archpub/libexec`, the package in
`archpub/lib/architecture-publisher` and their licenses in `archpub/licenses`.
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
edition. The package has no runtime npm dependencies: the fonts, the house
faces, the measuring library, icons, Archify and the LikeC4 parser are bundled
with their digests, so a build downloads nothing. Git is needed only to resolve
and verify the model's files with `--repo`, and Typst 0.15.1 on the path only
to build the print edition. Git and Archify run with only the caller's `PATH`,
`PATHEXT`, `HOME`, `USERPROFILE`, `TMPDIR`, `TEMP`, `TMP` and `SystemRoot`, so
no other variable, such as `GIT_DIR` or an `ARCHIFY_*` setting, changes what
they read or decide.

## Commands

```text
archpub check <model.json> [--repo <checkout>] [--against <revision>] [--media <list>] [--png <widths>] [--quality <profile>] [--json]
archpub build <model.json> --out <directory> [--repo <checkout>] [--media <list>] [--png <widths>] [--quality <profile>] [--json]
archpub import likec4 <workspace> --out <model.json> --id <id> [--title <text>] [--question <text>] [--locale <tag>] [--json]
archpub scaffold guide <model.json> --out <directory> [--json]
archpub migrate <model.json> --out <model.json> [--json]
archpub accept <delivery> --reviewer <name> [--seal-name <name>] [--note <text>] [--sign <private key>] [--json]
archpub verify <delivery> [--allowed-signers <file>] [--json]
archpub publish <delivery> --to <root> [--version <name>] [--json]
archpub --help | --version [--json]
```

- `check` validates the model, resolves and verifies its
  [files](model.md#files-and-the-repository) when `--repo` names a checkout,
  plans the views, composes each view as a plate of the edition, checks the
  overview's composition and checks each diagram and the page with Archify, and writes no delivery; Archify's work files stay
  in a temporary directory that it removes. It lists the components and
  relations that no planned view draws, the components that claim no file and
  the relations that cite none. For each plate it reports its figure's share
  of the body, whether its reading is set beside it, set above it or left out,
  and the balance gates it misses. With
  `--repo`, it reports the model's [coverage](model.md#coverage) of the
  repository at its revision, and with `--against <revision>` how far the
  repository has moved since and what [re-pinning](model.md#re-pinning) to that
  revision would change; `--against` without `--repo` is a usage error.
- `build` does the same and writes a new delivery directory. `--out` must not
  exist; the delivery is staged beside it and renamed into place only when
  every artifact is written, so a refused build leaves nothing behind.
- `--media` names the media to deliver, `edition`, the print edition with its
  images, and `page`; by default both. A build composes only what it delivers,
  so `--media edition` runs no Archify and `--media page` needs no Typst.
  `--png` names the widths of the edition's images, comma-separated, from 1 to
  6000 px, by default 2400. `--quality` is `showcase`, the default, or
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

Exit status 0 means success, 1 a refused input, 2 a usage error and 3 an
internal error, any other failure, such as a file the command cannot read or
write. With `--json`, the command prints one JSON object: `{ "ok": true, ... }`
with the result, `{ "ok": false, "code", "message", "problems" }` for a
refusal, where each problem has a `code`, a JSON `path` into the model and a
`message`, `{ "ok": false, "code": "usage", "message" }` for a usage error, or
`{ "ok": false, "code": "internal_error", "message" }`. Without `--json`,
the same result is one line of text, which `check` follows with a line for each
report that has something to say, and a refusal lists each problem on its own
line.

## Layout and media

Each view becomes rows of cards on one column lattice. On a plate each card is
as wide as its own text within its lattice slot, the cards of one column share
the widest of those widths, and every card of a row has one height; the page's
diagram cards share one width. Declared tiers are the rows, in order; a tier
wider than a row wraps into consecutive rows. Otherwise rows follow the
relations: every relation points down or stays within one row, and the
publisher chooses the rows that skip the fewest rows with their relations, then
have the fewest relations within a row, then the fewest rows. The placement of
cards within their rows is exact: it minimizes a weighted count of crossings,
bends and unused columns over the whole lattice. Relations run through the
channels between rows as buses, corridors, lanes beyond the outermost cards and
straight arrows. A relation that skips rows takes the free column gap, empty
cell or lane that crosses the fewest wires, then runs shortest, and on plates
then leaves the most paper beside the cards it passes.

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

Each view is one plate: a figure laid out for the edition's body, 2256 × 1071
px at two thirds of a point each, with no text below 14 px. Cards are as large
as their text and never stretch; a sparse view is instead set at a larger type
step, up to 32 px labels and 24 px details. A plate tries every type step and
row wrapping, with its rows centred over all its cards, over the cards inside
the boundary, and uncentred, and with its numbered tier labels in one column
before the figure or each before the edge its tier starts at. It takes the
fewest crossings, then the fewest route defects, then the largest step, then
the widest wrapping, then the least of the body left blank, and the manifest
records its composition. A tier wrapped into several rows has its label level
with its first row, beside a bracket that spans them all. Each plate is
measured against four balance gates over the body: its largest blank rectangle
covers at most 12 percent of it, no blank band 96 px or taller runs across it,
at most 40 percent of it lies in empty squares of 240 px or more, and its
centre of mass lies within 12 percent of the centre across and down. The gates
a plate misses are recorded with their values and limits, not refused; a view
no composition lays out is refused with `plate_unfittable`. Figure text is
measured in Source Sans 3, its semibold for heavy text, and Noto Sans CJK SC
for the characters the first lacks; lines break at spaces but not at no-break
spaces, and between Han and Kana characters, keeping closing punctuation on the
line before. A plate draws its parts with the edition's
[marks](model.md#marks-and-palette), in its palette: a card draws its kind's
Lucide icon, and a part drawn as a strip has a box as wide as the larger of its
text and its strip, so placement and every gate run on boxes with either marks.
A plate is drawn as the SVG of its shapes and a list of text runs, which the
edition sets as text.

A plate's page is its figure and its view's reading. The figure takes the
narrowest of 100, 80 and 65 percent of the body's width at which it wires with
no more crossings and route defects than at the full width. A view with a
summary gives up at least a fifth: its figure takes 80 percent, at the type
step that width allows, or 65 percent when that keeps the same step. When 80
percent would wire worse, the figure keeps the full width and gives up the top
of the body instead: the engine breaks the summary at 17 points of Source Serif
4 into lines of at most 32 ems, and the figure takes the body's height less 24
points for each line and 16 points more. The plate then sets the summary above
the figure, justified within 32 ems in the title's column, its first baseline 24
points below the body's top, and the figure stands on the body's bottom. When the
figure would wire worse at that height too, it keeps the whole body and the
manifest records its reading as left out. A summary above the figure carries
neither the heading for where each part lives nor the paths. The engine
measures the summary as Typst sets it, with a quarter em between Han and the
letters and digits beside it and some full-width marks at half their width,
but without the faces' kerning; should Typst need more lines than the engine
reserved, the plate sets the engine's lines flush left. A view without a summary gives up only width its
figure leaves at the full width, at its own step, and only when one of its
components claims files. Beside the figure, 40 points from it, the plate sets
the view's summary, justified like the edition's prose at any width of its
column, and then where each component it shows lives: its label and the
paths it claims. When the summary and the paths together are taller than the
body, the plate sets the summary alone, without the heading or the paths. A
summary taller than the body on its own, or paths taller than it beside no
summary, is refused with `edition_reading_too_long`, since text is never
shrunk. `check` and the manifest, which plan plates without typesetting them,
record such a reading as set. Blank inside a figure, which the view's structure
leaves, stays: `check` reports it, and reshaping the view is its author's
choice.

The print edition is typeset by Typst 0.15.1 with the house class into
`<model id>.pdf`, pages of 1600 × 900 points:

- a title page of the work's name, question and summary over a byline of its
  release and revision, editors, licence and publisher;
- contents whose rows link to their pages and continue on a second page past
  sixteen, beside the edition's facts, its scope and limits and a reading note;
- the overview, set in place from its composition when the model names one;
- one plate per view, headed by its number, title and question, its figure
  beside the view's reading when it leaves part of the body or below it when it
  keeps the full width, with a key of what its figure shows: with cards, the
  kinds, the boundary and the statuses; with strips, the age bands and the
  pin's date, a scale bar, the citation ticks, the hub, the boundary and the
  statuses.

Every page after the title page shares one frame: a head at the margin, a body
from 112 to 826 points, the key at 848 and a foot of a rule and the work's
title, release, revision and date, which links back to the contents. Prose is
justified and hyphenated within a measure of 32 ems, in Source Serif 4 for
titles and Source Sans 3 for text, with Noto Sans CJK SC for Han. Each plate's
runs are set where the engine measured them; a run Typst sets wider, or a line
of a summary above its figure that Typst sets wider than 32 ems, is refused
with `edition_text_wider`, and a title longer than its line with
`edition_title_too_long`. When the model declares `repository.browse`, each card
title links to its component's first file at the pinned revision. Each plate is
one figure with alt text of its title and question, its shapes and key are
artifacts, and the model is attached as `model.json` with the relationship
`source`, so the PDF conforms to PDF/A-3a and PDF/UA-1. Its title, authors,
subject, keywords and language come from the model; it is dated by the
revision's commit with `--repo`, otherwise by `SOURCE_DATE_EPOCH` when set, and
otherwise by the time it is typeset, which the manifest records. Typst also
renders the overview's page and each plate's page as PNG at each `--png` width,
at width × 72 / 1600 pixels per inch.

The page is one Archify explainer, delivered by the vendored, unmodified
Archify 3.2.0. Its heading is the model's question, its conclusion the summary,
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

The overview is the work's composition, typeset by Typst 0.15.1 with the house
class. The build stages the composition's Typst files, the class and the model
in one root Typst may not leave, ignores system and embedded fonts, offers only
the house faces, Source Serif 4 and Source Sans 3, and the bundled Noto Sans CJK
SC, and points Typst's package directories at an empty temporary directory.
Before typesetting it refuses a composition that imports a package, loads a
plugin, or sets a size, face, colour or the page itself. Each text the class
sets records its glyph box, which the build reads back: text must stay 48 pt
from either side and 16 pt from the top and the bottom, and no text may lie
over other text. A character no available face draws is refused, because Typst
would draw an empty box without warning, and every Typst warning or error is
refused at the composition's line. The print edition then sets the composition
in place, with the edition's foot as its imprint, so its text stays text; its
page is delivered as `images/00-overview.png` and at each other `--png` width,
and the same inputs give the same bytes.

## The guide

When the model names a [guide](model.md#guide), the page is the guide. The
build reads the draft and the files its `@diagram source=`, `@chart data=` and
`@image path=` arguments name, each a regular file in the draft's own directory,
and refuses a link, another path or a missing file. A draft whose `@meta` names
a `repo_url` or `repo_revision` other than the model's repository URL and
revision is refused. Archify validates and delivers the draft at the build's
quality, with its writing checks strict at `showcase` and warnings at
`standard`.

With `--repo` and a model that names its repository URL and revision, the build
hands Archify a temporary clone of the checkout that shares its objects, with
`origin` at the model's repository URL and `HEAD` at the model's revision.
Archify verifies every repository source and line range the guide cites against
that commit and pins its code excerpts; the clone is removed once the page is
written, and the checkout is only read. Archify recognizes repositories on
`github.com`, `gitlab.com` and `gitee.com`; a guide whose repository is a
self-hosted GitLab names `repo_provider=gitlab` in its `@meta`. Without
`--repo`, the guide's sources are recorded as declared.

`archpub scaffold guide` writes the page the publisher generates as a starting
guide: `guide.archify.md` and one architecture document per view. Its prose is
the model's, which the strict writing checks may hold to shorter sentences;
Archify reports each one at its line. Archify 3.2.0 cuts a validation receipt
longer than 64 KiB on macOS, which an 11-view page reaches; Archify's own
guidance keeps a page to four native diagrams.

## The delivery

| File                        | Content                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| `<model id>.pdf`            | The print edition, unless excluded.                                      |
| `<model id>.html`           | The standalone interactive page, unless excluded.                        |
| `images/00-overview.png`    | The overview's page at 2400 px wide, when the model names a composition. |
| `images/NN-<view>.png`      | Plate `NN`'s page at 2400 px wide, numbered from 01 in reading order.    |
| `images/<name>-<width>.png` | The overview's or a plate's page at each other width `--png` names.      |
| `manifest.json`             | The build record.                                                        |
| `acceptance.json`           | The acceptance record `archpub accept` writes; absent until then.        |
| `acceptance.sig`            | The record's SSH signature, when the reviewer signs it.                  |
| `colophon.pdf`              | The colophon page `archpub accept` sets; absent until then.              |

Nothing else is written at the top of the delivery.

The manifest records its format and version 7, the publisher's name and
version, the model id, title, language, digest and size, the declared
repository, the build's quality and media, in `style` the edition's marks, its
palette's id (`custom` for the model's own) with its Chinese and English
names and its resolved ground, ink, dye steps and accent, and with strips the
age bands' spans in seconds, the pin's date and the length in px its largest
part is drawn at, every cited file with its
state, digest, size in bytes, the UTC date of its last change at the pin, owner
and the relations that cite it, the digest of each bundled supply, each view
with its tiers, members and plate number, the edition's file,
page count, Typst version, house class digest, release, date and what dated it,
each plate with its number, views, share of the body, reading, images,
composition, measures and the gates it misses, the page's file, quality profile and gates, a guide's draft path and digest, each file it names,
its writing level and whether its sources were verified, each
view diagram's width, height, rows, sides, re-sided connections, pinned labels, whether its
preview stands beside its steps, candidate count and Archify route measures,
the files the page withholds, with the overview its composition's path and
digest, the house class's digest, the Typst version, the revision's date and
the number of texts, the details,
status and files of every component and relation, and the path, size and
SHA-256 of every artifact. It contains no host path or user name, and the
edition's date is the revision's commit or `SOURCE_DATE_EPOCH`, so building the
same model with the same version on one platform reproduces every byte; without
either, the edition is dated when it is typeset and differs from build to
build.

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
cinnabar carries the publisher's word for accepted, such as ACCEPTED or 验收, and
the date of acceptance on its rim, and the reviewer's name, or the seal name,
straight across a band through its centre. The name takes the largest size
between 7 and 13 percent of the mark's width at which it fits the band on one
line, or else on two lines at that size, before any smaller size is tried; two
lines break where they are most nearly even, at a space, after a hyphen or
between Han, Kana or Hangul characters. The house faces draw Latin, Greek,
Cyrillic, Han, Kana and Hangul; a name with another character is refused with
`acceptance_name_unset`, which names the characters, and `--seal-name` gives the
mark a name the faces draw. The slip then names the reviewer by the seal name
too when no face draws the reviewer's own name. A name that does not fit two
lines of the band at 7 percent is refused with `acceptance_name_too_long`. The
mark carries nothing else, so two acceptances by one reviewer on one day carry
the same mark.

Beside the mark, the acceptance slip names the reviewer, the time of acceptance
in UTC, the subject, which is the model's title and release, the commit the
edition was built at, the manifest's SHA-256, the signing key's fingerprint or
"Unsigned", and the note when there is one. Below it stand the sentence on what
acceptance establishes and the files published with the edition that hold the
record, with the command that checks them. Setting the same acceptance again
gives the same bytes. A note with a character no house face draws is refused by
Typst's PDF/A check with `colophon_typst_error`.

`acceptance.json` is an [in-toto Statement](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md)
version 1. Its two subjects are `manifest.json` and `colophon.pdf` with their
SHA-256 digests, its `predicateType` is
`https://github.com/HengYangDS/architecture-publisher/acceptance/v2`, and its
predicate holds the `reviewer`, the `sealName` and `note` when given,
`acceptedAt`, the UTC time to the second, the `model` id and, when signed, the
`signer`, the signing key's fingerprint `SHA256:<base64>`. `SOURCE_DATE_EPOCH`
sets the time of acceptance when the caller sets one.

With `--sign <private key>`, `ssh-keygen -Y sign -n archpub-acceptance` signs
the exact bytes of `acceptance.json`, and the armoured signature is written to
`acceptance.sig`. `--sign` may name a public key whose private half ssh-agent
holds; ssh-keygen runs with the caller's `SSH_AUTH_SOCK` beside the usual
variables. A key ssh-keygen cannot use is refused with `acceptance_sign_failed`
before anything is written.

`archpub verify` checks, and refuses at the first link that fails, every
artifact against the manifest, the record's form and predicate version, its
manifest digest, the colophon page's digest, that `acceptance.sig` is present
exactly when the record names a signer and, with `--allowed-signers <file>`,
the signature: `ssh-keygen -Y verify` must accept `acceptance.sig` over the
bytes of `acceptance.json` for the reviewer as the principal in the namespace
`archpub-acceptance`, made by the key the record names. The allowed signers file
is ssh-keygen's, one principal and public key to a line, with a name that holds
spaces in double quotes. The same check by hand is
`ssh-keygen -Y verify -f <file> -I <reviewer> -n archpub-acceptance -s acceptance.sig < acceptance.json`.
Without `--allowed-signers` the result says whether the record is signed and
leaves the signature unchecked.

`archpub publish` verifies the delivery as `verify` does without signers and
copies it with its colophon page, record and signature. The version defaults to
the first 12 hexadecimal digits of the manifest digest. The copy is staged and
verified before it is renamed into place. Publishing an identical delivery
again changes nothing; a different delivery under an existing version is
refused.

A record of an earlier release, or a Statement of another version of the
acceptance predicate, is refused by `verify` and `publish` with
`acceptance_version_unsupported`. Remove it and accept the unchanged delivery
again. Published versions keep their records as they are.

## Refusals

A refusal names one of these codes. Its problems carry finer codes, such as the
`model_*` field problems, `claim_unmatched`, `relation_file_missing`,
`view_not_admitted` and the `layout_*` codes of a diagram no candidate lays out.
A refused view is named in the message; the plan's and the plates' problems
carry paths under `/views/<id>`, and a page refusal carries the paths the grid
or Archify reported.

| Code                                                                                    | Meaning                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usage`                                                                                 | Unknown command or option, or a missing value.                                                                                                                    |
| `model_invalid`                                                                         | The model breaks the schema; each problem has its own `model_*` code.                                                                                             |
| `model_unreadable`, `model_json_invalid`, `model_too_large`                             | The file cannot be read, is not JSON or exceeds 4 MiB.                                                                                                            |
| `build_media_invalid`, `build_png_invalid`, `build_quality_invalid`                     | A build option is outside its values.                                                                                                                             |
| `glyphs_missing`                                                                        | Text uses characters the bundled fonts lack or a script they do not set.                                                                                          |
| `source_revision_missing`, `source_revision_unknown`                                    | `--repo` needs `repository.revision`, and the checkout must contain it.                                                                                           |
| `files_unresolved`                                                                      | A claim owns no file in the scope, or a relation's file is missing at the revision.                                                                               |
| `source_git_unavailable`, `source_read_failed`                                          | Git cannot be run or cannot read the files.                                                                                                                       |
| `plan_requires_structure`                                                               | An automatic plan needs groups or views.                                                                                                                          |
| `currency_revision_unknown`, `coverage_revision_missing`, `coverage_repository_missing` | `--against` names no commit, the model pins no revision, or currency has no repository.                                                                           |
| `plan_not_admitted`                                                                     | No plate lays a view out; each problem gives the view's counts and the plate size.                                                                                |
| `plate_unfittable`                                                                      | A view cannot be laid out in the edition's body at any type step or row wrapping.                                                                                 |
| `edition_typst_missing`, `edition_typst_version`                                        | The print edition needs Typst 0.15.1 on the path; checked before anything is written.                                                                             |
| `edition_text_wider`, `edition_title_too_long`                                          | Typst sets a plate's text wider than the engine measured it, a line of a summary above its figure wider than 32 ems, or a plate's title longer than its line.     |
| `edition_reading_too_long`                                                              | A view's summary alone, or its paths beside no summary, need more than the body's height beside its figure.                                                       |
| `edition_typst_warning`, `edition_typst_error`                                          | Typst warned or failed while setting the edition.                                                                                                                 |
| `marks_need_files`                                                                      | The model asks for `strip` marks, but the build reads no checkout or the model claims no files.                                                                   |
| `source_history_unavailable`                                                            | The checkout is shallow, or a cited file has no change in its history, so its age cannot be read.                                                                 |
| `page_label_too_long`, `page_shape_refused`                                             | A label exceeds the widest diagram card, or no diagram has a usable shape.                                                                                        |
| `page_layout_refused`, `page_diagram_refused`                                           | A view's diagram cannot be wired, or none passes Archify's checks at the build's quality.                                                                         |
| `overview_composition_missing`, `overview_composition_invalid`                          | The overview is asked of a model without a composition or with one that is not there, or its directory holds `archpub`.                                           |
| `overview_typst_missing`, `overview_typst_version`                                      | Typst is not on the path or is not 0.15.1.                                                                                                                        |
| `overview_import_refused`, `overview_style_refused`                                     | The composition imports a package or sets a size, face, colour or the page itself.                                                                                |
| `overview_reference_unknown`                                                            | The composition names a component the model lacks.                                                                                                                |
| `overview_text_outside`, `overview_text_overlap`                                        | Text leaves the page's area or lies over other text.                                                                                                              |
| `overview_glyph_missing`, `overview_typst_warning`, `overview_typst_error`              | A character no face draws, or a Typst warning or error, at the composition's line.                                                                                |
| `page_measures_missing`                                                                 | Archify's answer lacks a route measure or layout part; the bundled Archify is unexpected.                                                                         |
| `page_refused`                                                                          | Archify did not validate or deliver the page.                                                                                                                     |
| `guide_missing`, `guide_file_invalid`                                                   | The guide is missing, or a file it names is a link, outside its directory or missing.                                                                             |
| `guide_repository_mismatch`, `guide_repository_unavailable`                             | The guide names another repository or revision, or its checkout cannot be cloned.                                                                                 |
| `scaffold_output_exists`                                                                | `scaffold guide --out` already exists.                                                                                                                            |
| `migrate_version_unsupported`, `migrate_source_unknown`, `migrate_output_exists`        | The model is not version 1 or 2, cites a source its catalog lacks, or `--out` already exists.                                                                     |
| `attribution_not_migrated`                                                              | The model's attribution names no editors; declare `editors` beside it first.                                                                                      |
| `supply_invalid`                                                                        | A bundled supply failed its digest.                                                                                                                               |
| `delivery_exists`                                                                       | `--out` already exists.                                                                                                                                           |
| `delivery_manifest_missing`, `delivery_manifest_invalid`, `delivery_entry_invalid`      | The directory is not a delivery.                                                                                                                                  |
| `delivery_changed`                                                                      | An artifact differs from the manifest.                                                                                                                            |
| `acceptance_reviewer_missing`, `acceptance_exists`                                      | Name a reviewer; a delivery is accepted once, so a record, colophon page or signature already beside it is refused.                                               |
| `acceptance_name_unset`, `acceptance_name_too_long`                                     | The name on the mark is empty or has a character no house face draws, or does not fit two lines of the band at 7 percent; give a `--seal-name`.                   |
| `acceptance_sign_failed`                                                                | ssh-keygen cannot read the key `--sign` names or sign the record with it.                                                                                         |
| `colophon_typst_missing`, `colophon_typst_version`                                      | The colophon page needs Typst 0.15.1 on the path.                                                                                                                 |
| `colophon_typst_warning`, `colophon_typst_error`                                        | Typst warned or failed while setting the colophon page, such as for a note with a character no house face draws.                                                  |
| `acceptance_missing`, `acceptance_invalid`                                              | `verify` finds no acceptance record, or one that is not JSON or not an in-toto Statement of the acceptance predicate.                                             |
| `acceptance_version_unsupported`                                                        | The record is from an earlier release or of another predicate version; remove it and accept the delivery again.                                                   |
| `acceptance_manifest_mismatch`, `acceptance_colophon_changed`                           | The record names another manifest, or `colophon.pdf` is missing or not the page the record names.                                                                 |
| `acceptance_signature_invalid`                                                          | `acceptance.sig` is missing for a record that names a signer or present for one that names none, or does not verify the record for the reviewer by the named key. |
| `publish_unaccepted`, `publish_version_invalid`, `publish_conflict`                     | Accept first, use a valid version name, and never replace a published one.                                                                                        |
| `publish_copy_invalid`                                                                  | The copy differs from the delivery and was removed.                                                                                                               |
| `likec4_sources_missing`, `likec4_invalid`, `likec4_parse_failed`, `likec4_too_large`   | The workspace cannot be imported.                                                                                                                                 |
| `import_output_exists`                                                                  | The output file exists.                                                                                                                                           |
