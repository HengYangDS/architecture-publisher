---
subject: architecture-publisher:compiler-api
role: reference
state: canonical
relations:
  governed_by: ../product-contract.md
---

# Compiler API and independent media

## Public JavaScript contracts

The core exports narrow owners:

```text
architecture-publisher/file-input
architecture-publisher/source
architecture-publisher/semantics
architecture-publisher/edition
architecture-publisher/scene
architecture-publisher/compiler
architecture-publisher/rendering
architecture-publisher/qualification
architecture-publisher/publication
architecture-publisher/runtime
architecture-publisher/renderers/archify
architecture-publisher/renderers/fonts
architecture-publisher/renderers/resvg
architecture-publisher/renderers/svg
```

`file-input` exposes `readBoundedFile` and `parseStrictJson` for independent
editors. The reader rejects observed symlinks, nonregular files, byte-limit
violations, and changes detected during the read; it does not certify a digest,
atomic ancestor confinement, source meaning, or acceptance. The `source`
subpath exposes complete Source Bundle operations, not those generic helpers.

`rendering` owns the public raster command's closed Source Bundle selection and
the measurement command's Source Bundle output. Its backends expose
`rasterizeBytes` and `measureCoreTextBytes`: they receive selected bytes or
explicit measurement inputs, not Source Bundle authority. The compiler passes
its already-selected SVG and font bytes directly to Resvg; it does not create
a temporary Source Bundle merely to call the backend.

The font-supply export owns verified font and license bytes used by the static
and neutral interactive media paths. The selected Archify 3.2.0 runtime embeds its own
licensed, self-contained font bytes in its pinned template; its interactive
path does not claim the separate `font-supply` identity. The adapter records
the original input digest, binds Archify's required `meta.output` only to a
private candidate file, and publishes solely to the caller's explicit output
path. The native update check is disabled for offline rendering.

The selected supply retains original release bytes, including runtime locale
catalogs, schemas and artifact checks. Lifecycle input uses native schema 3:
`mainPath`, typed states and explicit directed transitions; the native renderer
owns placement and routing. Publisher validates its reader wording before
registration through the original locale API. A supply upgrade changes renderer
identity; passing focused checks does not transfer artwork or release acceptance.

The first-party self-Edition exports:

```text
@architecture-publisher/self-edition
@architecture-publisher/self-edition/edition
@architecture-publisher/self-edition/runtime
```

Its public Edition surface prepares explicit source-bound inputs: a Claim
Model, one Edition Project, a data-only visual refinement, and a Build Request.
Its separate generated Source Bundle supports provenance audit; it is not
selected again by the direct Build Request. The package does not emit a second
editable Claim-backed Edition or a self-only publication plan. The
generic Core builds both media through that Build
Request and returns an unqualified Candidate. The self Project selects a
structural static overview and eight interactive mechanism questions. Its
static view does not select the Claim facts carried by the interactive views;
the diagram's structural carriers therefore do not assert complete static
Claim coverage. Qualification, acceptance, and publication remain separate
decisions bound to exact Candidate bytes.

ETHOS and AIGW are read-only publication subjects, not integration packages.
Their existing material enters the same generic source and Edition contracts;
editorial preparation and source-specific adaptation remain external. Drawing
adds no export, package, configuration, dependency, test or CI requirement to
either source product. Removing prior integrations does not wait for replacement
artwork approval; preserved input and accepted-work identities remain evidence.

`tests/conformance/fixtures/ethos-source-owned-handoff.json` retains a historical,
digest-bound handoff, not a current package API or source adoption obligation.
Its original repository, commit, package path, Git tree, archive digest and
portable content digest remain exact. An archive digest identifies one `.tgz`;
a content digest verifies equivalent package content across gzip implementations.
A tree object is not a repository root or commit. Historical reconstruction
checks only the selected packaged bytes, not current source acceptance.

## Media independence

