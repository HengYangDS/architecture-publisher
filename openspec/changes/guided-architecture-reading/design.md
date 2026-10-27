## Context

Architecture Publisher (archpub) turns an explicit description of a software
architecture into media people can read and verify. Its previous design served
three known inputs and failed its readers: posters printed every claim, status
and relation as text cards around a small graph; layout searched up to nine ELK
candidates across many canvas widths and still refused the public AIGW frame;
the interactive medium replaced Archify's fonts, routing and inspection with
about 3,200 lines of its own code; and qualification, publication and custody
planes recorded hand-written decisions that no check produced. The redesign
starts from what a reader needs and what the user decided:

- Rewrite the rendering layer and delete code without a consumer, keeping the
  LikeC4 import.
- Posters are graph-first; evidence moves to the interactive map and the
  manifest.
- Every poster fits 1800 × 1350 px with 14 px text; large systems use an
  overview plus mechanism views.
- Interactive primary labels are 14 px; relation labels keep Archify's native
  size.
- Boxes of one view share one size and align on one grid; the user rejected
  the ELK composition because its boxes differed in size and height.
- Deliver AIGW, self and ETHOS media, the Documents delivery and a signed
  release by 2026-10-31.
- The product must draw any repository, not only ETHOS, AIGW and itself.

## Goals / Non-Goals

### Goals

- One explicit Architecture Model is the only input; an agent, a person or the
  LikeC4 importer can produce it for any repository.
- Three media with distinct jobs: the poster explains one question at a
  glance, the map supports exploration and inspection, and the manifest binds
  both to exact content.
- Neatness is measured, not judged: equal cards on one grid, orthogonal wires,
  no overlapping lines or labels, and text never below 14 px.
- Identical inputs produce identical bytes; each layout is the exact optimum of
  one published cost, with no candidates, retries or randomness.
- Each poster fits its frame at its type scale, or the build refuses with the
  view, its measured size and the remedy.
- The map is produced by unmodified native Archify.
- Trust is minimal and real: content digests at a pinned revision, one
  acceptance record and immutable versioned publication.

### Non-Goals

- Inferring architecture from source code. Agents may author models; the
  publisher does not guess them.
- Mobile layouts, PDF, PPTX, resident services, registries or catalogs.
- Modifying Archify, resvg, the fonts, the icons or any other vendored supply.
- The ETHOS north-star packet, the research settlement and the GitLab
  simulated-loss recovery; they are deferred past 2026-10-31.

## Decisions

### 1. Model in, media out

The product boundary is one model file in and one delivery directory out.
archpub reads repository files only to verify declared sources (decision 4)
and never writes, fetches or reconfigures a source repository. Source products
receive no drawing files, dependencies, configuration or CI obligations.

### 2. One Architecture Model

The model (`format: "architecture-publisher.model"`, `version: 1`) declares:

- `id`, `title`, `question`, optional `summary` and `attribution`;
- optional `repository` (`name`, `url`, `revision`), `scope` and `limits`;
- `sources`: a map from source id to `path`, optional `sha256` and `note`;
- `components`: `id`, `label`, optional `kind`, `details`, `status`, `sources`;
- `relations`: `id`, `from`, `to`, `label`, optional `details`, `status`,
  `sources`;
- optional `kinds`, `groups` (`id`, `label`, `members`) and `views`
  (decision 5).

A kind declares a legend `label`, a `category` and an optional Lucide `icon`.
The eight categories are `person`, `external`, `frontend`, `backend`,
`database`, `cloud`, `messagebus` and `security`. They choose the card color,
the default icon and the Archify component type; `person` and `external` mark
elements outside the described system.

`details` maps a name to a string or a list of strings and carries the
qualifiers a reader needs, such as `owns: account tokens`. `status` is
`implemented`, `planned` or `retired`; absence means not stated. A relation
connects two different components. A JSON Schema shipped with the package
defines the format; validation reports every problem with its JSON path before
any output.

This replaces the Claim Model, Edition project, Build Request and Provider.
Claims, predicates, planes, selections, questions per selection and Candidate
coverage existed for qualification records that no reader consumed. A
separate model and edition were rejected because every consumer needed both
and their cross-references were a common source of refusals.

### 3. LikeC4 is the only importer

