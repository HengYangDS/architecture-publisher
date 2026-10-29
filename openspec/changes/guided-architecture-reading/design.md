## Context

Architecture Publisher (archpub) turns an explicit description of a software
architecture into media people can read and verify. Its previous design failed
its readers: posters printed every claim as text cards around a small graph,
ELK layout refused the public AIGW frame, the interactive medium replaced
Archify's fonts, routing and inspection with its own code, and qualification
and custody planes recorded decisions no check produced. The redesign starts
from what a reader needs and what the user decided:

- Rewrite the rendering layer and delete code without a consumer, keeping the
  LikeC4 import.
- Posters are graph-first; evidence moves to the interactive page and the
  manifest.
- Every poster is one 2400 × 1350 px (16:9) page with 14 px text, composed
  so that its figure fills the page; large systems use an overview plus
  mechanism views.
- The interactive medium is an Archify explainer page; primary labels read at
  13.25 px or more in its previews and 14 px or more in the full viewer, and
  relation labels keep Archify's native size.
- Boxes align on one grid, each column's cards one width and each row's one
  height; the user rejected ELK's boxes, which differed in size and height.
- Deliver AIGW, self and ETHOS media to the publication root the user chose
  and a signed release.
- The product must draw any repository, not only ETHOS, AIGW and itself, in
  any language its bundled faces set, with no deployment written into it.

## Goals / Non-Goals

### Goals

- One explicit Architecture Model is the only input; an agent, a person or the
  LikeC4 importer can produce it for any repository.
- Three media with distinct jobs: the poster explains one question at a
  glance, the page answers the model's question view by view, and the manifest binds
  both to exact content.
- Neatness is measured, not judged: cards on one grid, orthogonal wires, no
  overlapping lines or labels, and text never below 14 px.
- Identical inputs on one platform give identical bytes; each choice takes the
  best of a finite, ordered candidate set, with no randomness.
- Each poster page passes its balance gates, or is recorded as sparse when its
  figures are already at the largest step; any other miss refuses a showcase
  build with the view, its closest page's measures and the remedy, and a
  standard build delivers the page as a recorded draft.
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

- `id`, `title`, `question`, optional `locale`, `summary` and `attribution`;
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
any output. The model's id names its published directory, so a Windows device
name or a trailing dot is refused.

`locale` is one of the languages Archify's page speaks: `en`, the default,
`zh-CN`, `zh-TW`, `es` and `ko`. The words the publisher writes itself, the
notes' headings, legend entries, derived details, the import's relation label
and question, and how details, lists and sentences are punctuated, live in one
table keyed by it; everything else a reader sees is the model's own text.

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
`--repo`, the manifest records sources as declared and unverified; posters
and the page state no verification.

Content digests, not remote names, are the identity anchor: none of the three
current repositories has an `origin` remote, and a checkout's working tree may
differ from the revision. The page cites a source at the declared repository
URL and revision (decision 10) without reading a remote; Archify's own
repository evidence, which requires an `origin`, is not used.

### 5. Reading Plan and rows

A view is a plate on a poster page and a panel of the page. A model declares
at most four views, the diagrams one Archify explainer page holds. Each view
has an `id`, an optional `title`, `question` and `summary`, and either:

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
3. otherwise, or when more than four views would result, a refusal that
   names the view's counts and the page size and asks for groups or views.

A view is admitted when some page of its own lays it out (decision 8); whether
its page balances is decided when the edition is grouped.

### 6. Grid layout

Both media use one layout engine. Each medium supplies its own metrics: card
width bounds, text measurement, label sizes and spacing.

- **Cards.** The lattice gives every card one slot, the widest that lets the
  widest row fit the frame, capped by the medium. A medium that sizes cards by
  their text draws each as wide as its text within the slot, and the cards of
  one column take the widest of them; every card of a row is as tall as its
  tallest content. Column gaps may widen up to the medium's spread, and a
  column count that narrows every card below the medium's cap costs placement
  more than the alignment it buys.
- **Lattice.** Card positions are whole or half columns of one pitch (card
  width plus column gap); half columns center a card between two others.
