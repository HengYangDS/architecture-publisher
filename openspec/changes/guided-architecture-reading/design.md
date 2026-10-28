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
- Posters are graph-first; evidence moves to the interactive page and the
  manifest.
- Every poster is one 2400 × 1350 px (16:9) page with 14 px text, composed
  so that its figure fills the page; large systems use an overview plus
  mechanism views.
- The interactive medium is an Archify explainer page; primary labels read at
  13.75 px in its previews and 14 px or more in the full viewer, and relation
  labels keep Archify's native size.
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
  glance, the page answers the model's question view by view, and the manifest binds
  both to exact content.
- Neatness is measured, not judged: equal cards on one grid, orthogonal wires,
  no overlapping lines or labels, and text never below 14 px.
- Identical inputs produce identical bytes; each layout is the exact optimum of
  one published cost, with no candidates, retries or randomness.
- Each poster fits its frame at its type scale, or the build refuses with the
  view, its measured size and the remedy.
- The page is produced by unmodified native Archify.
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

A view is a poster and a panel of the page. A model declares at most five
views. Each view has an
`id`, an optional `title`, `question` and `summary`, and either:

- `tiers`: ordered group ids, or inline groups, drawn as rows in that order,
  used when groups are architectural layers; or
- `members`: component ids whose rows follow their relations.

Members are assigned rows after reversing the edges that close cycles, so
every relation points downward or stays within one row. One explicit cost
chooses the rows: a row over its limit, or an outside component left without a
free column beside the system boundary, outweighs everything; then each row a
relation skips; then a card with more than two neighbours in its row or a ring
of relations within one row, which no order keeps adjacent; then each relation
within one row, cheaper between peers that share a caller; then each further
row. A deterministic steepest descent from longest-path levels minimizes it,
moving one component to any level its relations allow, pushing one component
down with what would rise above it, or moving one component with everything
below it. A heuristic of sibling merges and pulled-down sources was replaced
because it ignored the row limit and left long relations, which both media draw
poorly. Groups are rows only when a view names them as tiers.

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
- more than two bends on a relation, or four when it skips rows, a segment
  shorter than 16 px, or a route longer than 1.35 times its shortest
  orthogonal route;
- text below 14 px, or content outside the frame.

These limits are Archify's own suggested limits, so the poster and the page
are judged by the same rules.

Crossings are minimized by placement and channel routing and reported, not
refused: some relation sets, such as three components each calling the same
three others, cannot be drawn without one. A remaining crossing is
perpendicular and never at a bend, a port or a label.

### 8. Format-first poster composition

The user rejected the first grid posters on 2026-10-28: large blank areas, a
centre of mass off the page, text set apart from the figure and page shapes
that followed the content. Measured on all twelve posters, the largest empty
rectangle covered 9 to 31 percent of the live area, blank bands reached
330 px, the ink centroid sat up to 14 percent left of centre and the emptiest
ninth of a figure held 0.6 percent of its ink. The cause was the order of
operations: the figure was laid out without knowing the page, then scaled by
at most 1.4 and centred between a header and a footer that were stacked
blocks with their own spacing. Nothing measured the result.

The poster is now composed format first:

- **Format.** One page, 2400 × 1350 px (16:9), the shape of a projected slide,
  chosen by the user. Content never changes it; a view that cannot be composed
  in it is refused.
- **Grid.** Design tokens own an 8 px unit, twelve columns between fixed
  margins, a baseline and a type scale (14, 16, 18, 20, 24, 28, 32 and 48 px).
  Every block starts on a column line and a baseline; text keeps a measure of
  at most 80 characters. Three archetypes share the grid: a masthead (head,
  summary and legend across the top, figure across twelve columns), a sidebar
  (all text in the left columns, figure over the full height of the rest) and,
  for a page of one view, a corner page (figure across the full width, head,
  summary and legend set in the corners it leaves free).
