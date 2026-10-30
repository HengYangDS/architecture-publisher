---
subject: architecture-publisher:operations
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Operations reference

`archpub` turns one [Architecture Model](model.md) into a delivery: posters of
its views and one interactive page that answers its question view by view. This
page lists the commands, what the build does, the delivery it writes and every
refusal.

## Installation

The repository root is a private development workspace; the product is the
`architecture-publisher` package under `packages/publisher`. Pack it and install
the archive with npm:

```sh
npm pack --ignore-scripts --workspace architecture-publisher --pack-destination build/artifacts
npm install --global --ignore-scripts build/artifacts/architecture-publisher-<version>.tgz
```

The package needs Node.js 22.13 or later and has no runtime npm dependencies:
fonts, icons, the raster renderer, Archify and the LikeC4 parser are bundled
with their digests, so a build downloads nothing. Git is needed only to verify
sources with `--repo`. Git and Archify run with only the caller's `PATH`,
`PATHEXT`, `HOME`, `USERPROFILE`, `TMPDIR`, `TEMP`, `TMP` and `SystemRoot`, so
no other variable, such as `GIT_DIR` or an `ARCHIFY_*` setting, changes what
they read or decide.

## Commands

```text
archpub check <model.json> [--repo <checkout>] [--media <list>] [--png <widths>] [--quality <profile>] [--json]
archpub build <model.json> --out <directory> [--repo <checkout>] [--media <list>] [--png <widths>] [--quality <profile>] [--json]
archpub import likec4 <workspace> --out <model.json> --id <id> [--title <text>] [--question <text>] [--locale <tag>] [--json]
archpub accept <delivery> --reviewer <name> [--note <text>] [--json]
archpub publish <delivery> --to <root> [--version <name>] [--json]
archpub --help | --version [--json]
```

- `check` validates the model, verifies its sources when `--repo` names a
  checkout, plans the views, composes the poster pages and checks each diagram
  and the page with Archify, and writes no delivery; Archify's work files stay
  in a temporary directory that it removes.
- `build` does the same and writes a new delivery directory. `--out` must not
  exist; the delivery is staged beside it and renamed into place only when
  every artifact is written, so a refused build leaves nothing behind.
- `--media` names the media to deliver, `posters`, `page` or both, the
  default; a build composes only what it delivers, so `--media posters` runs no
  Archify. `--png` names the poster PNG widths, comma-separated, from 1 to
  6000 px, by default 2400. `--quality` is `showcase`, the default, or
  `standard`, which delivers drafts instead of refusing a poster page or a
  page diagram that misses its checks. An invalid value is refused before the
  model is read.
- `import likec4` writes a model from a LikeC4 workspace and lists, with its
  file and line, every construct the model cannot represent. `--locale` names
  the model's language; the import's own words, an unnamed relation's label and
  a missing question, are set in it. It names no attribution and refuses to
  overwrite an existing file.
- `accept` records a named reviewer's acceptance of an unchanged delivery.
- `publish` copies an accepted delivery to `<root>/<model id>/<version>/`, in
  any directory the caller names.

Exit status 0 means success, 1 a refused input, 2 a usage error and 3 an
internal error, any other failure, such as a file the command cannot read or
write. With `--json`, the command prints one JSON object: `{ "ok": true, ... }`
with the result, `{ "ok": false, "code", "message", "problems" }` for a
refusal, where each problem has a `code`, a JSON `path` into the model and a
`message`, `{ "ok": false, "code": "usage", "message" }` for a usage error, or
`{ "ok": false, "code": "internal_error", "message" }`. Without `--json`,
the same result is one line of text, and a refusal lists each problem on its own
line.

## Layout and media

Each view becomes rows of cards on one column lattice. On a poster each card is
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
straight arrows.

The layout never draws an overlap. A diagonal segment, a segment shared by
different relations, a wire through a card or a label touching a card, another
label, another wire or the system boundary rejects that layout, and a view is
refused only when no row wrapping, width or type step lays it out. Each channel
takes the routing with the fewest crossings, even when that needs another label
row, and on posters keeps parallel wires 24 px apart and a label 16 px from
another relation's wire wherever the cards leave room. Two relations' jogs and
labels on one label row, and the tracks of one band, keep 48 px apart, or the
row reads as one labelled bus; a lane keeps at least 48 px from the cards and
the system boundary. Crossings that the relations force are allowed; they and
the route defects, wires closer than those distances or closer than 40 px for
more than 96, arrowheads closer than two heads, a wire that stops less than
48 px short of another in line with it, so seems to continue it, and a wire
that turns less than 48 px beside a card it does not connect, so seems to leave
that card, are counted in each poster page's measures. Each row wrapping is
also laid out with channels that take more label rows so that no wire turns in
a band beside another card than its own; a page takes that taller figure when
it holds it and it has fewer route defects.