- **Placement.** Rows are placed by exact dynamic programming over every row
  order and lattice position, or contiguous positions past a state budget. The
  cost weighs a crossing between adjacent rows most, then a same-row relation
  with no room for a straight arrow, and adds row centring where the medium
  asks for it, cards narrowed below their text, bends, spare columns, an
  off-centre bus hub, half columns and departures from model order. A second
  pass keeps long relations' endpoints near the first optimum's corridors.
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
  rows runs down the free column gap, empty cell or lane beyond the outermost
  cards that crosses the fewest wires, then runs shortest.
- **Channel routing.** Each channel is solved exactly at the fewest label rows
  that route it cleanly, over every label position (on the jog, beside the
  source or the target) and track order, keeping each medium's clearances, on
  posters 24 px between wires and 16 px from a label to another wire; a lane
  keeps twice the wire distance from the cards and the boundary. Wider port
  spacings and up to three label rows are tried while they cross less. Ports
  keep their far ends' order, each as near its target as spacing allows. A
  vertical turning just under or over a card other than its own end costs
  more, as a reader takes it for that card's wire.
- **Bounds.** A row holds at most six cards, or five beside row labels. A wider
  row or a channel without a clean solution refuses that layout; each medium
  then tries its other wrappings and refuses a view only when none lays it out.

ELK, Graphviz, D2 (including TALA), PlantUML C4, LikeC4's own layout and
libavoid, measured on the AIGW overview, optimise edge length and crossings,
not a grid: none keeps aligned cards, tier order and clear labels together, and
libavoid places no labels. The previous band layout handled only edges between
adjacent bands.

### 7. Measured neatness

Every laid-out view is measured before any output. A layout is rejected,
never drawn, with any of:

- a wire segment that is neither horizontal nor vertical;
- two wires of different relations sharing a segment;
- a wire through a card;
- a label box overlapping a card, another label, another relation's wire or
  the system boundary's edge.

Route defects are counted, not refused: parallel wires closer than 24 px, a
wire stopping within 48 px of another in line with it, arrowheads closer than
two heads and a label within 16 px of another wire. Two relations' jogs and
labels on one label row, and the tracks of one band, keep 48 px apart, or the
row reads as one labelled bus. Posters rank by crossings, then route defects,
and record both; the page's diagrams are judged on Archify's own routes
(decision 10).

Crossings are minimized by placement and channel routing and reported, not
refused: some relation sets, such as three components each calling the same
three others, cannot be drawn without one. A remaining crossing is
perpendicular and never at a bend, a port or a label.

### 8. Format-first poster composition

The user rejected the first grid posters on 2026-10-28 for large blank areas,
an off-page centre of mass, text apart from the figure and page shapes that
followed the content: the figure was laid out without knowing the page, then
scaled and centred, and nothing measured the result.

The poster is now composed format first:

- **Format.** One page, 2400 × 1350 px (16:9), the shape of a projected slide,
  chosen by the user. Content never changes it; a view that cannot be laid out
  in it is refused.
- **Grid.** Design tokens own an 8 px unit, twelve columns between fixed
  margins, a baseline and a type scale (14, 16, 18, 20, 24, 28, 32, 36 and
  48 px).
  Every block starts on a column line and a baseline; text keeps a measure of
  at most 80 characters. Three archetypes share the grid: a masthead (text
  across the top, figure across twelve columns), a sidebar (text down three to
  five left columns or also a right flank, figure between) and, for one view,
  a corner page (figure across the full width, head and summary at the top
  left, legend and optionally the notes in corners the figure leaves free).
- **Solver.** For each view the publisher enumerates archetype, a row wrapping
  that splits a wide tier into consecutive rows of one band, and a figure type
  step. It lays out every candidate with the grid engine at the cards' own size,
  then justifies it to the field: row channels deepen within a token bound and
  the rest is centred, instead of scaling the figure or stretching its cards.
  Among pages that pass every gate it takes the fewest crossings, route defects
  and bends, then the least area in holes and blank, then the centroid offset;
  the candidate set is finite and ordered, so the choice is deterministic.