`archpub import likec4` converts a LikeC4 workspace into a model: elements
become components, relationships become relations, element kinds become
kinds, nested elements become groups and views become flow views. Constructs
without a model equivalent are reported as warnings with their LikeC4
location; nothing is dropped silently. The existing native parser supply is
kept; other importers can be added behind the same model.

### 4. Content-digest source binding

Sources are declared once and referenced by id. With `--repo <checkout>`,
archpub reads each path at `repository.revision` through `git cat-file`
(`--no-replace-objects`, no lazy fetch), computes SHA-256 and compares it with
any declared digest. A missing revision, a missing path or a digest mismatch
refuses the build and names the source id, path and both digests. Without
`--repo`, sources are recorded as declared and unverified, and the poster
footnote says so.

Content digests, not remote names, are the identity anchor: none of the three
current repositories has an `origin` remote, and a checkout's working tree may
differ from the revision. Archify's native repository evidence requires an
`origin` that matches the declared URL; archpub uses it only when that is true
(decision 10) and never fabricates a remote to satisfy it.

### 5. Reading Plan and rows

A view is a poster and a guided view of the map. A model declares at most
five views, matching Archify's native guided-view limit. Each view has an
`id`, an optional `title`, `question` and `summary`, and either:

- `tiers`: ordered group ids, or inline groups, drawn as rows in that order,
  used when groups are architectural layers; or
- `members`: component ids whose rows follow their relations.

Members are assigned rows by longest-path layering after reversing the edges
that close cycles, so relations point downward where the graph allows.
Siblings that share a caller and call each other then share a row when that
removes a row without widening it beyond the row limit. Groups are rows only
when a view names them as tiers.

Without declared views, the plan is derived deterministically:

1. one view of all components, if it is admitted;
2. otherwise, when the model has groups: an overview with one node per group
   and one aggregated relation per ordered group pair, followed by one view per
   group with its members and their direct neighbors as context;
3. otherwise, or when more than five views would result, a refusal that names
   the measured size and asks for groups or views.

Admission composes the poster once and measures it (decision 8). Nothing is
retried with other parameters.

### 6. Grid layout

Both media use one layout engine. Each medium supplies its own metrics: card
width bounds, text measurement, label sizes and spacing.

- **Cards.** Every card of a view has one width and one height. The width is
  the largest that lets the widest row fit the frame, capped by the medium;
  the height fits the tallest card content at that width.
- **Lattice.** Card positions are whole or half columns of one pitch (card
  width plus column gap); half columns center a card between two others.
- **Placement.** Rows are placed by exact dynamic programming over every row
  order and lattice position. The cost counts, in decreasing weight, crossings
  between adjacent rows, bends of wires between adjacent rows, an off-center
  bus hub, room for same-row arrows, row centering, half-column use and
  departures from model order. The minimum is unique for a given enumeration
  order, so the result is deterministic. Long relations are placed in a second
  pass that keeps their endpoints near the first optimum's corridor.
- **Boundary.** When a view shows elements of the described system together
  with `person` or `external` elements, the internal cards of every internal
  row occupy one shared column interval and the others lie outside it, so the
  system boundary is one rectangle named after the repository.
- **Channels.** Rows are separated by channels that hold every wire and label
  between them. A relation between adjacent rows runs vertically from its
  source, makes at most one horizontal jog and runs vertically into its target.
  Relations with one source, one label, the same details and targets in one
  row form a bus with one label; so do relations into one target. A same-row
  relation between neighbors is a straight arrow when its label fits between
  them, otherwise it turns through the channel below. A relation that skips
  rows runs down a corridor, a column gap or empty cell free in every row it
  passes.
- **Channel routing.** Each channel is solved exactly: every label position
  (on the jog, beside the source or beside the target), up to three label
  rows and every track order are tried, and the clean solution with the fewest
  tracks, crossings and label rows wins. Ports on a card side are spread
  symmetrically in the order of their far ends; wider spacing is tried only
  when the default has no clean solution.
- **Bounds.** A row holds at most six cards, or five beside row labels. A
  wider row, or a channel without a clean solution, refuses the view with the
  row or channel and its relations, and asks for more tiers or views.

ELK, Graphviz, D2 (including TALA), PlantUML C4, LikeC4's own layout and
libavoid were measured on the AIGW overview. None keeps equal card sizes, tier
order and labels clear of other wires together, because their objective is
edge length and crossings rather than a grid; libavoid routes but places no
labels. The previous custom band layout was rejected because it handled only
edges between adjacent bands; corridors, automatic rows and cycle reversal
remove that limit.