Every poster is a 2400 × 1350 px page, with no text below 14 px. A page carries
one to three consecutive views that share no component as plates, in bands of
one or more plates under a masthead, beside a rail of text, or, for one view,
with its text set in the corners its figure leaves free. Cards are as large as
their text and never stretch; a sparse view is instead set at a larger type
step, up to 32 px labels and 24 px details, and every plate of a page uses one
step. The numbered tier labels stand in one column before the figure; when no
page with them in one column balances, the labels of tiers that start at one
edge share a column before that edge, and the manifest records which. A tier
wrapped into several rows has its label level with its first row, beside a
bracket that spans them all. Every page passes four balance gates over its live
area: its largest blank rectangle covers at most 12 percent of it, no blank band
96 px or taller runs across it, at most 40 percent of it lies in empty squares
of 240 px or more, and its centre of mass lies within 12 percent of the centre
across and down. The edition is grouped into the fewest crossings and then
route defects over all its pages, since two views squeezed onto one page wire
worse, then the fewest pages that miss a gate, then the fewest pages, then the
least area in those holes, and each page prefers the fewest crossings and
route defects. A grouping no passing page holds is printed on a sparse page
when its figures already stand at the largest step, or at the largest step
they fit at with only its largest blank rectangle or a blank band over its
gate: the model has too little to fill the page. Otherwise, a view
that no admitted page holds, alone or with a neighbour, is refused with
`poster_unbalanced` and its closest page's measures and limits, unless
`--quality standard` prints that page as a draft. Text is outlined from the
bundled faces, Noto Sans CJK SC and then Noto Sans for the Latin, Greek and
Cyrillic letters the first lacks; lines break at spaces but not at no-break
spaces, and between Han and Kana characters, keeping closing punctuation on the
line before. Each kind draws its Lucide icon. Each page is written as SVG and
as PNG at 2400 px or the widths `--png` names.

The page is one Archify explainer, delivered by the vendored, unmodified
Archify 3.2.0. Its heading is the model's question, its conclusion the summary,
listed beside it the panels' titles, each a link to its panel, and its scope the
model's scope, limits and attribution. Each view is a panel
titled with the view's question, or its title when it asks the model's own
question, in the plan's order, holding the view's native architecture diagram,
named by the view's own title or else its question, which opens Archify's full
interactive viewer, and one step per component, in
the diagram's reading order, that lights the component and gives every one of
its details; a card shows the first detail it holds whole, or none. A model therefore declares at most four views, the diagrams one page
holds.

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
units or than one and a half times its own route's distance; a label that
crowds, when anything else, a boundary's outline included, comes nearer than 16
units or than two and a half times its own route's distance; and two route ends
less than 24 units apart on one side of a card. Among the candidates that pass,
the page takes the fewest routes that read as one or run along an edge, then the
fewest crossings, then the fewest labels read as another's, then one narrow
enough for Archify's reader to set beside its steps at 1440 px, then the fewest
doubled routes, routes over two bends, crowded labels, crowded route ends and
route stretch, then the shape nearest 1.0 to 1.8 times as wide as high. When the
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
component's first source as a numbered page source at that revision, listed
under the name of the first component that cites it, and the step of a
component without details names that source's file; the checkout's remotes are
not read. Archify will not cite a file of a sensitive
class, such as a path with a `secrets` segment, so such a source is withheld
from the page and recorded as withheld in the manifest, and the component cites
its next source. In a 1440 × 900 window every preview fits its panel, primary
labels render at 13.25 CSS px or more in the previews and at 14 CSS px or more
in the full viewer.

## The delivery

| File                   | Content                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `page-<n>.svg`         | Poster page `n`, numbered from 1 in reading order.          |
| `page-<n>.png`         | The page rasterized at 2400 px wide.                        |
| `page-<n>-<width>.png` | The page rasterized at each other width `--png` names.      |
| `index.html`           | The standalone interactive explainer page, unless excluded. |
| `manifest.json`        | The build record.                                           |
| `acceptance.json`      | Written by `archpub accept`; absent until then.             |