- **Gates.** Every drawn page passes four balance gates, measured over its live
  area from the ink it draws: the largest blank rectangle covers at most 12
  percent of it; no band 96 px or taller runs blank across it, wires and rules
  not counting; at most 40 percent of it lies in holes, empty squares of 240 px
  or more; and its darkness-weighted centroid lies within 12 percent of the
  centre across and down. Type holds by construction: scale sizes only, a 14 px
  floor, the measure and no word broken on a card. A grouping no passing page
  holds prints on a sparse page when its figures already stand at the largest
  step; otherwise showcase refuses it, naming each view with its closest page's
  measured values and limits, and standard records it as a draft.

A view of three to five components has a figure a third of the page tall, which
no justification fills, so the page, not the view, became the unit:

- **Pages of plates.** A page carries one to three consecutive views that share
  no component as plates; on a page of several, each plate is headed by its
  own question. A band holds one plate or several side by side, each taking a
  share of the band's width in proportion to the width its figure needs, so
  three short plates may set two side by side over the third. The grouping is
  chosen for the whole edition by an exact search over consecutive groupings of
  pages that pass every gate, minimising the page count, then the area in
  holes; a greedy packer stranded the last sparse view alone.
- **Bands from natural heights.** Each plate's band is its figure's natural
  height at the densest step plus a share of the surplus in proportion to it.
  Equal bands overflowed the tall plate and left the short one blank.
- **Cards as large as their text.** Cards grown into a band's slack passed the
  gates as paper in boxes, so a card is as wide as its label and longest detail
  need within measures of 16 and 24 ems, and as its column's widest card; every
  card of a row is as tall as the row's tallest text, details directly under
  the label. A word that would break inside a card rejects its wrapping.
- **Rail and masthead.** The sidebar rail is three to five columns, or three
  with the legend and notes down a right flank of three; its blocks stand up to
  a column gap apart and centred. The masthead splits its twelve columns among
  head, summary and legend, and sets the legend in up to three sub-columns,
  choosing the shallowest band and then the most level columns, so no legend
  column stands taller than the title beside it.
- **Text set with the figure.** Composing models of unrelated repositories
  showed that a tree, narrow at its root and wide at its leaves, fails in every
  band-based archetype: the paper beside its narrow rows is the largest blank,
  and its ink sits low. The corner page draws such a figure across the full
  width and only then sets the head, its summary under its question, at the
  top-left corner and the legend in whichever corner and width, from two
  columns up, passes the gates and leaves the least blank, each 40 px clear of
  every card, wire and label and 24 px of the frame. A corner page may also set
  its notes as one block in a bottom corner or along the foot instead of in a
  footer, so a compact figure's lower corners hold the fine print.
  The page tries its plate's compositions best first, because the figure that
  fills its band most can leave no corner for the head, and it may reserve a
  strip above the figure for the head when the figure's first row fills its
  boundary. The tier-label column is as wide as its widest label, not a fixed
  280 px, and no text is cut to fit: a width that cannot hold a title,
  question, summary, legend entry or plate heading is not used.
- **Plates judged as figures.** With cards no longer stretched, a plate chosen
  by how much of its band it covers split rows that fit, to make a looser
  figure reach further. A plate now offers every wrapping in order: the fewest
  crossings and route defects, then the largest step, then the widest rows,
  layered before flatter, then the centred figure; a page takes a narrower
  wrapping only when wider ones fail a gate or wire worse. Filling the page is
  the page's work: grouping, band arrangement, corner text and type size.
- **Sparse views set larger.** A view of five to seven components still leaves
  a page half empty at 24 px, and no neighbour can share its page. Shown both,
  the user chose on 2026-10-28 to set such figures larger rather than keep the
  1.4 bound: two steps, 28/20/20 and 32/24/24, scale cards, padding, icons,
  gaps and wires with their text, up to 1.8 times the densest step. The view
  heading rises to 36 px so that no card label outranks it, and every plate of
  a page uses one step, so a page never pairs a large figure with a small one.
