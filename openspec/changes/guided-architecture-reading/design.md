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
- Identical inputs produce identical bytes; no layout is chosen by search.
- Each poster fits its frame at its type scale, or the build refuses with the
  view, its measured size and the remedy.
- The map is produced by unmodified native Archify.
- Trust is minimal and real: content digests at a pinned revision, one
  acceptance record and immutable versioned publication.

### Non-Goals

- Inferring architecture from source code. Agents may author models; the
  publisher does not guess them.
- Mobile layouts, PDF, PPTX, resident services, registries or catalogs.
- Modifying Archify, ELK, resvg, fonts or any other vendored supply.
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
- optional `kinds` (label, legend order and interactive `category`),
  `groups` (`id`, `label`, `members`) and `views` (decision 5).

`details` maps a name to a string or a list of strings and carries the
qualifiers a reader needs, such as `owns: account tokens`. `status` is
`implemented`, `planned` or `retired`; absence means not stated. A JSON Schema
shipped with the package defines the format; validation reports every problem
with its JSON path before any output.

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
(decision 9) and never fabricates a remote to satisfy it.

### 5. Reading Plan

A view is a poster and a guided view of the map. A model declares at most
five views, matching Archify's native guided-view limit. Each view has an
`id`, an optional `title`, `question` and `summary`, and either:

- `tiers`: ordered group ids drawn as horizontal bands, used when groups are
  architectural layers; or
- `members`: component ids laid out by their relations alone.

Groups are bands only when a view names them as tiers. The previous self
edition put one element in each group; forcing those groups into bands turned
a two-branch pipeline into one vertical chain twice as tall as its flow
layout.

Without declared views, the plan is derived deterministically:

1. one flow view of all components, if it is admitted;
2. otherwise, when the model has groups: an overview with one node per group
   and one aggregated relation per ordered group pair, followed by one view per
   group with its members and their direct neighbors as context;
3. otherwise, or when more than five views would result, a refusal that names
   the measured size and asks for groups or views.

Admission composes the poster once and measures it (decision 7). Nothing is
retried with other parameters.

### 6. One fixed layout configuration

Both media use ELK layered once per view with one configuration: downward
direction, orthogonal routing, network-simplex node placement, model-order
crossing minimization, a fixed seed, centered edge labels and merged edges.
Tiers become ELK partitions. Each medium supplies its own node and label
metrics, so the poster and the map never share coordinates or screenshots.

Edge labels are passed to ELK as measured boxes with their text, because
elkjs 0.12 does not place labels that have no `text`. When several relations
share a source, label and details, the first carries the label and the others
share its route. Edge coordinates are requested in root space. A view with
more than eight distinct kinds is refused, because the legend can then no
longer distinguish them.

A custom band layout was rejected: it handled only edges between adjacent
bands, while arbitrary repositories have cycles, skipped tiers and no groups.
Candidate search, libavoid and dagre were rejected or removed for the reasons
in the context.

### 7. Graph-first poster

The poster has a fixed width of 1800 px and a height of at most 1350 px:

- a header with the title (40 px bold), the view question (20 px) and a
  summary of at most three lines (16 px);
- the graph: each component shows a kind glyph, its label (17 px bold) and its
  details (14 px); each relation shows its label and details (14 px) beside
  its route; tiers are tinted bands with their labels in a left column;
  `planned` is dashed and `retired` is dotted and muted;
- a one-line legend of the kinds and statuses present;
- a footnote with scope, limits, attribution, the repository revision and the
  source verification state.

No text is smaller than 14 px. Claim records, digest lists, status tables and
reading indexes are not printed. Colors, spacing and type sizes are design
tokens in one module. The poster is written as SVG with text converted to
glyph outlines, so it renders identically without fonts, and as PNG at 1800
and 6000 px through the vendored resvg. Overlapping labels, nodes outside the
frame or text below the floor are composition defects that fail the build.

### 8. Bundled fonts

Noto Sans CJK SC 2.004 Regular and Bold (SIL Open Font License 1.1) are
bundled unmodified with their license and SHA-256 digests. They cover Latin
and CJK labels with one family. Host fonts are never discovered. The
JetBrains Mono supply and the interactive font substitution are removed; the
map keeps Archify's native typography.

### 9. Native Archify map

