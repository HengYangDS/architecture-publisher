# Design

## Context

The accepted compiler renders every view through Archify, extracts the overview
SVG from the resulting HTML and calls the pair dual-medium output. This makes
the interactive renderer the accidental owner of static geometry, styling and
identity. The current uncommitted experiment attempted to make that extracted
SVG raster-safe. It is rejected because it preserves the wrong dependency even
if the bytes become valid.

The intended product has one semantic authority and two projections:

```text
exact source bundle + semantic document
                  |
        medium-specific authoring
          /                     \
 static overview             interactive views
       |                            |
 static composer              HTML composer
       |                            |
   SVG -> PNG              standalone HTML pages
```

The two branches share semantic identity and provenance, not layout or renderer
state.

## Goals / Non-Goals

Goals:

- Make the semantic document the only authority for domain entities, relations,
  endpoints and source provenance.
- Give static and interactive media separate authored composition structures and
  separate renderer implementations.
- Bind both projections to the same semantic digest and verify cross-medium
  identity parity without requiring identical geometry.
- Produce a deterministic portable SVG and PNG without importing, parsing or
  executing the interactive renderer.
- Keep useful interactive reader controls while excluding renderer-template
  badges from the diagram surface.
- Exercise the generic contract with ETHOS, this repository itself and AIGW,
  while treating only AIGW as independent non-ETHOS adoption evidence.

Non-goals:

- Make static and interactive layouts visually identical.
- Infer architecture or intent from arbitrary source code.
- Replace Archify, change immutable alpha.6 bytes or redesign ETHOS/AIGW.
- Treat self-hosting, automated geometry checks or local browser execution as
  independent product acceptance or human aesthetic approval.

## Decisions

1. `architecture.semantic-publication/v2` is one authoring envelope with two
   MECE children: `staticOverview` and `interactiveViews`. Both reference IDs
   from the semantic document. They may choose different grouping, order,
   endpoint sides, routes, density and annotations.
2. `src/composition/static-overview.mjs` is the sole generic static compositor.
   It consumes the semantic document plus `staticOverview` and emits bounded,
   explicit SVG. It does not import the HTML renderer and does not accept HTML.
3. `src/interactive/archify.mjs` remains the interactive renderer boundary. A
   code-owned semantic-publication adaptation suppresses template badge carriers
   without changing authored diagram content or removing reader controls.
4. `compileSemanticPublication` runs the two branches independently in one scratch
   transaction. It publishes only after static SVG validation, PNG rasterization
   and every HTML render succeeds.
5. The publication manifest records separate static and interactive identities,
   plus the entity/relation/endpoints each projection carries. Equality is
   required for semantic identity where coverage is declared complete; geometry
   equality is neither required nor implied.
6. Medium isolation is an enforced dependency property: changing only
   interactive authoring or the interactive template cannot change static SVG
   or PNG; changing only static authoring cannot change HTML.
7. Adoption evidence has three non-interchangeable roles:
   - ETHOS is the flagship complex edition and preserves its accepted reader.
   - ETHOS Architecture is a self-hosted edition proving dogfooding and
     maintainable self-description.
   - AIGW is the one independent non-ETHOS adopter proving bounded transfer.
8. Self-hosting uses selected repository bytes and the public compiler. Generic
   source contains no project-name branch. Its evidence cannot satisfy the AIGW
   independent-adopter requirement.

## Failure and rollback

Unknown IDs, incomplete static coverage, invalid ports/routes, cross-medium
identity drift, unsupported static text/geometry, template adaptation failure or
raster failure blocks publication before the requested output directory exists.
No retry or relaxed resource limit is added. The work remains isolated in its
managed lane; alpha.6 and accepted Documents bytes remain immutable rollback
points.

## Geometry correction

The initial bounded browser checks admitted a concrete faulty self-hosted
render: label backgrounds obscured connector strokes and group borders, and
three incoming relations shared one endpoint. Checking endpoint attachment and
text-to-text overlap was insufficient. The old SVG produces eight conflicts
under the strengthened browser observer.

The static compositor now assigns deterministic, separated ports within each
selected side, ordered by peer position. It rejects insufficient port capacity
and routes crossing unrelated nodes. Label placement selects from a finite set
of segment-relative candidates against nodes, existing labels, group headings,
group borders and all connector segments. It omits masking backgrounds and
rejects an exhausted candidate set. This is a bounded composition contract,
not an arbitrary graph-layout solver.

The browser observer measures actual text boxes and samples painted SVG paths
and rectangle borders at intervals no greater than two SVG units, with a
three-pixel exclusion margin. Missing stroke-coverage fields fail closed.
The finite sampling and selected viewport remain explicit verification limits.

## Verification

- RED tests reject the accepted HTML-derived static implementation and require
  `overview.png`, medium independence and cross-medium semantic parity.
- Focused tests cover static SVG structure, PNG identity, template-badge
  suppression and fail-closed authoring errors.
- ETHOS Architecture self-hosting uses selected current repository source bytes
  through the public contract; AIGW initial/evolved replay remains the external
  portability proof.
- AIGW initial/evolved outputs run from a relocated offline installed package.
- Static SVG/PNG receive glyph, stroke, endpoint and deterministic-byte checks;
  HTML receives separate Chromium interaction qualification.
- The complete repository gates and pinned Linux CI image run before integration.

The published SVG embeds the selected verified TTF bytes and font license.
The raster owner continues consuming its closed SVG profile with the same
explicit font bytes; no browser CSS is admitted into the raster input profile.
Browser acceptance requires both embedded font weights to be loaded.

## Observed acceptance and limits

- Final macOS full suite: 521 passed, 0 failed, 9 explicitly skipped input-selected
  tests. Final pinned Linux full suite: 515 passed, 0 failed, 15 platform/input skips.
- Subsequent compact-receipt assertions passed for the installed self-host and
  AIGW journeys on both hosts. Receipt tests bind actual output, semantic and
  verifier digests; they do not rerun the browser or confer new acceptance.
- Browser qualification covers the self-host and both AIGW structures, every
  declared HTML view and direct static SVG. New stroke conflicts are zero.
- Documents reader PNG and HTML remain byte-identical to the accepted inputs.
- Archify v2.16.0 annotated tag resolves to the selected commit
  c826e6c3a7abad19c0f3cd1ca57207d54b1ad8de. Its archify subtree equals the
  official stable manifest tree a198a3e0d03cd08eb582062a52dc4b0bd5b0aa4f;
  all 34 selected runtime files match upstream Git blob and local SHA-256
  identities. No dependency upgrade is required for this renderer.
- Independent code and semantic reviews failed twice at tool-stream decoding;
  no independent review approval is claimed. Primary-agent source and visual
  inspection plus regression evidence remain the available review scope.
- No hosted publication, independent-host restoration or whole A-E completion
  follows from these local checks.