- **Summaries set once.** A page of one view sets that view's summary, or on
  the first page the model's; a page of several sets the model's only on the
  first page and each plate's own under its heading; the scope note carries the
  scope only, so no summary prints twice.
- **Ink-centred figures and contained wires.** The layout centres the span of
  its cards, which leaves a figure with off-centre single-card rows heavy to one
  side; the drawn figure moves just far enough to bring its ink within 2.5
  percent of the centre line. Corridors are bounded by the content width, and a
  plate that draws anything outside its field and tier column is rejected.
- **Centred rows and measured regions.** Placement carries a row-centring cost
  above one bend and below one crossing, taken over all of a row's cards or
  only those inside the boundary, and the page tries both. Every balance gate
  is measured over the live area with the page's text, and the centroid weighs
  each mark by how dark it prints.
- **Crossings before height.** A channel takes the fewest crossings over every
  port spacing and label row, then the lowest. When a page's best candidate
  still crosses or has a route defect, or none passes, its plates are also laid
  out uncentred and the page is chosen from both.
- **One column of tier labels.** A blind review on 2026-10-29 read the rule
  under each row as a stray wire and labels beside each row's first card as a
  zigzag. The rules are gone, the labels stand in one column before the figure,
  and the boundary keeps 20 px of paper on every side, the most at which every
  edition still balances. Where one column balances no page, as Big Bank's data
  tier starting far left of its boundary shows, tiers that start at one edge
  share a column before it. A label centred on two rows read as a relation
  label between them, so it stands level with the first, beside a bracket.

The figure keeps decision 6's lattice and channels. Relation details use a
lighter ink than their labels. `planned` is dashed and
`retired` is dotted and muted. Claim records, digest lists, status tables and
reading indexes are not printed. The poster is written as SVG with text
converted to glyph outlines and as PNG through the vendored resvg.

Scaling a laid-out figure into a fixed stage leaves a two-row view a strip in
the middle of the page; the user rejected it and free-form ratios.

### 9. Bundled fonts and icons

Noto Sans CJK SC 2.004 and Noto Sans 2.015, Regular and Bold (SIL Open Font
License 1.1), are bundled unmodified with their licenses and SHA-256 digests.
Each text is set in the first face of its weight that draws it whole, CJK
first, so text the CJK face covers keeps its glyphs and Latin, Greek and
Cyrillic letters it lacks come from Noto Sans. Outlines are drawn glyph by
glyph without shaping, so right-to-left and shaped scripts are refused. Lines
break where the writing system allows: at spaces, and between Han and Kana
characters with closing marks kept back and opening marks forward; the rules
read characters only, so every host breaks alike. Host fonts are never
discovered. The
JetBrains Mono supply and the interactive font substitution are removed; the
page keeps Archify's native typography.

The existing icon supply, the complete Lucide 1.61.0 artwork (ISC) with its
license and digests, is retained unmodified. Each category has a default icon,
and a kind may name any Lucide icon; an unknown name is a validation problem.

### 10. Native Archify explainer page

The interactive medium is one Archify explainer page, chosen by the user on
2026-10-28, produced by the vendored, unmodified Archify 3.2.0 through
`archify finalize explainer` from a draft and one architecture document per
view that archpub writes. It replaces the single full-model map.

Archify 3.2.0 renders nothing from `meta.views`, so the map's guided views
never reached a reader, and its reader fits a fixed-viewBox map at about
1346 px wide: the 20-component ETHOS map became a strip 10,277 px tall, while an
automatic canvas fits the first screen only with labels below 14 px.

The explainer page answers the model's question:

- the page title is the model's question, its conclusion the model's summary,
  with each panel's title listed beside it as a link, and its scope the model's
  scope, limits and attribution;
- each view is a panel titled with the view's question, or its title when it
  asks the model's own question, in the plan's order, with the view's native
  architecture diagram, named by its own title or else its question, which
  opens Archify's full interactive viewer, and steps that light each component
  with all of its details, in the diagram's reading order;