### 7. Measured neatness

Every laid-out view is measured before any output, and the manifest records
the measurements. The build refuses a view with any of:

- a wire segment that is neither horizontal nor vertical;
- two wires of different relations sharing a segment;
- a wire through a card;
- a label box intersecting a card, another label or another relation's wire;
- text below 14 px, or content outside the frame.

Crossings are minimized by placement and channel routing and reported, not
refused: some relation sets, such as three components each calling the same
three others, cannot be drawn without one. A remaining crossing is
perpendicular and never at a bend, a port or a label.

### 8. Graph-first poster

The poster has a fixed width of 1800 px and a height of at most 1350 px:

- a header with the title (38 px bold), the view question (20 px), a summary
  of at most three lines (16 px) and the repository, revision and view number;
- the stage: tinted row bands with numbered row labels when the view has
  tiers; cards with a category color bar, the kind icon, the label (18 px
  bold) and the details (14 px); the boundary rectangle; wires with arrowheads;
  relation labels (14 px) on their own wire;
- a one-line legend of the kinds, the boundary and the statuses present;
- a footnote with scope, limits, attribution, the repository revision and the
  source verification state.

`planned` is dashed and `retired` is dotted and muted. A view smaller than its
stage is enlarged up to 1.4 times and centered; a view is never reduced. No
text is smaller than 14 px. Claim records, digest lists, status tables and
reading indexes are not printed. Colors, spacing and type sizes are design
tokens in one module. The poster is written as SVG with text converted to
glyph outlines, so it renders identically without fonts, and as PNG at 1800
and 6000 px through the vendored resvg.

### 9. Bundled fonts and icons

Noto Sans CJK SC 2.004 Regular and Bold (SIL Open Font License 1.1) are
bundled unmodified with their license and SHA-256 digests. They cover Latin
and CJK labels with one family. Host fonts are never discovered. The
JetBrains Mono supply and the interactive font substitution are removed; the
map keeps Archify's native typography.

The existing icon supply, the complete Lucide 1.61.0 artwork (ISC) with its
license and digests, is retained unmodified. Each category has a default icon,
and a kind may name any Lucide icon; an unknown name is a validation problem.

### 10. Native Archify map

The interactive medium is one standalone HTML document produced by the
vendored, unmodified Archify through `archify deliver architecture
--quality showcase`. archpub writes the Archify document:

- every component of the model at the position and size the grid layout
  computed with Archify's text metrics, with its label, kind as tag and its
  first detail, shortened to fit, as sublabel; groups that cover every
  component are the rows, otherwise rows follow the relations;
- the system boundary as a region when the cards it needs still hold every
  label at 14 px, otherwise Archify's external type alone marks outside
  elements;
- relations as labeled connections whose `fromSide` and `toSide` follow the
  grid rows; Archify routes them, spreads their ports and places their labels
  natively, and dashes planned or retired relations;
- the seven native component types as color families mapped from the kind
  categories (`person` maps to `external`), with legend labels naming the
  model kinds;
- one guided view per model view, focusing its members;
- cards for the question and summary, scope, limits and attribution, and the
  complete evidence of every component and relation: details, status and
  source paths with digests and verification state.

When `--repo` has an `origin` remote equal to the declared repository URL,
components also carry up to three native source references that Archify
verifies against the revision. Archify warnings or failed showcase checks
refuse the build. The map is 1000 units wide and never wider than 1.54 times
its height, below Archify's wide-canvas ratio, so the reader renders primary
labels at 14.8 CSS px in a 1440 × 900 desktop viewport; Chromium measures this
in the test suite. The custom
renderer, routing, Inspect records, private-module coupling and font
replacement are removed.

### 11. Deterministic delivery and minimal trust

`archpub build <model> --out <dir>` writes, into a directory that must not
exist, `<view>.svg`, `<view>.png`, `<view>-6000.png` for each view,
`index.html` and `manifest.json`. Output is staged and moved into place, so a
failed build leaves nothing behind. The manifest records the model digest, the
archpub version, the digests of the font, icon, resvg and Archify supplies,
the plan, each view's neatness measurements, every artifact digest and every
source record. It has no timestamps; rebuilding the same model with the same
version reproduces every byte. `archpub check` runs validation, binding,
planning, layout and admission without writing.

