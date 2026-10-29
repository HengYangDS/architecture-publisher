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
sources with `--repo`.

## Commands

```text
archpub check <model.json> [--repo <checkout>] [--json]
archpub build <model.json> --out <directory> [--repo <checkout>] [--json]
archpub import likec4 <workspace> --out <model.json> --id <id> [--title <text>] [--question <text>] [--json]
archpub accept <delivery> --reviewer <name> [--note <text>] [--json]
archpub publish <delivery> --to <root> [--version <name>] [--json]
```

- `check` validates the model, verifies its sources when `--repo` names a
  checkout, plans the views and lays each one out, and writes nothing.
- `build` does the same and writes a new delivery directory. `--out` must not
  exist; the delivery is staged beside it and renamed into place only when
  every artifact is written, so a refused build leaves nothing behind.
- `import likec4` writes a model from a LikeC4 workspace and lists, with its
  file and line, every construct the model cannot represent. It refuses to
  overwrite an existing file.
- `accept` records a named reviewer's acceptance of an unchanged delivery.
- `publish` copies an accepted delivery to `<root>/<model id>/<version>/`.

Exit status 0 means success, 1 a refused input and 2 a usage error. With
`--json`, the command prints one JSON object: `{ "ok": true, ... }` with the
result, or `{ "ok": false, "code", "message", "problems" }`, where each problem
has a `code`, a JSON `path` into the model and a `message`. Without `--json`,
the same result is one line of text, and a refusal lists each problem on its own
line.

## Layout and media

Each view becomes rows of cards on one column lattice: every card has one
width and every card of a row one height. Declared tiers are
the rows, in order. Otherwise rows follow the relations: every relation points
down or stays within one row, and the publisher chooses the rows that skip the
fewest rows with their relations, then have the fewest relations within a row,
then the fewest rows. The placement of cards within their rows is exact: it
minimizes a weighted count of crossings, bends and unused columns over the whole
lattice. Relations run
through the channels between rows as buses, corridors and straight arrows.

The layout refuses rather than draws overlaps. A diagonal segment, a segment
shared by different relations, a wire through a card or a label touching a card,
another label or another wire refuses the view. Each channel takes the routing
with the fewest crossings, even when that needs another label row. Crossings
that the relations force are allowed and counted in the manifest.

Every poster is a 2400 × 1350 px page, with no text below 14 px. A page carries
one to three consecutive views as plates, in bands of one or more plates under
a masthead, beside a rail of text, or, for one view, with its text set in the
corners its figure leaves free. Cards are as large as their text and never
stretch; a sparse view is instead set at a larger type step, up to 32 px labels
and 24 px details, and every plate of a page uses one step. The grouping is
chosen for the whole edition: the fewest pages that miss a balance gate, then
the fewest pages. A page that no composition can balance is still printed, and
its manifest entry records each gate it misses; a view that no page can lay out
at all is refused. Text is outlined from the bundled Noto Sans CJK SC fonts,
and each kind draws its Lucide icon. Each page is written as SVG and as PNG at
2400 and 6000 px.

The page is one Archify explainer, delivered by the vendored, unmodified
Archify 3.2.0. Its heading is the model's question, its conclusion the summary
and its scope the model's scope, limits and attribution. Each view is a panel
titled with the view's question, or its title when it asks the model's own
question, in the plan's order, holding the view's native architecture diagram,
which opens Archify's full interactive viewer, and one step per component, in
the diagram's reading order, that lights the component and gives every one of
its details; a card shows the first detail it holds whole, or none. A model therefore declares at most four views, the diagrams one page
holds.

A view's diagram is laid out by the same grid with Archify's text metrics, at
content widths of 960, 840 and 720 units with its rows wrapped at five, four and
three cards; its cards are at least as wide as its longest label needs.
Archify routes the relations and places their labels. A relation between
neighbors in a row runs below the row when its label does not fit between them,
and a relation that skips rows or passes cards in its row names no sides, so
Archify routes it around the cards between. A candidate omits the system
boundary when the outside components cannot stay outside it. Archify validates
every candidate at its showcase quality profile, and the page takes, among those
that pass, the fewest crossings, then the fewest routes over two bends, then the
least route stretch, then the shape nearest 1.0 to 1.8 times as wide as high.
When every candidate crosses or bends a route more than twice, each is measured
again with every connection side left to Archify, and the choice is made from
both. A candidate whose routes run side by side, two routes closer than 8 units
along more than 16, is not chosen while another passes without. When the choice
still crosses, the connections Archify reports crossing take other sides, one at
a time from the three best diagrams and within 64 measured changes, wherever
that ranks the diagram higher without running routes side by side. A view
without a candidate that passes refuses the build with Archify's findings; a
diagram never drops a component or relation to fit.