- when the model declares a repository URL and revision, each component's
  first source is a numbered page source linked to the file at that revision,
  listed under the first citing component's name; a component without details
  names that file in its step. Digests and verification stay in the manifest.

An explainer page holds at most four diagrams, so a model declares at most
four views (decision 5). A page has one quality profile: every diagram is
checked at showcase quality, and a view that cannot pass refuses the build
rather than lowering the whole page.

Each view diagram is laid out by the grid engine with Archify's text metrics
for a finite set of candidates: the plan's rows wrapped at five, four and
three cards, at diagram widths of 960, 840 and 720 px, which a preview
spanning its panel at 1440 px shows at Archify's full 1.25 times enlargement.
A card is at least as wide as the view's longest label needs, so the grid gives
up a spare column rather than narrow a card below its label. Archify validates
every candidate at the build's quality, with the grid's sides and with every
side left to Archify, and lays out its routes. Blind reviews found misread what
Archify does not report: routes 1 px off one line, or two cards' routes into
one point, read as a relation the model lacks, a route 3 px from an edge as a
second outline, a label 4 px under a card as the card's, ends 14 px apart on
one side of a card as one doubled arrow. archpub measures them against
Archify's 8 px shortest and 16 px interior segments and takes the fewest routes
that read as one or along an edge, since a crossing still reads as two, then
crossings, a preview beside its steps, labels read as another's, doubled
routes, routes over two bends, crowded labels and ends, stretch above 1.35 and
the shape closest to 1.0 to 1.8. A choice with a defect, or stacked above its
steps, has the connections involved re-sided from the three best diagrams and
the three best beside their steps, within 96 measured changes; a label still
misplaced is then pinned on or beside its own route, one read as another's
alone as well, since a pin moves Archify's routes. A view with no passing
candidate is refused with Archify's findings.

A preview that spans its panel sets primary labels at 13.75 px. A preview
beside its steps is drawn no narrower than lets its smallest text, the 9-unit
sublabel, reach Archify's reading floor, three quarters of the page's 14.5 px
body text at a 1440 px viewport, which sets primary labels at 13.29 px or
more. The full viewer draws them at 14 px or more.

Components carry no kind tag. Archify's 7 px tag text would sit below that
reading floor at any enlargement a panel allows, and Archify would mark the
preview with its notice that the diagram cannot fit the page with readable
text; the legend names the kinds by their colour instead.

Archify will not cite a source in a sensitive file class, such as a path with
a `secrets` segment. Such a source is withheld from the page and recorded as
withheld in the manifest, and a component that cites it cites its next source.

The draft and the diagram documents are written into a fixed-name directory
inside the staged delivery, because the page records their location relative
to itself, and are removed with Archify's receipts once the page is written.

A single full-model map was rejected because a large model cannot be both
complete and readable in one diagram, and because its reading order was lost.
Patching Archify to render guided views was rejected by the official-source
rule.

### 11. Deterministic delivery and minimal trust

`archpub build <model> --out <dir>` writes, into a directory that must not
exist, `page-<n>.svg` and PNGs at 2400 px, or the widths `--png` names, for
each poster page, `index.html` and `manifest.json`; `--media` builds the
posters or the page alone, and only what it delivers is composed. Output is staged and moved into place, so a
failed build leaves nothing behind. The manifest records its format and
version, the publisher's name and version, the model's id, title, digest and
size, the repository, the font, icon, resvg and Archify digests, the plan,
each poster's composition and measures, the page's quality and gates, each
diagram's Archify metrics, re-sided connections and pinned labels, the withheld
sources, every artifact digest and source record, and the evidence of every
component and relation. It has no timestamps; a rebuild of the same model and
version on one platform reproduces every byte. `archpub check` does all but
write the delivery: its Archify work stays in a temporary directory it removes.

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

`archpub` offers `build`, `check`, `import likec4`, `accept`, `publish`,
`--help` and `--version`, and no aliases. `--quality standard` delivers drafts
instead of refusing; showcase stays the default. With `--json`, each prints one
object with `ok` and its outputs or diagnostics. Exit status 0 means success, 1 a refused input, 2 a usage error
and 3 any other failure, reported as `internal_error`.