`archpub accept <dir> --reviewer <name>` verifies every artifact against the
manifest and writes `acceptance.json` with the reviewer, an optional note and
the manifest digest. `archpub publish <dir> --to <root>` requires that
record, copies the delivery to `<root>/<model id>/<version>/` (by default the
first twelve hexadecimal digits of the manifest digest), verifies the copy,
refuses to replace a different existing version and leaves other versions
untouched.

The Candidate, qualification records, publication plans, journals, recovery
commands and custody manifests are removed. They duplicated Git, release and
filesystem facts and never ran a check of their own.

### 12. Command surface

`archpub` offers `build`, `check`, `import likec4`, `accept` and `publish`.
Every command accepts `--json` and then prints one result object with
`ok`, the outputs or the diagnostics; exit status 0 means success, 1 a refused
input and 2 a usage error. There are no aliases or compatibility commands.

### 13. Retained and removed modules

Retained: the LikeC4 parser supply, the font, icon, resvg and Archify supplies
with their verification tools, the release and CI tooling, and the
repository's quality gates. Removed: the Provider, the Claim Model and Edition
generations, source bundles and locks, scene programs, authored routes,
occurrences and statements, the custom interactive renderer and SVG figure
renderer, the ELK, libavoid and dagre supplies, the JetBrains Mono supply,
qualification, publication, the browser-evidence harness and every test that
only exercised them. The self edition becomes a model file in
`editions/self` without code.

### 14. Edition content

AIGW and ETHOS models live in `architecture-publications`, owned by their
editor; the self model lives in this repository. The AIGW conversion keeps
every entity, relation and source id, label, kind, qualifier, limit and
attribution. Its fourteen source digests match `aigw-cli` revision
`68876f0632acf6b0c66493800757ea70ecaef84d` once the `source/` bundle prefix is
removed from each locator. Every AIGW claim is implemented, affirmed and
complete, so each relation keeps `status: implemented` and claim records are
not copied. The self and ETHOS models are written from their repositories at
pinned revisions as an overview plus mechanism views.

### 15. Verification

Tests cover model validation, source binding, the plan and automatic rows,
placement and channel routing, the neatness measurements, layout determinism,
poster admission, the Archify mapping, the CLI and the LikeC4 import.
End-to-end journeys build the converted AIGW model; the C4 Big Bank example
with tiers and without them; models with a cycle, a relation skipping rows, a
six-way bus, three components each calling the same three others, and CJK
labels; and models that must be refused for a seven-card row and an oversized
view. One model is rebuilt to compare bytes. Chromium measures the map's
label floor. The repository's existing format, lint, type, import, dead-code,
Markdown, OpenSpec, coverage (at least 95 percent per dimension) and package
gates stay in force. The user accepts the artwork; tests do not.

## Risks / Trade-offs

- [A poster holds about twenty-five cards: five rows of up to five or six]
  → The plan splits large models into an overview and mechanism views and
  refuses rather than shrinking text.
- [Exact placement grows with row width and lattice size] → Rows are limited
  to six cards and the lattice to two spare columns; the AIGW and Big Bank
  views lay out in under a second.
- [Some views have no clean channel routing] → The build refuses with the
  channel and its relations instead of drawing overlaps; the editor reorders
  tiers or splits the view.
- [Straight wires can leave a row off-center] → Placement prefers fewer bends
  over symmetry; row centering only breaks ties of equal straightness.
- [The bundled fonts add about 32 MB] → One family covers Latin and CJK
  without host fonts; a subset would be a modified font to maintain.
- [Archify limits guided views to five and source references to three per
  component, requires an `origin` remote for native links and applies its own
  showcase checks to authored routes] → Models have at most five views;
  complete evidence is always in cards and the manifest; a failed showcase
  check refuses the build with Archify's diagnostic.
- [Previous inputs stop working] → The three real inputs are converted or
  rewritten; earlier releases and delivered artifacts are unchanged.

## Migration Plan

1. Replace the input, plan, layout, media and delivery modules and delete the
   superseded code, supplies, tools and tests on this Lane.
2. Convert AIGW, rewrite the self model and author the ETHOS model.
3. Rewrite the README, product contract and references.
4. Pass the quality gates, obtain the user's acceptance of the artwork,
   deliver to Documents and publish a signed breaking release.

Rollback is the previous signed release; its tags, packages and delivered
artifacts are not modified.

## Open Questions

None block implementation. Native Archify source links for the three current
repositories require an `origin` remote, which only their owner can add.
