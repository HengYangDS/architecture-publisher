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
archpub check <model.json> [--repo <checkout>] [--json]
archpub build <model.json> --out <directory> [--repo <checkout>] [--json]
archpub import likec4 <workspace> --out <model.json> --id <id> [--title <text>] [--question <text>] [--json]
archpub accept <delivery> --reviewer <name> [--note <text>] [--json]
archpub publish <delivery> --to <root> [--version <name>] [--json]
```

- `check` validates the model, verifies its sources when `--repo` names a
  checkout, plans the views, composes the poster pages and checks each diagram
  and the page with Archify, and writes no delivery; Archify's work files stay
  in a temporary directory that it removes.
- `build` does the same and writes a new delivery directory. `--out` must not
  exist; the delivery is staged beside it and renamed into place only when
  every artifact is written, so a refused build leaves nothing behind.
- `import likec4` writes a model from a LikeC4 workspace and lists, with its
  file and line, every construct the model cannot represent. It refuses to
  overwrite an existing file.
- `accept` records a named reviewer's acceptance of an unchanged delivery.
- `publish` copies an accepted delivery to `<root>/<model id>/<version>/`.

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
another relation's wire wherever the cards leave room; a lane keeps at least
48 px from the cards and the system boundary. Crossings that the relations force are
allowed; they and the route defects, wires closer than those distances,
arrowheads closer than two heads and a wire that seems to continue another, are
counted in each poster page's measures.

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
across and down. The edition is grouped into the fewest such pages, then the
least area in those holes, and each page prefers the fewest crossings and route
defects. A view that no passing page holds, alone or with a neighbour, is
refused with `poster_unbalanced` and its closest page's measures and limits.
Text is outlined from the bundled Noto Sans CJK SC fonts, and each kind draws
its Lucide icon. Each page is written as SVG and as PNG at 2400 and 6000 px.

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
widths of 960, 840 and 720 units with its rows wrapped at five, four and
three cards; its cards are at least as wide as its longest label needs.
Archify routes the relations and places their labels. A relation between
neighbors in a row runs below the row when its label does not fit between them,
and a relation that skips rows or passes cards in its row names no sides, so
Archify routes it around the cards between. A candidate omits the system
boundary when the outside components cannot stay outside it. Each candidate is
measured with the grid's connection sides and with every side left to Archify,
which plans all sides together. Archify validates every candidate at its
showcase quality profile and lays out its routes, which archpub measures for
what Archify does not report: two routes that read as one, running side by side
closer than 8 units along more than 16, or lining up within 8 units of one line
and less than 32 units apart with no card between them; a route along a card's
or the boundary's edge, closer than 12 units along more than 16; a relation
label closer than 8 units to another relation's route or to a card; and two
route ends less than 24 units apart on one side of a card. Among the candidates
that pass, the page takes the fewest routes that read as one or run along an
edge, then the fewest crossings, then one narrow enough for Archify's reader to
set beside its steps at 1440 px, then the fewest routes over two bends, crowded
labels, crowded route ends and route stretch, then the shape nearest 1.0 to 1.8
times as wide as high. When the choice still crosses, reads two routes as one,
runs a route along an edge, crowds a label or stands above its steps, the
connections involved take other sides, one at a time from the three best
diagrams and the three best beside their steps, within 96 measured changes,
wherever that ranks the diagram higher. A view without a candidate that passes
refuses the build with Archify's findings; a diagram never drops a component or
relation to fit.

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

| File              | Content                                         |
| ----------------- | ----------------------------------------------- |
| `<page>.svg`      | Each poster page, named by its views.           |
| `<page>.png`      | The page rasterized at 2400 px wide.            |
| `<page>-6000.png` | The page rasterized at 6000 px wide.            |
| `index.html`      | The standalone interactive explainer page.      |
| `manifest.json`   | The build record.                               |
| `acceptance.json` | Written by `archpub accept`; absent until then. |

The manifest records its format and version, the publisher's name and version,
the model id, title, digest and size, the declared repository, every source
with its state and declared and observed digest, the digest of each bundled
supply, each view with its tiers, members and page, each page with its views,
composition and measures, the explainer page's quality profile and gates, each
view diagram's width, height, rows, sides, re-sided connections, whether its
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
| `glyphs_missing`                                                                      | Text uses characters the bundled fonts lack.                                                |
| `source_revision_missing`, `source_revision_unknown`                                  | `--repo` needs `repository.revision`, and the checkout must contain it.                     |
| `sources_unverified`                                                                  | A source is missing at the revision or differs from its declared digest.                    |
| `source_git_unavailable`, `source_read_failed`                                        | Git cannot be run or cannot read the sources.                                               |
| `plan_requires_structure`, `plan_views_exceeded`                                      | An automatic plan needs groups or views, or would exceed four views.                        |
| `plan_not_admitted`                                                                   | No page of its own lays a view out; each problem gives the view's counts and the page size. |
| `poster_title_too_long`, `poster_summary_too_long`                                    | The title, question or summary does not fit any page composition.                           |
| `poster_unfittable`                                                                   | A view cannot be laid out on any page at any type step or row wrapping.                     |
| `poster_unbalanced`                                                                   | No page holding a view, alone or with a neighbour, passes the balance gates.                |
| `page_label_too_long`, `page_shape_refused`                                           | A label exceeds the widest diagram card, or no diagram has a usable shape.                  |
| `page_layout_refused`, `page_diagram_refused`                                         | A view's diagram cannot be wired, or none passes Archify's showcase checks.                 |
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