### 13. Retained and removed modules

Retained: the LikeC4 parser, font, icon, resvg and Archify supplies with their
verification tools, the release and CI tooling and the quality gates. Removed:
the Provider, the Claim Model and Edition generations, source bundles, scene
programs, authored routes, the custom renderers, the ELK, libavoid, dagre and
JetBrains Mono supplies, qualification, publication, the browser-evidence
harness and their tests. The self edition is a model file in `editions/self`,
and Markdown size is the ETHOS paradigm's ceiling, not a rule of this
repository.

### 14. Edition content

AIGW and ETHOS models live in `architecture-publications`, owned by their
editor; the self model lives in this repository. The AIGW conversion keeps
every entity, relation and source id, label, kind, qualifier, limit and
attribution, with its sources pinned to an `aigw-cli` revision. The self and
ETHOS models are written from their repositories at pinned revisions as an
overview plus mechanism views.

### 15. Verification

Tests cover model validation, source binding, the plan and automatic rows,
placement and channel routing, the neatness measurements, layout determinism,
poster admission, the page's diagrams and draft, the CLI and the LikeC4
import.
End-to-end journeys build the converted AIGW model; the C4 Big Bank example
with tiers and without them; models with a cycle, a relation skipping rows, a
six-way bus, three components each calling the same three others, and CJK
labels; a sparse page for a model too small to fill one, a tall view refused at
showcase and drafted at standard, and refusals of a seven-card layout row and a
view no page lays out. One model is rebuilt to compare bytes, on
one platform. The balance gates are tested on pages that must pass or fail, and
Chromium measures the page's label floor and that no preview shows Archify's
fit notice. The repository's existing format, lint, type, import, dead-code,
Markdown, OpenSpec, coverage (at least 95 percent per dimension) and package
gates stay in force. The user accepts the artwork; tests do not.

## Risks / Trade-offs

- [A poster holds about twenty-five cards: five rows of up to five or six]
  → The plan splits large models into an overview and mechanism views and
  refuses rather than shrinking text.
- [Exact placement grows with row width and lattice size] → Rows are limited
  to six cards and the lattice to two spare columns; the AIGW and Big Bank
  views lay out in under a second.
- [Some views have no clean channel routing] → That layout is rejected and the
  next wrapping, width or step tried; a view none lays out is refused, and the
  editor reorders tiers or splits the view.
- [Centred rows can bend wires] → Row centring outweighs one bend but never a
  crossing, and a page that still crosses also tries its rows uncentred.
- [The bundled fonts add about 33 MB] → Two families cover Latin, Greek,
  Cyrillic and CJK without host fonts; a subset would be a modified font to
  maintain.
- [Archify 3.2.0 renders no guided views, enlarges page previews at most
  1.25 times and routes every connection itself] → Each view is its own panel
  and diagram; previews read at 13.25 px or more and the full viewer at 14 px
  or more; candidates are compared on Archify's own routes, and a view without a
  candidate that passes its showcase checks refuses the build with its
  findings, because a page has one quality profile.
- [A view no balanced page holds, alone or with a neighbour] → A model too
  small to fill it prints on a sparse page; otherwise a showcase build is
  refused with `poster_unbalanced`, naming the view and each gate its closest
  page misses, and a standard build records it as a draft; the format and the
  type floor never change.
- [Previous inputs stop working] → The three real inputs are converted or
  rewritten; earlier releases and delivered artifacts are unchanged.

## Migration Plan

1. Replace the input, plan, layout, media and delivery modules and delete the
   superseded code, supplies, tools and tests on this Lane.
2. Convert AIGW, rewrite the self model and author the ETHOS model.
3. Rewrite the README, product contract and references.
4. Pass the quality gates, obtain the user's acceptance of the artwork,
   publish to the user's publication root and a signed breaking release.

Rollback is the previous signed release; its tags, packages and delivered
artifacts are not modified.

## Open Questions

None. A build is held to showcase quality unless it asks for standard.
