## Why

Architecture Publisher did not deliver readable architecture. Its posters
printed audit records instead of a diagram, its layout searched candidate
compositions and still refused the public AIGW build, its interactive medium
replaced Archify's routing and fonts, and its qualification and publication
planes recorded decisions that no check produced. The input contract was
specific to the projects that exercised it rather than to repositories in
general.

The product must draw the architecture of any repository from an explicit
model: a poster a reader understands at a glance, an interactive map for
exploration, and a manifest that binds both to exact repository content.

## What Changes

- **BREAKING** Replace the Claim Model, Edition project, Build Request and
  Provider inputs with one Architecture Model: components, relations, sources
  and optional groups, kinds and views. The model is authored by an agent or a
  person, or imported from LikeC4.
- **BREAKING** Replace selection, scene programs, layout candidates and the
  Candidate with a Reading Plan: at most five views per model, chosen
  explicitly or derived automatically, each admitted only when its poster fits
  1800 × 1350 px with no text below 14 px.
- Lay out every view with one deterministic grid engine: equal cards on one
  column lattice, orthogonal wires and labels in the channels between rows,
  and a measured neatness gate that refuses overlaps instead of drawing them.
- Compose posters graph-first from that layout with bundled fonts, Lucide
  icons and outlined text; evidence leaves the poster for the map and the
  manifest.
- Deliver the interactive map as an unmodified native Archify document at
  showcase quality, with positions and routes from the same grid engine,
  guided views and evidence cards.
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
- `reading-plan`: explicit and automatic views, rows from relations and the
  poster frame admission.
- `grid-layout`: equal cards on one lattice, optimal placement, channel
  routing, the system boundary and measured neatness, shared by both media.
- `poster-composition`: the graph-first static poster and its portable raster
  outputs.
- `interactive-map`: the native Archify exploration document.
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
