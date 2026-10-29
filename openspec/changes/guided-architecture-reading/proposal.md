## Why

Architecture Publisher did not deliver readable architecture. Its posters
printed audit records instead of a diagram, its layout searched candidate
compositions and still refused the public AIGW build, its interactive medium
replaced Archify's routing and fonts, and its qualification and publication
planes recorded decisions that no check produced. The input contract was
specific to the projects that exercised it rather than to repositories in
general.

The product must draw the architecture of any repository from an explicit
model: posters a reader understands at a glance, an interactive page that
answers the model's question view by view, and a manifest that binds both to
exact repository content.

## What Changes

- **BREAKING** Replace the Claim Model, Edition project, Build Request and
  Provider inputs with one Architecture Model: components, relations, sources
  and optional groups, kinds and views. The model is authored by an agent or a
  person, or imported from LikeC4.
- **BREAKING** Replace selection, scene programs, layout candidates and the
  Candidate with a Reading Plan: at most four views per model, chosen
  explicitly or derived automatically, each admitted when a page of its own
  lays it out in one 2400 × 1350 px (16:9) format with no text below 14 px,
  and refused when no page that passes the balance gates holds it.
- Lay out every view with one deterministic grid engine: cards on one column
  lattice, orthogonal wires and labels in the channels between rows, and a
  measured neatness check that rejects overlaps instead of drawing them.
- Compose posters format first: one fixed page of one to three views, one page
  grid with three archetypes, a solver that fits each figure to its field, and
  measured balance gates; bundled fonts, Lucide icons and outlined text;
  evidence leaves the poster for the page and the manifest.
- Deliver the interactive medium as one unmodified native Archify explainer
  page: the model's question and conclusion first, one panel per view with a
  native architecture diagram chosen on Archify's own routes, steps and
  pinned sources.
- Bind sources by content digest at a pinned revision, read-only, without
  checkouts, network access or source-repository changes.
- **BREAKING** Replace qualification, publication journals and custody with one
  acceptance record and immutable versioned publication.
- Remove Providers, dual model generations, custom routing, ELK, libavoid,
  dagre, the custom interactive renderer and every module or test without a
  consumer.
- Defer the ETHOS north-star packet, the research settlement and the GitLab
  simulated-loss recovery past 2026-10-31.

## Capabilities

### New Capabilities

- `architecture-model`: the portable model input, its validation, identity
  preservation and LikeC4 import.
- `source-binding`: read-only content-digest binding of declared sources at a
  pinned repository revision.
- `reading-plan`: explicit and automatic views, rows from relations and
  poster admission.
- `grid-layout`: cards on one lattice, optimal placement, channel
  routing, the system boundary and measured neatness, shared by both media.
- `poster-composition`: the graph-first static poster and its portable raster
  outputs.
- `interactive-map`: the native Archify explainer page.
- `edition-delivery`: deterministic build output, manifest, acceptance and
  immutable versioned publication.

### Modified Capabilities

- `product-identity`: Editions become models owned outside the core package;
  the core depends only on the new generic contracts.

### Retired Capabilities

`archify-renderer`, `browser-evidence`, `ecosystem-adoption`,
`edition-provider`, `edition-publication`, `ethos-atlas`, `ethos-input`,
`file-publication`, `flagship-qualification`, `pair-publication`,
`publication-contract`, `semantic-compilation`, `semantic-publication`,
`source-intake` and `static-publishing` are retired; each delta names the
successor capability for its requirements.

## Impact

Previous inputs are no longer accepted. The AIGW model is converted with its
identities, relations, details, sources, limits and attribution intact; the
self model is rewritten for the new architecture; the ETHOS model is authored
in `architecture-publications`. Source repositories receive no files,
configuration or obligations. Released packages, tags and delivered artifacts
remain unchanged. Mobile layouts, PDF, PPTX, resident services and
architecture inference from source code remain out of scope.
