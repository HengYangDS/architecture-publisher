# Proposal

## Why

Semantic publication currently treats an SVG extracted from the interactive
HTML as its static medium and does not emit a contract-owned PNG. That reverses
the intended dependency: HTML chrome and renderer-template identity can leak
into a supposedly independent static publication, while a change to the
interactive renderer can silently change the static artifact.

The repository also demonstrates ETHOS and AIGW publications without publishing
its own architecture through the same generic contract. This leaves the product
unable to prove that it can describe and evolve itself.

## What Changes

- Keep source evidence and the semantic document as the single meaning authority.
- Split authoring into one complete static overview and one or more interactive
  views. Layout, density and presentation are medium-specific; semantic entity,
  relation, endpoint and provenance identities remain shared.
- Compose SVG directly from the static authoring and rasterize that SVG through
  the existing bounded raster owner. Never parse or extract HTML to make static
  output.
- Render standalone HTML independently through the pinned interactive renderer,
  while preventing renderer-template badges from becoming domain-visible labels.
- Add medium-isolation and cross-medium semantic-parity checks.
- Add a source-bound self-hosted ETHOS Architecture edition. Keep AIGW as the
  sole independent non-ETHOS adopter; self-use is not evidence of external
  generalization.
- Preserve prior releases and accepted ETHOS reader bytes unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `semantic-publication`: Complete the dual-medium contract, separate the two
  composition authorities and add self-hosted adoption evidence.

## Impact

The semantic authoring schema, generic composition boundary, publication
manifest, AIGW examples and qualification tests change. The existing raster
worker and Archify runtime remain replaceable rendering dependencies beneath
the publication contract. No graph database, second lifecycle, resident service
or project-specific branch is introduced into generic code.