The interactive medium is one standalone HTML document produced by the
vendored, unmodified Archify through `archify deliver architecture
--quality showcase`. archpub writes the Archify document:

- every component with its label, kind as tag, a short first detail as
  sublabel, and a position and size from decision 6 with Archify metrics;
- tiers and groups as regions; relations as labeled connections, dashed when
  planned or retired;
- the seven native component types as color families, mapped from each
  kind's `category` or, if absent, assigned deterministically in kind order,
  with legend labels naming the model kinds;
- one guided view per model view, focusing its members;
- cards for the question and summary, scope, limits and attribution, and the
  complete evidence of every component and relation: details, status and
  source paths with digests and verification state.

When `--repo` has an `origin` remote equal to the declared repository URL,
components also carry up to three native source references that Archify
verifies against the revision. Archify warnings or failed showcase checks
refuse the build. The map's natural width is bounded so that Archify's own
reader scaling renders primary labels at no less than 14 CSS px in a 1440 ×
900 desktop viewport; Chromium measures this in the test suite. The custom
renderer, routing, Inspect records, private-module coupling and font
replacement are removed.

### 10. Deterministic delivery and minimal trust

`archpub build <model> --out <dir>` writes, into a directory that must not
exist, `<view>.svg`, `<view>.png`, `<view>-6000.png` for each view,
`index.html` and `manifest.json`. Output is staged and moved into place, so a
failed build leaves nothing behind. The manifest records the model digest, the
archpub version, the digests of the fonts and the ELK, resvg and Archify
supplies, the plan, every artifact digest and every source record. It has no
timestamps; rebuilding the same model with the same version reproduces every
byte. `archpub check` runs validation, binding, planning and admission without
writing.

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

### 11. Command surface

`archpub` offers `build`, `check`, `import likec4`, `accept` and `publish`.
Every command accepts `--json` and then prints one result object with
`ok`, the outputs or the diagnostics; exit status 0 means success, 1 a refused
input and 2 a usage error. There are no aliases or compatibility commands.

### 12. Retained and removed modules

Retained: the LikeC4 parser supply, the ELK, resvg and Archify supplies with
their verification tools, the release and CI tooling, and the repository's
quality gates. Removed: the Provider, the Claim Model and Edition generations,
source bundles and locks, scene programs, authored routes, occurrences and
statements, the custom interactive renderer, libavoid, dagre, the icon supply,
the JetBrains Mono supply, qualification, publication, the browser-evidence
harness and every test that only exercised them. The self edition becomes a
model file in `editions/self` without code.

### 13. Edition content

AIGW and ETHOS models live in `architecture-publications`, owned by their
editor; the self model lives in this repository. The AIGW conversion keeps
every entity, relation and source id, label, kind, qualifier, limit and
attribution. Its fourteen source digests match `aigw-cli` revision
`68876f0632acf6b0c66493800757ea70ecaef84d` once the `source/` bundle prefix is
removed from each locator. Every AIGW claim is implemented, affirmed and
complete, so each relation keeps `status: implemented` and claim records are
not copied. The self and ETHOS models are written from their repositories at
pinned revisions as an overview plus mechanism views.

### 14. Verification

Tests cover model validation, source binding, the plan, layout determinism,
poster admission and defects, the Archify mapping, the CLI and the LikeC4
import. End-to-end journeys build a converted AIGW model, a cyclic model
without groups, a CJK model and a model that must be refused, and rebuild one
of them to compare bytes. Chromium measures the map's label floor. The
repository's existing format, lint, type, import, dead-code, Markdown,
OpenSpec, coverage (at least 95 percent per dimension) and package gates stay
in force. The user accepts the artwork; tests do not.

## Risks / Trade-offs

- [A poster holds about twelve to fourteen labelled components] → The plan
  splits large models into an overview and mechanism views and refuses rather
  than shrinking text.
- [Layout bytes depend on the pinned ELK version] → Determinism is promised
  per archpub version; an ELK upgrade is a release change.
- [The bundled fonts add about 32 MB] → One family covers Latin and CJK
  without host fonts; a subset would be a modified font to maintain.
- [Archify limits guided views to five and source references to three per
  component and requires an `origin` remote for native links] → Models have at
  most five views; complete evidence is always in cards and the manifest.
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