- **Solver.** For each view the publisher enumerates archetype, a row wrapping
  that splits a wide tier into consecutive rows of one band, and a figure type
  step (card labels at 18, 20 or 24 px with details and relation labels at 14,
  16 or 18 px, so no size grows past 1.4 times its densest step). It lays out
  every candidate with the grid engine, then justifies it to the field: cards
  take the remaining height within their aspect and row channels deepen within
  a token bound, instead of scaling the figure. Among candidates that pass the
  gates it takes the one with the lowest cost, which is the empty-rectangle
  share, then the centroid offset. The candidate set is finite and ordered, so
  the choice is deterministic.
- **Gates.** The same measures decide and verify: balance (largest empty
  rectangle at most 12 percent of the live area, reach of at least 90 percent
  of its width and height, centroid within 6 percent of the figure fields'
  centre), type (scale sizes only, 14 px floor, measure, no broken label) and
  line (two bends, or four for a relation that skips rows; 16 px segments; no
  wire across a card or label). The emptiest ninths of the figure field are
  recorded but not gated: a tree's corners are empty by its shape, and the
  corner page fills them with text instead. A page with no passing candidate is
  refused with every failing measure and its limit.

Composing the AIGW, self and ETHOS views against these gates showed that one
view per page cannot work for every view: a view of three to five components
has a natural figure of 300 to 450 px, a third of the page, and no
justification within the token bounds fills the rest. The page, not the view,
became the unit:

- **Pages of plates.** A page carries one to three consecutive views as plates,
  each with its question as a heading. The grouping is chosen for the whole
  edition by an exact search over consecutive groupings, maximising pages that
  pass every gate, then fewer pages, then the smallest empty share; a greedy
  packer stranded the last sparse view alone.
- **Bands from natural heights.** Each plate's band is its figure's natural
  height at the densest step plus a share of the surplus in proportion to it.
  Equal bands overflowed the tall plate and left the short one blank.
- **Cards carry vertical fill.** Within its band a figure's cards grow to take
  the slack, capped by the card height token and by a card aspect of 2.6, and
  only then do the channels deepen. A card wider than five times its height
  after growing is a strip and its wrapping is rejected; a label that would
  break inside a word rejects its wrapping too.
- **Rail and masthead.** The sidebar rail is three or four columns and spaces
  its blocks, including the notes, over the full height, because a rail of
  500 px of text against 1222 px of column left the void the gates measure.
  The masthead splits its twelve columns among head, summary and legend, and
  sets the legend in up to three sub-columns, choosing the shallowest band and
  then the most level columns: a fixed five-three-four split left a legend
  column taller than the title beside it, and the paper under the title was
  the largest blank on the page.
- **Text set with the figure.** Composing models of unrelated repositories
  showed that a tree, narrow at its root and wide at its leaves, fails in every
  band-based archetype: the paper beside its narrow rows is the largest blank,
  and its ink sits low. The corner page draws such a figure across the full
  width and only then sets the head at the top-left corner and the summary and
  legend in whichever corners and widths leave the page least empty, each 40 px
  clear of every card, wire and label and 24 px clear of the boundary frame.
  The page tries its plate's compositions best first, because the figure that
  fills its band most can leave no corner for the head, and it may reserve a
  strip above the figure for the head when the figure's first row fills its
  boundary. The tier-label column is as wide as its widest label, not a fixed
  280 px, and no text is cut to fit: a width that cannot hold a title,
  question, summary, legend entry or plate heading is not used.
- **Larger type where cards are hollow.** Cards take a band's slack at every
  type step, so the fill measure ties across steps and the old tie-break, the
  smaller step, set 18 px labels in 700 px cards. Among compositions within two
  percent of the fullest the larger step now wins. Card text never breaks
  between two letters; a detail path breaks after a slash or hyphen.
- **Ink-centred figures and contained wires.** The layout centres the span of
  its cards, which leaves a figure with off-centre single-card rows heavy to one
  side; the drawn figure moves just far enough to bring its ink within 2.5
  percent of the centre line. A long relation's corridor could fall past the
  last used column and run off the page; corridors are now bounded by the
  content width, and a plate that draws anything outside its field is
  rejected.
