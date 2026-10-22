---
subject: architecture-publisher:renderer-evaluation
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# Renderer mechanism research

## AIGW direct-framework visual counterexample (2026-09-24)

A direct LikeC4 probe used AIGW `3318c81978917a0d16d6d16073d313ca78ee2736`'s
selected `architecture/edition-provider/_source/semantic.json` (SHA-256
`fc12aeef70916801b5bb25615b7b9db698471abc29bf4998f22b6482cf7b6672`).
The [frozen probe](../../tests/conformance/fixtures/research/aigw-likec4-direct.c4)
maps its 12 entities and 11 directed relations to one overview. It retains
selected IDs and status fields as LikeC4 metadata but intentionally omits parts
of the source Claim Model. It is a visual baseline, **not** an equivalent
Architecture Edition or an AIGW-owned live input.

Installed LikeC4 `1.59.4` validated the probe and built a standalone
`--output-single-file --use-hash-history` HTML (SHA-256
`ff2fa9d931f3f194d9220db31af6be136664a2f1148a8e183dd0d9b68dc500dd`).
Background Chrome opened that file offline at 1600 by 1000 pixels without a
failed request or page error. The published core/layout API preserved 12
entity IDs and 11 relation IDs in the model. Computed view edges had generated
IDs and no direct metadata field, although LikeC4's
[`EdgeModel.relationships()`](https://github.com/likec4/likec4/blob/33dbc2d34c399a99daf96e92fc28fe5d280a7fd5/packages/core/src/model/view/EdgeModel.ts)
can expose their model relations within one build. An exact
claim-to-_visible_-carrier mapping remains unproved. Native `likec4 export png` failed on this host because
its expected Playwright headless-shell executable was absent; this is a local
installed-use gap, not proof that LikeC4 cannot export PNG elsewhere.

![Direct LikeC4 AIGW overview, rejected as publication-quality composition](evidence/aigw-likec4-direct.png)

The direct default image (SHA-256
`817e125610e1d17b1326fe3bc981a7e9b2f5f609d26f51203339c8855d6c4cae`)
is a uniform blue-box graph with weak differentiation, substantial empty space,
and no editorial treatment of authority, credential supply, guarded effects,
or client projection. The user rejected this visual result. **Decision:** do
not substitute LikeC4's default renderer for a release-quality AIGW Edition.
LikeC4's versioned model, view, and layout mechanisms remain candidates for
reuse behind a product-owned editorial composition and semantic-carrier check;
their fit requires a styled multi-view AIGW, ETHOS, self, and unrelated-domain
counterexample rather than a favorable two-node smoke test.

## D2 static-renderer counterexample (2026-09-24)

Installed D2 `v0.9.0` was exercised on AIGW `3318c81978917a0d16d6d16073d313ca78ee2736`'s
selected 12-entity, 11-relation Client Projection model (source SHA-256
`fc12aeef70916801b5bb25615b7b9db698471abc29bf4998f22b6482cf7b6672`).
A disposable 26-line D2 script (SHA-256
`b7b525321ec70745abcb2ffad75d86fcacc957e5601881ca46347e3bc1d19cb1`)
used each source entity ID and label as a node and each source relation's
endpoints and type as a directed labeled edge. It intentionally omitted
qualifiers, provenance, plane and Edition decisions: this is a renderer/layout
probe, **not** an equivalent AIGW architecture publication.

`d2 validate` passed. With `--omit-version`, Dagre, ELK and TALA each emitted
SVG containing 12 node groups and 11 path connections. Two consecutive runs
per layout produced identical SVG bytes; their first-run SHA-256 values were
`ff72981ae8615bfa19e33921e8f09bb88316211a513923a6aa0c61edd4c8579b`,
`d5a3c17e65ba34ff36b55a1a816cdd02820a04421747e3f8c9e1fff440765e4c`,
and `049516ec3dc3b7b8a6b527f88e9ed81415ff7a73d8aa96ee09061e048b1f7b9e`.
The TALA no-tooltip PNG also repeated byte-for-byte (174,069 bytes; SHA-256
`831f6ed11fb6d7e47f9f538c8d2863d6e31310b2d8916cf1fde8d037e9ca770a`).
This is scoped repeatability of one fixed input and host, not a general
cross-platform determinism result.

An alternate script put source relation IDs in D2 edge tooltips. The SVG did
not expose those raw IDs as text; the PNG instead gained an 11-item tooltip
appendix, growing TALA output from 174,069 to 319,502 bytes and occupying a
large region outside the graph. Tooltips therefore cannot be used as a hidden
substitute for static semantic coverage or a clean exact-ID carrier. SVG
connection groups encode `(source -> target)[ordinal]` in base64 CSS classes;
a two-edge `a -> b` counterexample showed that swapping source order swaps
which labeled relation occupies ordinal 0. A Publisher adapter would need an
explicit per-build relation-to-carrier map and ambiguity handling, not a claim
that D2's generated ordinal is a stable source relation ID.

The no-tooltip TALA image was manually inspected as a baseline: it retains
basic topology but uses uniform boxes and has crowded relation labels, no
source/maturity framing, and no editorial hierarchy. It is not publication
quality for the whole AIGW product; neither the input nor the probe attempted
that composition. The installed D2 CLI offers static SVG/PNG/PDF/PPTX/GIF/TXT
output, not a standalone interactive HTML atlas. **Decision:** retain D2 and
its qualified layouts as static backend candidates; do not treat direct D2
output as the Edition or let tooltip metadata manufacture visible coverage.

## Archify capability versus Publisher use (2026-09-24 baseline)

At this baseline, the packed, hash-checked Archify supply was version `2.16.0` at
source `c826e6c3a7abad19c0f3cd1ca57207d54b1ad8de`; the manifest at
`packages/publisher/renderers/archify/supply/supply.json` now selects a later
version. The baseline architecture schema and runtime implemented optional guided views, finite trace
motion, cards, a grid layout, source references, repository links, themes, and
visual presets. This is a concrete renderer capability inventory, not a claim
that each feature improves every Edition.

The then-current backend-neutral `architecture.interactive-scene/v1` already fixed
node positions and sizes. Its generic compiler laid groups into rows with
fixed 170-pixel cells, 70-pixel gaps, and 210-pixel group spacing. The Archify
adapter forwarded nodes, regions, and routes, but fixed `locale=en`,
`quality_profile=showcase`, `visual_preset=editorial`, and a hidden legend. It
does not select native views, cards, grid layout, or trace motion. The public
native renderer explicitly rejects `repository` and node `sources` fields in
offline input. These facts are visible in
`packages/publisher/src/scene/interactive/architecture.mjs`,
`packages/publisher/renderers/archify/architecture.mjs`, and
`packages/publisher/renderers/archify/index.mjs`; they identify both
Publisher-owned constraints and unused native facilities, not an Archify
failure.

The native facilities also had real limits. The baseline schema capped guided
views at five and node source references at three, accepted only a GitHub URL and
40-hex revision for its repository link, and offered only `grid` as its
architecture layout mode. Those cannot represent ETHOS's complete 13-page
Atlas, arbitrary multi-source/content-derived revision evidence, or a
flagship composition merely by toggling options. Animation is a finite reader
aid, not an observed runtime trace. Cards or hidden view metadata cannot
manufacture visible source coverage.

**Disposition:** retain Archify as one qualified interactive-renderer
candidate, not a semantic authority or forced universal presentation. A
successor may expose only Editor-selected preset, locale, legend, guided
chapter, card, or motion controls whose exact medium and accessibility tests
pass; it must not pass adopter-specific or unverified provenance directly to
Archify. Compare its native grid and interaction with LikeC4/D2 and the
current Publisher composer on the same reader questions before replacing a
layout owner. Use the richer feature only when it removes actual adopter work
without weakening source binding, independent media, or flagship quality.

## Archify 3.0.1 supplier boundary (2026-09-29)

The selected upstream [v3.0.1 release](https://github.com/tt-a1i/archify/releases/tag/v3.0.1)
is commit `2ab3cae7ac2c2a55d7386ca789d03c4fcd31816c`; its canonical ZIP
SHA-256 is `b0b23bd28db314f04ca8ab9620fe20f8c1ac6474a3546bd8fe4679508aa1b7f5`.
The Publisher supply selects the offline `deliver` CLI closure and notices,
not the Archify Skill or gallery assets. The upstream CLI statically imports
preview and browser-support modules, so those bytes are present even though
Publisher invokes only `deliver` and disables the update check. Archify 3 removes
guided/story views and ordinary share-card exports; its v1 diagram schemas
remain accepted. The former guided-view cap is therefore not a current product
capability claim.

The v3 schema requires portable `meta.output`. A direct native probe rejected
the earlier Publisher input without that field and passed all nine showcase
checks with it. Publisher's adapter now sets that renderer-only field to its
private candidate slot, keeps the original input digest and the caller's
destination separate, and checks the native specification digest. It disables
Archify's update check in the controlled renderer process. Upstream v3 embeds
licensed WOFF2 font subsets; the redundant Publisher-specific font injection
was removed, while other media still use Publisher's verified font supply.
Changing the renderer changes interactive bytes, so source tests do not
transfer earlier browser or human acceptance to the new Candidate.

## Neutral interactive renderer probe (2026-09-25)

This is a backend feasibility observation for Task 5.3, not a renderer
selection, accessibility pass, or publication-quality visual review. At
06:50–06:58 UTC, the read-only GitHub API reported active, non-archived
[Cytoscape.js](https://github.com/cytoscape/cytoscape.js),
[React Flow](https://github.com/xyflow/xyflow),
[vis-network](https://github.com/visjs/vis-network), and
[G6](https://github.com/antvis/G6) repositories. NPM registry metadata for
[Cytoscape 3.34.3](https://www.npmjs.com/package/cytoscape/v/3.34.3) reports
MIT and no runtime dependencies; its official archive has integrity
`sha512-yfYGhRcGAntq6YBD583j4n0Eg3jIxvWmZtz/5uz9UYkeIStSlMxuUja+ec5j3iBD8nv1rwaOAYMW09tBdkSeaQ==`.
The extracted minified browser distribution is 435,503 bytes, SHA-256
`5f3b5b529546d5af1fc5628590af033b74511a5b6f789f5f4682845863228b91`.
The same registry read reports React Flow 12.12.0 with React/React DOM peers
and three direct dependencies, vis-network 10.1.2 with an 84 MB unpacked
archive and six listed peers, and G6 5.1.1 with eleven direct dependencies.
These are supply-surface observations, not total installed sizes, security
findings, or quality rankings.

A disposable, standalone Cytoscape HTML probe used only two invented nodes
and one relation. Headless Chrome at 1440×900 loaded its inlined JS without
an external request or page exception; two reloads of the initial
`breadthfirst` layout yielded identical node coordinates. The engine painted
three canvas elements;
the prototype supplied separate DOM buttons and visible question, relation,
and limit text. The first attempt guessed an invalid layout direction and
failed; using the runtime's reported `rightward` option corrected it. Its
second screenshot was legible but retained conspicuous empty graph space.
Neither keyboard operation, screen-reader experience, source coverage,
cross-platform use, nor flagship aesthetics was qualified. The disposable
probe was not a product artifact.

**Conditional route:** Cytoscape is a credible neutral, dependency-light
interactive graph backend because its data model did not require calling a
source entity `backend` or `external`. Keep Archify available where an
Editor's typed visual roles truthfully fit; its current finite component
types must not be silently coerced into generic source meaning. Before
selecting Cytoscape for the successor, require one digest-pinned offline
supply, page-local scenes, a single standalone HTML without private source
bytes, an accessible DOM companion to the canvas, deterministic rendering,
installed/browser/visual qualification, and the frozen four-workload
comparison. A failed condition rejects or narrows this backend rather than
weakening the Edition and Candidate contract.

### AIGW neutral overview spatial-budget counterexample (2026-09-26)

At Publisher work HEAD `7c59f3f` and AIGW work HEAD `270ca0bd`, the staged
Client Projection input built Candidate
`8d98e8be8d0d6a618c96fbc242b6b69de799b67190d734e042fe165dd92e3faa`;
its interactive HTML SHA-256 is
`2dd0400f716a468b867be4c4f690eb0639edfec23647fa6148bd7455b83c13c8`.
This is a limited, unqualified AIGW candidate, not the whole-product Edition.

In background Chrome at 1280×720 CSS pixels, the first page's graph viewport
measured 784×358. Twelve nodes and eleven relations occupied a 1388×719 model
box; automatic fit set zoom to 0.376, making its 16px node font about 6.0 CSS
pixels. Keeping the full source qualifiers in the adjacent relation list while
showing only a short source label or kind on an edge removed the long-label
collision, but did not enlarge the nodes. An exploratory 1190×598 full-width
graph reached zoom 0.710 and about 11.4px effective node text, at the cost of
moving the complete diagram below the first screen. The probe changed only
background browser presentation, not the Candidate or source Edition.

![Provisional AIGW overview after concise edge captions; node text remains too small for acceptance](evidence/aigw-neutral-overview-scale.png)

The limiting variable is the relation between selected scope, graph layout and
available viewport, not only label length. Do not declare neutral visual
acceptance from parser, accessibility or source-carrier checks. The next
candidate must prove a legible complete-for-its-question overview through
editor-authorized abstraction or a better bounded composition; it may instead
report layout infeasibility without dropping meaning. No universal layout
backend is selected by this single workload.

An installed-package replay on Publisher `1fdb2d9` and unchanged AIGW
`270ca0bd` narrows the counterexample. The locally packed archive SHA-256 was
`81447cb709f729064d3da19d200b8e269eb71b40666db82805f1ab051aa34dba`;
the copied AIGW Build Request SHA-256 was
`29fe63c218c4c1264cf737746e589d5dc2e6dec91860ad42adb08844ebf71ed8`.
The installed public build and replay matched Candidate
`0623ff0482e7603dc97f9696583d554f8df8fea6d4ee510762c706dbec2bf8fb`;
the four-page HTML SHA-256 was
`caea11cfc7f8e7ee1a575949499029d160707fed70a04048437dc5d802ca88b8`;
the static PNG SHA-256 was
`850d4331644dfb32182648e7417f11c22b8fefd4f3e31316a98f2ba1517cc3fe`.
This is byte replay, not qualification, source endorsement or AIGW acceptance.
The changed HTML presents relation qualifiers as source-reported, unverified
fields beside concise graph labels. At 1440×900 in background Chrome, page one
still measured a 894×414 graph beside a 426×1427 evidence column; the 1,013px
height disparity leaves most of the left column empty. The static overview
still repeats a long qualifier prefix for individual relations. Thus a geometry
backend swap alone cannot repair the neutral composition: the next candidate
must jointly test graph scale and the independent flow of evidence, without
removing selected meaning or importing a source-product layout default.

### A mature layout alternative on the same AIGW input (2026-09-26)

The prior scale failure does **not** establish that AIGW must change its
reader question or aggregate its source nodes. A throwaway browser-only
relation matrix made all eleven relations readable within the 1280×720 first
screen, but repeated source names and flattened the causal spine; it is a
possible accessible companion, not an equivalent overview replacement.

The exact candidate above was projected to a 1,192-byte
[DOT input](evidence/aigw-graphviz-input.dot) with the same twelve public nodes,
eleven directions and short source relation labels. Full qualifiers remained
in the candidate's adjacent relation list; the DOT is a geometry probe, not
a complete publication. Homebrew Graphviz 16.1.0 produced a 1090×297pt SVG.
The already installed transitive `@hpcc-js/wasm-graphviz` 1.22.2, containing
Graphviz 15.0.0, produced a 1114×297pt SVG in a bounded local probe (22ms
load, 11ms layout on this host). Its
[rasterized view](evidence/aigw-graphviz-wasm-probe.png) shows the full causal
spine with no obvious node or edge-label collision at inspection scale. This
is a stronger geometric candidate than the current Cytoscape `breadthfirst`
auto-fit on this workload, not a cross-workload quality verdict.

The rasterized view used Graphviz's Helvetica output. It proves topology
layout potential, not compatibility with the product's bundled font or
qualification of the final pixels.

### Portable Graphviz supply and font-metric counterexample (2026-09-26)

The [npm registry](https://registry.npmjs.org/@hpcc-js/wasm-graphviz/1.29.1)
reported stable `@hpcc-js/wasm-graphviz` 1.29.1, Apache-2.0, no runtime
dependencies and integrity
`sha512-koAQL0wlryEMeBs4/cQC3GB5ziITv66gR9DU/SWYjjup+iQ+Nbjcqxeaef+sffN4F4cBYZ3P31B5z7+cbSABbw==`.
The 1,366,332-byte tarball matched that integrity. An isolated consumer
installed it offline without scripts; after relocation, macOS Node 26 with
empty HOME and PATH produced the same 13,112-byte SVG SHA-256
`12089bb8b51ab5e04d2d1ea04a32bded5945d49cffbb5aaf88109f4defae4110`
from the exact DOT. Its internal Graphviz version was 16.1.0. This proves
that bounded local path, not Node 22, Linux, Windows, browser qualification,
or Publisher package integration.

A disposable single-file browser prototype embedded an 857,333-byte bundle.
The current Publisher-style CSP (`script-src 'unsafe-inline'`) rejected
`WebAssembly.instantiate`; adding `wasm-unsafe-eval` allowed twelve nodes and
eleven edges with no console error and only the HTML request. Build-time
layout is therefore the preferable candidate: it avoids a larger reader
artifact and a runtime CSP relaxation. This is a design inference, not an
implemented Publisher backend.

Raw Graphviz SVG contains a DTD, generator metadata, pt dimensions, class
attributes and Helvetica text. The existing raster validator rejects it.
Removing the prolog, converting dimensions, removing classes and binding the
bundled JetBrains Mono font passed that validator, but actual raster output
[overflowed multiple node boxes](evidence/aigw-graphviz-font-mismatch.png).
Setting the DOT font name to JetBrains Mono still overflowed: the Wasm layout
did not use the exact bundled glyph advances. A local fixed-width probe using
the bundled font's 600/1000-em advance removed that node overflow, but
expanded the SVG to 1448pt wide; edge-label envelopes and target-viewport
readability remain unqualified. Parser acceptance is not painted-geometry
acceptance.

Graphviz remains a promising **replacement geometry owner**, not a drop-in
renderer or selected product dependency. Compare exact font and edge-label
geometry, source-to-graphic identity, interactive focus/trace, accessibility,
installed supply and ETHOS/self/di-effect workloads before replacing the
current owner. Do not retain two permanent engines or ask AIGW to narrow its
meaning merely to mask a backend limitation.

The current full-product counterexample uses Publisher `d9d1ee7`, AIGW
`6620f638`, Build Request SHA-256
`d65efd045fc99b8eba39330bb5a5fc29a126c6f6007fe0878e11458b6ec39014`,
and source-adjacent Candidate
`f8d92190ebc0249da1392bc533b7047a464b2fe7c874516e1bb789bf216a1fbd`.
At 1280×720, Chrome showed a tiny Boundary graph and shallow Selection and
Delivery graph bands inside fixed stages. The static 3600×5041 overview was
text-heavy and asked only `boundary`; the interactive Edition asked six
questions. These are provisional agent observations, not AIGW acceptance.
At Publisher `d9d1ee7`, the renderer granted full reading width only to
graph pages without claim cards, although a claim-bearing page emitted its
claim cards below the graph. A DOM-only probe widened Boundary, Selection and
Delivery stages from 784 to 1190 CSS pixels. Claim presence was not a sound
proxy for spatial need. A subsequent RED/GREEN removed that coupling. With the
same AIGW request, the semantic lock and static PNG remained unchanged; the
new provisional Candidate is
`700f600273dfd9344efd30db9f2121c3cd2fae1a8a33288fb6be64b8d7191bd4`
and its HTML SHA-256 is
`90101b9228c1737f621869ff28c08812e393b517e3c4549e2f31118a37d73102`.
At 1280×720, all graph pages used 1190×358 CSS-pixel stages with evidence
below. Effective 16px node type still painted at 3.78px on Boundary, 8.84px
on Selection, Effects and Delivery, and 15.95px on Credentials and
Verification. The fixed stage also retained blank space. The code change
repairs one false layout dependency, not reader adequacy; geometry, evidence
placement and stage height still need a coherent, source-neutral solution.

On the same public Boundary nodes and six directed relations, Graphviz 16.1.0
laid out the [direct DOT](evidence/aigw-product-boundary-dot.dot) at 1080×117pt;
`unflatten -l 3` left those dimensions unchanged. A probe that borrowed
AIGW's four **static** groups as an unapproved interactive hypothesis reduced
bounds to 435×375pt, but the
[grouped DOT](evidence/aigw-product-boundary-grouped.dot) produced
[edge-label and group-title collisions](evidence/aigw-product-boundary-grouped.png).
The committed DOT reproduces that PNG byte-for-byte with Graphviz 16.1.0.
Orthogonal Graphviz reported that it does not handle edge labels. This stops
an automatic engine swap as a complete repair: view-scoped editorial grouping,
label treatment and medium-specific reader adequacy still need one coherent
owner. It neither selects Graphviz nor disqualifies it as a bounded backend.

### Exact-font geometry comparison on the same AIGW subset (2026-09-26)

The previously recorded Dagre/ELK package probes did not render edge routes
and labels with the selected Publisher font. This follow-up kept the same
twelve public nodes and eleven directed relations. For these ASCII labels,
node widths used the bundled JetBrains Mono Regular font's measured 600/1000-em
advance at 14px plus 30px padding; edge-label widths used 12px text plus 8px
padding. Each layout returned node, label, route and endpoint coordinates.
A disposable adapter drew those coordinates as SVG; the existing strict SVG
validator and resvg supply rendered it with the exact bundled font. No source
claim, Edition, Candidate or production renderer was changed.

- **[Dagre 3.1.1](https://www.npmjs.com/package/@dagrejs/dagre/v/3.1.1):**
  left-to-right with a 30px rank gap; 1355.6×338 model bounds;
  [1800×449 PNG](evidence/aigw-dagre-metric-layout.png). All eleven endpoints
  met their nodes. MIT with Graphlib 4.0.5; the earlier isolated ESM supply
  was 48,343 bytes.
- **[ELK JS 0.12.0](https://www.npmjs.com/package/elkjs/v/0.12.0):** layered
  polyline with a 15px interlayer gap; 1404.5×316 model bounds;
  [1800×405 PNG](evidence/aigw-elk-metric-layout.png). EPL-2.0 OR
  GPL-3.0-or-later; official tarball 1,685,655 bytes, installed package 7.7 MB,
  bundled runtime about 1.6 MB.

For **both** outputs, the four tested intersection classes—node/label,
label/label, unrelated edge/node and edge/other-label—returned zero. Every
edge endpoint met its declared source or target node.

Both registry `latest` tags matched these versions at collection. At a 1190px
diagram width, their 14px node type would be approximately 12.3px (Dagre)
and 11.9px (ELK); these are geometric scale estimates, not browser-observed
text size or a reader verdict. Both images retain the causal spine and avoid
the Graphviz font-rebinding overflow on this subset. Dagre is the provisional
lower-ownership **geometry** preference here; its lighter license and supply
surface are material, but not a product selection. Full source qualifiers,
claim planes, provenance, accessible HTML and publication evidence remain
outside these images. Exercise cycles, bidirectional and parallel relations,
ETHOS/self/di-effect, package relocation, browser behavior and human review
before replacing the current geometry owner. A cross-workload failure or
larger upkeep cost can reverse this preference.

### Joint geometry and evidence-flow probe (2026-09-26)

On unchanged Publisher `eeb5e29` and AIGW `270ca0bd`, a browser-only
prototype used the same selected Client Projection page values. Dagre 3.1.1
positioned twelve nodes and eleven relations left-to-right with a 26px rank
gap, 16px node gap, 12px edge gap, and node widths measured from the bundled
JetBrains Mono font at 14px. An inert inline SVG replaced the Cytoscape canvas
only for this probe. A temporary DOM transformation shortened navigation,
placed the graph across the content width, and flowed source questions, nodes,
relations, qualifiers and method limits into separate evidence regions below
it. No source input, Edition, Scene, Candidate, package, or product renderer
changed. The short navigation labels were handpicked for this probe, not an
admitted generic authoring contract.

At 1440×900, the original installed Candidate's first page was 1,906px tall;
the transformed page was 1,365px tall. Its 1,352×350 graph began at y=275px.
At 1280×720, the complete twelve-node, eleven-relation diagram remained
within y=275–625px; the sampled node text painted to a 16px-high CSS box, all
twelve node labels had at least 12.4 SVG units of box clearance, and the page
had no horizontal overflow. This is a desktop composition feasibility result,
not an interactive or human quality verdict.

![Desktop-only Dagre geometry and independent evidence-flow probe; not a Publisher Candidate](evidence/aigw-dagre-composition-desktop-probe.png)

The prototype removed the live Cytoscape canvas, so its focus, pan, zoom and
Fit control were not meaningful. It did not prove an interactive Candidate.
The active gate is question-complete, legible selected media in the Edition's
declared reading context, with source carriers, focus/trace and limits intact.

### Source-adjacent neutral Candidate and editorial layout (2026-09-26)

AIGW Work Lane `270ca0bd` supplied the unchanged Client Projection Build Request
SHA-256 `29fe63c218c4c1264cf737746e589d5dc2e6dec91860ad42adb08844ebf71ed8`.
The Publisher worktree built Candidate
`f4cece0a96e8728342abf1d3b7852dfe2771f579a04a290b51c060607ea9029d`
with HTML SHA-256 `616c6ada33fdf076bc9e2884d913b496606c4facfd2c0d70cd3361892153fe24`
and static PNG SHA-256
`850d4331644dfb32182648e7417f11c22b8fefd4f3e31316a98f2ba1517cc3fe`.
This was a source-adjacent, unqualified Candidate, not the frozen installed
successor or an AIGW-approved Edition.

The relation-only overview gives its graph the 1,352px desktop reading width
and places reader questions, source nodes, relations, and method limits in
separate regions below it. Claim-bearing detail pages retain adjacent evidence
rather than stretching sparse graphs across the whole canvas. The four pages
preserved the selected 12/11 structural overview and 4/6/2 linked claim
carriers. Background Chrome at 1440 CSS pixels observed no horizontal
overflow, page errors, external requests, or axe WCAG 2/2.1 A/AA violations.
This checks DOM and interaction boundaries, not visual acceptance. Claim
cards remain prose-dense. A short navigation label
mechanically derived from an authored view ID has not yet earned generic
editorial approval. These are reader-quality counterexamples.

At this dated checkpoint Cytoscape remained the product renderer. That ruling
is superseded by the [single-owner geometry investigation](composition-evaluation.md#single-owner-neutral-geometry-and-paint-observation-2026-10-01).
The recorded Candidate and reader observations remain historical evidence.

### Reader-scoped LikeC4 sidecar and Publisher Candidate (2026-09-26)

The unchanged di-effect source at `8a168b6b9c6933c30ab2ea25e60cac8a54212566`
retained the three LikeC4 file hashes recorded above. Its dirty
`.serena/project.yml` was not selected or modified. A researcher-authored,
nine-line LikeC4 sidecar selected the five layer elements in a separate
`editorial_layers` view. Installed LikeC4 1.59.4 reported 25 nodes and 35
relations for the original `five_layers` view, versus five nodes and four
relations for the sidecar view. This is native view editing, not Publisher
discovering the right abstraction automatically.

```likec4
views {
  view editorial_layers {
    include layer_result
    include layer_effect
    include layer_computation
    include layer_dependency
    include layer_injector
  }
}
```

The public `edition build` path reproduced both unqualified, dual-medium
Candidates from direct Build Requests. The sidecar request SHA-256 is
`bcf9101a9237c7eb9364111468d2cf5800d8b35642009f23903ff2b62e16e5f8`;
its Edition SHA-256 is
`1cc6dcc0e49940e8c874250cd409fa8e43fa298724e599f54c123f6b369d8366`;
the sidecar SHA-256 is
`cbc3856853778ce3322ceed88324c1b7d3964f1cdb6a4c51b5537902a71c563c`.
The resulting Candidate identity is
`1aab3ea02f8b11bba179e14a85a3c0e957efbe118b4f7ae648b6bea864daee44`;
its static PNG and interactive HTML hashes are respectively
`a4535459e916b8a04496a8a1500dbb16f66ebf631fc0333243e65dc8f77290d2`
and `9ecd5cef07666806ef3e7c8ddc4578ba8be26a8a4b7e7bacfe3c4e3f8307b8f2`.
The static SVG has exactly five distinct node and four relation carriers;
the interactive accessibility tree lists the same five nodes and four
relations. Neither Candidate has a qualification or acceptance record.

The Build Request attributes the three original files to the di-effect source
model and the added view to `Architecture Publisher researcher`. Both media
visibly say that the selection is researcher-authored and not source-endorsed
or evidence of implementation. Those claimant and disclaimer strings are
caller-supplied: this probe does **not** prove di-effect owner endorsement,
the truth of the underlying model, or a machine-enforced separation of every
source and editorial assertion in the rendered work. The request and Candidate
were local research inputs, not accepted or published source-product assets.

At 1280×720, the [desktop interactive screenshot](evidence/di-effect-editorial-sidecar-desktop.png)
shows a complete but very small five-node horizontal graph.
Chrome observed no horizontal overflow or console errors, and its only
request was the selected localhost HTML. The static 1800×2572 PNG is
structurally complete but uses a tall one-column chain beside a long method-
limits list; it is not a flagship reader composition. These observations
distinguish DOM/accessibility structure from visible reader quality.

**Disposition:** adopt the mature native-view selection mechanism as an
editor-controlled input where source/editor attribution survives; reject raw
`include *` as the answer to a five-layer reader question. Defer any claim that
Publisher provides automatic editorial abstraction, source-owner acceptance,
or flagship dual-media quality. The next product gate is a readable,
question-complete composition with visible provenance in both media, followed
by the installed four-workload matrix.

### Relocated offline di-effect consumer probe (2026-09-26)

At Publisher `feb0744`, a provisional `architecture-publisher` 0.3.0-alpha.3
archive with SHA-256
`be3394512e3e640abec2b02ebe8cd2943dc3be32a2c4266b7186858b2080f399`
was packed from the generic package and installed offline outside all source
repositories. The consumer received only the six pinned request, Edition, and
LikeC4 files listed in
[`tests/conformance/evidence/di-effect-installed-probe.json`](../../tests/conformance/evidence/di-effect-installed-probe.json).
The npm invocation used fresh user and global configuration files and a fresh
HOME; installed `edition build` ran with empty `PATH`, `NODE_PATH`, and
`NODE_OPTIONS`. The installed consumer was copied to a second location, its
first location removed, and the same public command rebuilt into a fresh
output directory.

Candidate `bc4eed8ef6945d2d95b09d7856e2b819480378916befbf30843f6d0098b96a91`
and all five Candidate files were byte-identical among source-adjacent,
installed, and relocated builds. This establishes a bounded macOS/Node
v26.10.0 package and relocation property for the researcher-authored
di-effect Edition. Chrome 154 opened the relocated HTML at 1280×720: five
nodes and four relations remained visible, effective node-font size was 13.55
CSS pixels, and no horizontal overflow, console error, or external request
occurred. axe-core 4.13.0 reported no WCAG 2/2.1 A/AA violations or
incomplete checks. The Candidate remains
unqualified: these checks do not establish source-owner endorsement, human
visual acceptance, publication/recovery, or any other workload's installed
parity. The receipt is conformance evidence, not release authority.

### Relocated offline AIGW Client Projection counterexample (2026-09-26)

The clean AIGW Work Lane at `270ca0bdf2aeb5a5ef3abfce0d00a0b25a015488`
provided one `architecture.edition-provider/v2` declarative source and a
separately authored Client Projection Edition. Four exact selected files were
copied without editing AIGW. The same provisional Publisher archive used in
the di-effect probe built Candidate
`e40ab445e8b734fe5de371ebb09abc957e3a30fb73e253a23246adf8d640cb9a`.
Its Candidate, manifest, static SVG/PNG, and interactive HTML were byte-
identical across copied direct, offline-installed, and relocated builds. The
[installed probe receipt](../../tests/conformance/evidence/aigw-client-installed-probe.json)
binds the package, four inputs, five output files, and browser observations.
This is **Client Projection only**, not the whole AIGW product or AIGW approval.

Installed Chrome 154 exercised all four pages at 1440 CSS pixels. They had
no horizontal overflow or axe-core 4.13.0 WCAG 2/2.1 A/AA violation. Yet
fit-to-canvas effective graph label sizes ranged from 6.59–10.83 CSS pixels
at that desktop width, despite complete DOM lists and a clean accessibility
scan. The static Candidate likewise retains source structure but places dense
relation prose beside its graph; it has not earned a reader-quality verdict.

**Disposition:** accept the bounded installation and Provider-interchange
evidence, not the publication. The source editor must decide what the overview
should abstract or disclose; Publisher must offer an intelligible composition
or report infeasibility rather than hide the defect behind `Fit graph`, a
passing axe scan, or exact-byte replay. This is a Publisher composition and
qualification gap, not permission to change AIGW's source meaning or release
decision. The full-product AIGW Edition remains an independent, uncompleted
workload.
