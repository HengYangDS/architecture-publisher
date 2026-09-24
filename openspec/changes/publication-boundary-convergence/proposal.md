# Proposal

## Why

Architecture Publisher must make source-attributable architecture publications
that answer a reader's questions in independently usable static and interactive
media. Today, its Edition v1 input path requires a Publisher Claim Model v2 and a sealed
Edition even where an adopter already has a native architecture model. It also
confuses source authority, editorial ownership, transformation, acceptance, and
artifact custody. Those costs are visible in the ETHOS and AIGW integrations;
the current AIGW Edition covers only its Client Projection chapter, not its
whole product. Replacing custom code with a framework default alone does not
solve the reader-quality or evidence problem.

## What Changes

- Define role-based authority: sources and standards own native facts; an
  Edition editor owns reader questions, scope, attribution, and composition;
  Publisher owns the versioned interchange, compilation, generic qualification,
  and optional bounded local file effect; designated accepters and custodians
  own their decisions. These roles may be co-located but never inferred from a
  repository path.
- Introduce one versioned Build Request and materialized-input lock. Direct,
  declarative-Provider, and executable-Provider selection converge before the
  same build entry. The selected Edition project has one root; multiple source
  namespaces and Providers may contribute without silently merging authority.
  Ordinary authors select native inputs and editorial intent, not derived
  Publisher digests.
- Admit native architecture formats through explicit, loss-reporting adapters;
  retain Claim Model v2 as a supported existing input rather than imposing a
  second editable model on every adopter. Distinguish native, authored,
  derived, and proposed assertions and type each revision's verification
  method. A content-derived revision is not a Git commit.
- Make reader questions and visible coverage the center of Edition authoring.
  Publisher may suggest views and geometry under finite declared constraints,
  but source/editor-approved meaning, explicit omissions, conflicts, and
  unknowns cannot be supplied by a renderer. Static and interactive media
  share selected claims, not composition or approval.
- Compare mature modeling, view, layout, rendering, browser, accessibility,
  and raster mechanisms on frozen self, ETHOS, full AIGW plus its Client
  Projection chapter, and native di-effect workloads. Use a mature foundation
  wherever it passes the same semantic, reader, offline, and lifecycle tests;
  delete displaced custom owners rather than keeping parallel engines.
- Bind each Candidate, qualification, acceptance decision, local installation,
  hosted publication, and custody receipt to its own exact subject and owner.
  Source claims and generic validation do not confer product acceptance.
- Move SDD and repository-governance research to ETHOS's existing owner while
  retaining architecture-publication mechanism decisions here. Separate local
  recoverable file effects, source-product release custody, and the still
  undecided operator off-host disaster-recovery policy.
- Preserve all signed historical tags and artifacts byte-for-byte. Introduce
  successor protocol and package versions for any changed v1 meaning or
  published bytes; migrate consumers explicitly before retiring old glue.

## Non-goals

This Change does not make Publisher a repository governor, source-truth oracle,
universal ontology, code graph, WYSIWYG suite, hosted release service, or
required ETHOS integration. It does not authorize edits in ETHOS or AIGW,
publish a successor, or implement off-host disaster recovery. Executable
Provider supervision is not a filesystem, network, or credential sandbox.

## Capabilities

### New Capabilities

None. Native input is a successor of existing source intake and Edition
publication, not a new lifecycle or command plane.

### Modified Capabilities

- `source-intake`: Authoring locators or exact pins materialize a closed,
  content-bound input lock; revision kind and verification scope are explicit.
- `edition-provider`: Declarative and executable input preparation yield one
  selected-input envelope without later-stage claims or mandatory source-repo
  placement.
- `edition-publication`: One editor-owned Edition project selects questions,
  sources, scope, exclusions, transformations, and medium-specific obligations;
  Publisher derives seals and Candidates.
- `semantic-compilation`: Native models and explicit projections may be
  imported through loss-reporting adapters without a mandatory duplicate Claim
  Model or invented cross-format equivalence.
- `semantic-publication`: Materialized reader views and separate static and
  interactive compositions preserve visible semantic coverage; dimensions and
  style are selected, bounded policies rather than adopter-name defaults.
- `publication-contract`: Acceptance, local effect, hosted publication, and
  custody stay with explicitly designated roles, including multi-source works.

## Impact and review boundary

The successor touches the installed input contract, source adapters, Edition
project, derived lock, scene and renderer seams, qualification reports, public
package surface, self-Edition, and adopter migrations. Source-side ETHOS and
AIGW changes require their own single writers and exact installed acceptance.
The written specifications must be reviewed before replacing this Change's
implementation task plan. No design or syntax-validation result grants
permission to implement or release.