- **Centred rows and measured regions.** Placement carries a row-centring cost
  above one bend and below one crossing, taken over all of a row's cards or
  only those inside the boundary, and the page tries both. The empty rectangle
  and the reach are measured over the whole page; the centroid over the
  figures' own fields, so a rail of text beside a centred figure is not read as
  an off-centre figure.

The figure keeps decision 6's equal cards and channels; the poster draws
card labels at 24 px and details, relation labels, legend and notes at 16 px
before the type step. Relation labels use a lighter ink than card labels, and
tier bands span their members rather than the page. `planned` is dashed and
`retired` is dotted and muted. Claim records, digest lists, status tables and
reading indexes are not printed. The poster is written as SVG with text
converted to glyph outlines and as PNG at 2400 and 6000 px through the
vendored resvg.

Scaling a laid-out figure into a fixed stage was rejected because it
equalizes nothing: a two-row view stays a strip in the middle of the page.
Free-form ratios were rejected by the user.

### 9. Bundled fonts and icons

Noto Sans CJK SC 2.004 Regular and Bold (SIL Open Font License 1.1) are
bundled unmodified with their license and SHA-256 digests. They cover Latin
and CJK labels with one family. Host fonts are never discovered. The
JetBrains Mono supply and the interactive font substitution are removed; the
page keeps Archify's native typography.

The existing icon supply, the complete Lucide 1.61.0 artwork (ISC) with its
license and digests, is retained unmodified. Each category has a default icon,
and a kind may name any Lucide icon; an unknown name is a validation problem.

### 10. Native Archify explainer page

The interactive medium is one Archify explainer page, chosen by the user on
2026-10-28, produced by the vendored, unmodified Archify 3.2.0 through
`archify deliver explainer` from a draft and one architecture document per
view that archpub writes. It replaces the single full-model map.

Archify was measured before this choice. Its schema accepts `meta.views`, but
3.2.0 renders nothing from them, so the map's promised guided views never
reached a reader. Its reader fits a map with a fixed viewBox at about 1346 px
wide and scrolls the page, which made the 20-component ETHOS map a strip
10,277 px tall; an automatic canvas fits the first screen only by dropping
labels below 14 px, to 10.4 px for a five-by-four grid. Archify's own check
reported ten crossovers and routes of up to eight bends on that map.

The explainer page answers the model's question:

- the page title is the model's question, its conclusion the model's summary
  and its scope the model's scope, limits and attribution;
- each view is a panel titled with the view's question, in the plan's order,
  with the view's native architecture diagram, which opens Archify's full
  interactive viewer, and steps that light each component with its first
  detail;
- when the model declares a repository, each component's first source is a
  numbered page source pinned to its revision; digests and verification
  states stay in the manifest.

Each view diagram is laid out by the grid engine with Archify's text metrics
for a finite set of candidates, each a row wrapping and a content width.
Archify computes every candidate's routes (`validate --layout-json`), and
archpub takes the candidate with the fewest crossings, then the fewest routes
over two bends, then the least stretch above 1.35, then the shape closest to
1.0 to 1.8 times as wide as high. The chosen diagram passes Archify's showcase
checks, or the view is refused with Archify's findings. In-page previews are
enlarged at most 1.25 times by Archify, so primary labels read at 13.75 px
there and at 14 px or more in the full viewer.

A single full-model map was rejected because a large model cannot be both
complete and readable in one diagram, and because its reading order was lost.
Patching Archify to render guided views was rejected by the official-source
rule.

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
view. One model is rebuilt to compare bytes. The composition gates are
tested against posters that must pass and posters that must fail them, and
Chromium measures the page's label floor. The repository's existing format, lint, type, import, dead-code,
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
- [Archify 3.2.0 renders no guided views, enlarges page previews at most
  1.25 times and routes every connection itself] → Each view is its own panel
  and diagram; previews read at 13.75 px and the full viewer at 14 px or
  more; candidates are compared on Archify's own routes, and a view without a
  candidate that passes its showcase checks is refused with its findings.
- [A view whose every composition leaves the page unbalanced] → The build
  refuses it with the measured values and limits, and the author splits or
  regroups the view; the format and the type floor never change.
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