When the model declares a repository URL and revision, each step cites the
component's first source as a numbered page source at that revision; the
checkout's remotes are not read. Archify will not cite a file of a sensitive
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

The manifest records the model id, title, digest and size, the publisher
version, the declared repository, every source with its declared and observed
digest, the digest of each bundled supply, each view with its tiers, members
and page, each page with its views, composition and measures, including every
gate it misses, the explainer page's quality profile and gates, each view
diagram's width, height, rows, sides, re-sided connections and Archify route
measures, the sources
the page withholds, the details, status and sources of every component and
relation, and the SHA-256 of every artifact. It contains no time, host
path or user name, so building the same model with the same version reproduces
every byte.

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
`view_not_admitted` and the `layout_wire_*` and `layout_label_collision`
defects. A refused view is named in the message, and the problems of every
refused view carry paths under `/views/<id>`.

| Code                                                                                  | Meaning                                                                     |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `usage`                                                                               | Unknown command or option, or a missing value.                              |
| `model_invalid`                                                                       | The model breaks the schema; each problem has its own `model_*` code.       |
| `model_unreadable`, `model_json_invalid`, `model_too_large`                           | The file cannot be read, is not JSON or exceeds 4 MiB.                      |
| `glyphs_missing`                                                                      | Text uses characters the bundled fonts lack.                                |
| `source_revision_missing`, `source_revision_unknown`                                  | `--repo` needs `repository.revision`, and the checkout must contain it.     |
| `sources_unverified`                                                                  | A source is missing at the revision or differs from its declared digest.    |
| `source_git_unavailable`, `source_read_failed`                                        | Git cannot be run or cannot read the sources.                               |
| `plan_requires_structure`, `plan_views_exceeded`                                      | An automatic plan needs groups or views, or would exceed four views.        |
| `plan_not_admitted`                                                                   | A view does not fit its poster; each problem gives its measured size.       |
| `layout_row_too_wide`                                                                 | A tier holds more cards than a row can.                                     |
| `layout_boundary_unplaced`                                                            | Outside components leave no room for the system boundary.                   |
| `layout_channel_unroutable`, `layout_untidy`                                          | Relations between two rows cannot be drawn without an overlap.              |
| `poster_title_too_long`, `poster_summary_too_long`                                    | The title, question or summary does not fit any page composition.           |
| `poster_unfittable`                                                                   | A view cannot be laid out on any page at any type step or row wrapping.     |
| `map_label_too_long`, `map_shape_refused`                                             | A label exceeds the widest diagram card, or no diagram has a usable shape.  |
| `map_layout_refused`, `map_refused`                                                   | A view's diagram cannot be wired, or none passes Archify's showcase checks. |
| `page_refused`                                                                        | Archify did not validate or deliver the page.                               |
| `raster_failed`, `raster_size_invalid`, `supply_invalid`                              | A bundled supply failed its digest or the raster renderer failed.           |
| `delivery_exists`                                                                     | `--out` already exists.                                                     |
| `delivery_manifest_missing`, `delivery_manifest_invalid`, `delivery_entry_invalid`    | The directory is not a delivery.                                            |
| `delivery_changed`                                                                    | An artifact differs from the manifest.                                      |
| `acceptance_reviewer_missing`, `acceptance_exists`                                    | Name a reviewer; a delivery is accepted once.                               |
| `publish_unaccepted`, `publish_version_invalid`, `publish_conflict`                   | Accept first, use a valid version name, and never replace a published one.  |
| `publish_copy_invalid`                                                                | The copy differs from the delivery and was removed.                         |
| `likec4_sources_missing`, `likec4_invalid`, `likec4_parse_failed`, `likec4_too_large` | The workspace cannot be imported.                                           |
| `import_output_exists`                                                                | The output file exists.                                                     |