The manifest records its format and version 4, the publisher's name and
version, the model id, title, language, digest and size, the declared
repository, the build's quality and media, every source with its state and
declared and observed digest, the digest of each bundled supply, each view with
its tiers, members and page number, each page with its number, files, views,
admission, the gates it misses, composition and measures, the explainer page's
quality profile and gates, each
view diagram's width, height, rows, sides, re-sided connections, pinned labels, whether its
preview stands beside its steps, candidate count and Archify route measures,
the sources the page withholds, the details,
status and sources of every component and relation, and the path, size and
SHA-256 of every artifact. It contains no time, host path or user name, so
building the same model with the same version on one platform reproduces every
byte.

## Acceptance and publication

`archpub accept` verifies every artifact against the manifest and writes
`acceptance.json` with the manifest digest, the model id, the reviewer and the
optional note. A changed artifact or an existing acceptance is refused.

`archpub publish` verifies the delivery again and requires an acceptance of the
same manifest. The version defaults to the first 12 hexadecimal digits of the
manifest digest. The copy is staged and verified before it is renamed into
place. Publishing an identical delivery again changes nothing; a different
delivery under an existing version is refused.

## Refusals

A refusal names one of these codes. Its problems carry finer codes, such as the
`model_*` field problems, `source_missing`, `source_digest_mismatch`,
`view_not_admitted` and the `layout_*` codes of a diagram no candidate lays out.
A refused view is named in the message; the plan's and the posters' problems
carry paths under `/views/<id>`, and a page refusal carries the paths the grid
or Archify reported.

| Code                                                                                  | Meaning                                                                                     |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `usage`                                                                               | Unknown command or option, or a missing value.                                              |
| `model_invalid`                                                                       | The model breaks the schema; each problem has its own `model_*` code.                       |
| `model_unreadable`, `model_json_invalid`, `model_too_large`                           | The file cannot be read, is not JSON or exceeds 4 MiB.                                      |
| `build_media_invalid`, `build_png_invalid`, `build_quality_invalid`                   | A build option is outside its values.                                                       |
| `glyphs_missing`                                                                      | Text uses characters the bundled fonts lack or a script they do not set.                    |
| `source_revision_missing`, `source_revision_unknown`                                  | `--repo` needs `repository.revision`, and the checkout must contain it.                     |
| `sources_unverified`                                                                  | A source is missing at the revision or differs from its declared digest.                    |
| `source_git_unavailable`, `source_read_failed`                                        | Git cannot be run or cannot read the sources.                                               |
| `plan_requires_structure`, `plan_views_exceeded`                                      | An automatic plan needs groups or views, or would exceed four views.                        |
| `plan_not_admitted`                                                                   | No page of its own lays a view out; each problem gives the view's counts and the page size. |
| `poster_title_too_long`, `poster_summary_too_long`                                    | The title, question or summary does not fit any page composition.                           |
| `poster_unfittable`                                                                   | A view cannot be laid out on any page at any type step or row wrapping.                     |
| `poster_unbalanced`                                                                   | No admitted page holds a view, alone or with a neighbour.                                   |
| `page_label_too_long`, `page_shape_refused`                                           | A label exceeds the widest diagram card, or no diagram has a usable shape.                  |
| `page_layout_refused`, `page_diagram_refused`                                         | A view's diagram cannot be wired, or none passes Archify's checks at the build's quality.   |
| `page_measures_missing`                                                               | Archify's answer lacks a route measure or layout part; the bundled Archify is unexpected.   |
| `page_refused`                                                                        | Archify did not validate or deliver the page.                                               |
| `raster_failed`, `raster_size_invalid`, `supply_invalid`                              | A bundled supply failed its digest or the raster renderer failed.                           |
| `delivery_exists`                                                                     | `--out` already exists.                                                                     |
| `delivery_manifest_missing`, `delivery_manifest_invalid`, `delivery_entry_invalid`    | The directory is not a delivery.                                                            |
| `delivery_changed`                                                                    | An artifact differs from the manifest.                                                      |
| `acceptance_reviewer_missing`, `acceptance_exists`                                    | Name a reviewer; a delivery is accepted once.                                               |
| `publish_unaccepted`, `publish_version_invalid`, `publish_conflict`                   | Accept first, use a valid version name, and never replace a published one.                  |
| `publish_copy_invalid`                                                                | The copy differs from the delivery and was removed.                                         |
| `likec4_sources_missing`, `likec4_invalid`, `likec4_parse_failed`, `likec4_too_large` | The workspace cannot be imported.                                                           |
| `import_output_exists`                                                                | The output file exists.                                                                     |
