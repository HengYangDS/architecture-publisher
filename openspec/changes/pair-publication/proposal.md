## Why

The selected atlas is already reconstructed as architecture.atlas-output/v1,
but the existing pair publisher still requires legacy per-page sidecars and
historical checkout paths. It cannot qualify the real current output. Repair
the consumer without redrawing accepted artwork or fabricating old receipts.

## What Changes

- Consume explicitly selected source, edition, output and evidence identities;
  verify exact payload membership and return scope-limited observations.
- Keep ETHOS meaning and review applicability in the edition, while generic
  file admission and recoverable installation remain independent of ETHOS.
- Migrate the existing pair qualification and file-installation owners instead
  of creating a second installer or workflow authority.
- Preserve original review subjects; bind exact editorial continuity separately.
  Require current real browser observations before qualified publication.
- Keep original Documents destinations and preserve unrelated content.

## Capabilities

### New Capabilities

- `pair-publication`: explicit artifact qualification with recoverable paired
  installation, without legacy sidecar or local-checkout assumptions.

### Modified Capabilities

None. Source-intake and rendering contracts remain unchanged.

## Impact

`src/source/`, `editions/ethos/`, publication/evidence consumers, CLI and focused
tests. Existing file installer and browser obligations migrate from the retained
Archify repository with provenance. No ETHOS product edit, browser-policy bypass,
new artwork or relaxation of semantic, visual or runtime acceptance.