Static and interactive scenes share semantic identities, selected coverage, and
portable design tokens. They do not share required coordinates, DOM structure,
artifact bytes, or approval.

- Static output targets single-frame comprehension and exact SVG/PNG geometry.
- Interactive output targets a complete first-screen overview plus complete
  mechanism pages, navigation, focus, trace, and contextual inspection.

The interactive `Inspect` state makes selected meaning and source identity
readable without covering part of the diagram. It does not embed source files or
invent a code link. Use the Candidate manifest and input lock for exact audit.

Neutral graph pages put exact selected relation wording on the diagram, with
font-measured wrapping and layout space; an ordinal is not a substitute for a
relation's meaning. Linked source Claims keep their plane, predicate, subject,
object, condition, scope, maturity, and declared validity in the reading view.
Full source records and method limits remain available in Inspect. Moving a
record there does not remove a selected meaning or qualify its truth.

This compositor prepares a bounded batch of exact possible label lines through
`renderers/resvg/measurement.mjs` and the existing supervised raster Worker.
The native renderer shapes the selected fonts and returns actual outline ink,
not summed character advances. A synchronous cache supplies ELK; an unprepared
request fails without estimation or starting another process. Font bytes and
the measurement implementation remain separately bound. Pinned ELK owns geometry;
the SVG painter preserves its routes, labels, and node bounds. A pinned camera
supplier owns viewport interaction only. Shared paint dimensions bind audits
to emitted strokes and arrowheads; browser glyph checks remain separate.
Flat groups retain exact membership and containment. Long acyclic graphs may
use the same ELK owner's finite wrapping candidate, never an edited fallback.
Static Dagre geometry and authored Archify geometry remain independent.

Authored font resources select normal static TTF faces at weights 400, 500, 600
or 700. Per-text selection overrides the medium default; absence alone selects
bundled typography. Missing selections, glyphs or pins fail rather than falling
back. Measurement supports single-line horizontal LTR Latin, Greek, Cyrillic,
Common characters and explicitly supplied Han. Combining marks, controls,
joiners, variation selectors and unsupported scripts are refused; no text
normalization occurs. Both authored painters preserve spaces, disable synthetic
faces and request geometric precision. Browser paint remains a separate check.

Each preparation admits at most 4096 queries and 200000 glyphs, including
static-only editorial framing. The existing raster bounds control font bytes,
heap, Wasm memory, time, output and owned-process reclamation. Font metadata
and glyph-availability parsing still occur in the parent; native supervision
does not imply sandboxed parsing or protection from a malicious installer.

Authored statement text uses the same bounded text shape in each independent
medium. Select a Claim with `semanticIds: ['["namespace","claim","claim-id"]']`;
select an editorial assertion with
`semanticIds: ['["edition-id","editorial","assertion-id"]']`. Add each direct
reference to that scene's `requiredSemanticIds`. Source facts come only from
selected native bytes; editorial statement, proponent, basis and questions
come only from the selected Edition. Neither is copied into refinement facts.

Every explicitly selected direct statement requires its own visible text.
Opaque Claims need no invented document node or dependency. Typed relational
and scalar Claims still require their selected relation or subject owners.
Previously valid anchored aggregate text retains its existing v1 interpretation
and limits. A direct statement cannot silently fall back to that representation
when its text is missing. A statement-only interactive page may have no nodes.

The Archify adapter validates finite text against the exact selected font bytes
it embeds, native-shaped bounds and the desktop readability/route geometry.
Each page records its exact adapted runtime identity; different page input is
not a conflicting shared runtime. Inspection distinguishes source identity from
Edition identity and returns keyboard focus to the selected text. These checks
establish identity and visible coverage, not paraphrase equivalence or truth;
wording remains unverified until the selected exact-artifact review.

Supported delivery is SVG/PNG and standalone desktop HTML. PDF and PPTX are
not supported and are outside the current work scope.

A screenshot of HTML is not the static compiler. An HTML wrapper around a poster
is not the interactive compiler.
