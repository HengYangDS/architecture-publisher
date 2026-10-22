# static-publishing Specification

## Purpose

Provide explicit portable static rendering while preserving source meaning,
accepted artwork and independently qualified reconstruction paths.

## Requirements

### Requirement: Explicit offline raster inputs

The rasterizer SHALL consume a digest-selected closed source bundle, an explicit
SVG member, explicit font members, a bounded output width and an absent output
path. It SHALL NOT discover host fonts, browser sessions or project checkouts.

#### Scenario: Portable installed rendering

- **WHEN** a valid SVG and every required font are supplied to an installed package
- **THEN** it produces a PNG at the requested width with bound source and output hashes
- **AND** it reports rendering, not semantic or browser acceptance

#### Scenario: Undeclared or unsupported input

- **WHEN** the SVG refers to missing fonts or glyphs, external resources, executable content or unsupported features
- **THEN** rendering fails before publication without silently removing the content

### Requirement: Bounded non-overwriting rendering

The rasterizer SHALL enforce byte, dimension and execution limits, verify its
pinned runtime supply, and preserve existing or concurrently arriving output.

#### Scenario: Existing output or corrupt runtime

- **WHEN** output exists or the packaged rendering dependency differs from its selected identity
- **THEN** the operation fails without replacing that output

#### Scenario: Invalid dimensions or unsuccessful renderer

- **WHEN** the requested pixel extent exceeds the supported bound or rendering fails
- **THEN** no successful final PNG is published

### Requirement: Source-bound static edition preservation

The ETHOS static edition SHALL preserve its selected source assertions and
authored design, distinguish historic exact reconstruction from portable
rendering, and never substitute new pixels for accepted artwork implicitly.

#### Scenario: Original static publication is reconstructed

- **WHEN** its exact selected source and declared original measurement environment are supplied
- **THEN** all final labels are measured and the complete scene is recompiled
- **AND** resulting artifacts are compared with selected accepted identities

#### Scenario: A different rendering environment changes pixels

- **WHEN** a portable renderer produces different raster bytes or pixel values
- **THEN** the difference is recorded and separately qualified
- **AND** previous artwork and its acceptance remain unchanged

#### Scenario: Opt-in outlined delivery projection

- **WHEN** the selected source and edition, explicit trusted conversion tools, original font files and a reference raster identity are supplied
- **THEN** the adapter recompiles the original poster and requires exact reference raster reproduction before outlining
- **AND** it retains the original SVG and text alternative alongside the font-free SVG and scoped observation
- **AND** changed tools, missing fonts, reference mismatch or surviving text fail without replacing existing output
- **AND** the resulting outline and raster require separate visual qualification rather than inheriting original approval

### Requirement: Source-bound candidate poster

The poster SHALL compile explicitly selected source, authored semantic carriers
and verified measurement inputs without requiring frozen output hashes, while
enforcing the existing semantic and geometry gates.

#### Scenario: New meaning requires new labels

- **WHEN** an authored candidate represents the selected changed meaning
- **THEN** all required labels use verified selected measurements and visible carriers
- **AND** missing metrics, omitted meaning or failed geometry prevent a completed output

#### Scenario: Frozen baseline reconstruction

- **WHEN** the historical accepted poster input is selected
- **THEN** its exact scene and SVG identities remain mandatory

#### Scenario: Related text drifts without colliding

- **WHEN** refresh alternatives, pending-merge recovery or proposal-retirement text lose their declared grouping or alignment
- **THEN** the measured layout check rejects the candidate even when labels do not overlap
- **AND** numeric spacing minima remain owned by the source quality contract

### Requirement: Non-cooperative renderer termination

The rasterizer SHALL enforce its execution deadline even when its owned renderer
handles the default termination signal. It SHALL leave no live owned renderer,
successful PNG or incomplete scratch directory after the timeout is returned.

#### Scenario: Renderer handles the default termination signal

- **WHEN** an input-consuming renderer handles SIGTERM and exceeds its deadline
- **THEN** the parent forcibly terminates that renderer and returns the timeout error
- **AND** the requested output remains absent and temporary execution state is removed

#### Scenario: Renderer succeeds within the deadline

- **WHEN** the real renderer consumes valid selected input and exits successfully
- **THEN** the existing source, supply, pixel and non-overwrite checks still apply
- **AND** no implicit retry or weaker acceptance is introduced

### Requirement: Source-bound static carrier edits

Candidate composition SHALL bind authored visible carrier edits to exact source
values and validate them using actual measured glyphs and emitted geometry.
It SHALL NOT weaken accepted replay locks or silently remove infeasible text.

#### Scenario: Changed meaning fits a declared carrier

- **WHEN** exact source-bound authored text fits the declared composition constraints
- **THEN** the complete overview carries the changed meaning and produces new candidate identities

#### Scenario: Text exceeds composition capacity

- **WHEN** changed text violates spacing, bounds or overlap constraints
- **THEN** composition fails and the prior accepted publication remains unchanged

### Requirement: Completed raster input

The raster parent SHALL complete the selected JSON request in private scratch
before starting its worker and SHALL supply a read-only regular descriptor as
stdin with a deterministic EOF. It SHALL close the descriptor and remove scratch
on success or failure without changing supply validation or output acceptance.

#### Scenario: Selected input is consumed

- **WHEN** the worker reads its selected request
- **THEN** stdin is a completed regular file containing the exact JSON request
- **AND** a read after the request reaches EOF without a parent pipe writer

#### Scenario: The worker does not complete

- **WHEN** selected worker execution reaches its existing deadline
- **THEN** the parent forcibly terminates its owned worker and returns a bounded failure
- **AND** scratch and the input descriptor are released without replacing existing output

#### Scenario: Normal rendering completes

- **WHEN** the selected request completes successfully
- **THEN** output identity, supply validation and non-overwrite guarantees remain intact

### Requirement: CoreText stage reclamation precedes scratch cleanup

CoreText SHALL run the selected compiler and measurement in separately bounded
owned process groups. Each group SHALL be reclaimed before the next stage or
scratch removal. Compiler and measurement deadlines remain 120 and 30 seconds;
no retry, broader input, inferred acceptance, or sandbox claim is introduced.

#### Scenario: The selected compiler leaves a descendant

- **WHEN** the selected compiler fails or times out with a live owned descendant
- **THEN** the parent reclaims the stage group before removing private scratch
- **AND** no measurement stage starts and no successful metrics are published

#### Scenario: The selected measurement completes

- **WHEN** the selected compiler succeeds within its deadline
- **THEN** its group closes before measurement starts under its own deadline
- **AND** selected compiler, SDK, font and helper identities remain checked

### Requirement: CoreText failures preserve primary and cleanup causes

A failed CoreText stage SHALL report its bounded primary process diagnostics.
Unproved group or scratch reclamation SHALL retain that primary cause and a
separate cleanup cause rather than imply successful cleanup or hide the failure.

#### Scenario: Cleanup also fails after compiler rejection

- **WHEN** a failed compile and a cleanup failure occur in one invocation
- **THEN** its failure retains the compile identity and bounded diagnostic tail
- **AND** it separately reports cleanup uncertainty without claiming no residue

#### Scenario: Diagnostic checkpoint cannot be observed

- **WHEN** reading the bounded checkpoint fails after a stage timeout
- **THEN** the failure retains its typed stage timeout as the primary cause
- **AND** unavailable diagnostics are a separate bounded observation

### Requirement: CoreText worker retains bounded reclamation lifetime

A selected CoreText worker SHALL remain live after its reply until parent
reclamation, bounded by the selected stage deadline plus the existing cleanup
allowance and one second. It SHALL flush enabled V8 coverage before replying
and reject invalid lifetime bounds before parsing input or launching a child.
Stage ceilings and fail-closed group reclamation SHALL remain unchanged.

#### Scenario: The reply precedes owner reclamation

- **WHEN** the selected stage worker replies and the parent has not reclaimed it
- **THEN** the worker remains live within its validated finite lifetime
- **AND** enabled coverage is flushed before the reply
- **AND** the parent still reclaims its group before admitting stage success

#### Scenario: The stage supervisor disappears

- **WHEN** the stage owner disappears before reclaiming the replying worker
- **THEN** the worker expires after the selected stage bound plus the existing
  cleanup allowance and one second
- **AND** descendant reclamation and passing stage acceptance remain unproved

#### Scenario: The worker lifetime is malformed

- **WHEN** the selected worker lifetime is absent or outside its admitted bound
- **THEN** the worker exits unsuccessfully before parsing input or launching a child

### Requirement: Raster process failure remains distinct from malformed replies

The raster owner SHALL distinguish a nonzero process exit without a reply from
malformed reply bytes. It SHALL retain explicit worker error replies, reject
successful-looking replies from nonzero exits and emit no raster artifact after
process failure.

#### Scenario: Windows worker terminates without a reply

- **WHEN** the native worker exits nonzero without emitting reply bytes
- **THEN** the raster owner reports process failure rather than malformed JSON
- **AND** no output artifact is emitted

#### Scenario: Worker emits malformed reply bytes

- **WHEN** the worker emits bytes that do not satisfy the response contract
- **THEN** the raster owner reports the existing invalid-response failure
- **AND** explicit valid error replies retain their selected error code

### Requirement: CoreText execution has one stage deadline owner

The parent stage supervisor SHALL own the compiler or measurement deadline and
native process-tree reclamation. The worker SHALL NOT start a second execution
timer or receive a duplicate stage timeout. Its finite owner-loss lifetime
SHALL remain separate and unchanged. Stage ceilings, output bounds and
fail-closed cleanup semantics SHALL remain unchanged.

#### Scenario: Execution reaches its selected deadline

- **WHEN** a live selected compiler or measurement exceeds its stage deadline
- **THEN** the parent reclaims the selected tree before reporting the timeout
- **AND** an inaccessible diagnostic checkpoint annotates the timeout without
  replacing it or relaxing cleanup evidence

#### Scenario: Only the parent selects the execution deadline

- **WHEN** the worker receives exact executable, arguments, environment, input,
  scratch and output bounds without a second timeout value
- **THEN** selected finite execution may complete before the parent deadline
- **AND** the worker remains available for owner reclamation or finite self-expiry

### Requirement: Raster source notices bind the selected closure

Raster supply notices SHALL identify the same source archive, registry location
and Cargo.lock digest as the selected raster-source manifest. Required license
text SHALL remain complete. Supply integrity checks SHALL reject changed notice
bytes unless their exact selected supply binding is refreshed.

#### Scenario: A source closure advances

- **WHEN** the selected source archive or lock changes
- **THEN** current notices identify the new exact closure and lock
- **AND** historical release bytes remain unchanged

#### Scenario: A stale source-notice header survives

- **WHEN** a notice location or digest disagrees with the selected manifest
- **THEN** source-supply qualification rejects the disagreement

### Requirement: Static views compose one faithful figure

Selected static views SHALL yield one complete-page SVG and PNG, each retaining
questions, assertions, reader-question limits, source-status qualifiers and
graphic-carrier bindings. Views SHALL remain distinct without inventing
cross-view relations or transferring claims or acceptance. Text, structural
marks, annotation and decoration SHALL fit without clipping, occlusion, overlap
or inadequate clearance. Missing carriers fail before Candidate; graph-only
layout success is insufficient.

#### Scenario: Two static views answer distinct questions

- **WHEN** an Edition selects two static views with distinct questions and
  source assertions, including one source entity present in both views
- **THEN** one static SVG and PNG visibly distinguish both views and retain
  each view's own assertion-to-graphic carriers and limits
- **AND** no edge or endorsement is inferred merely from the shared entity

#### Scenario: Claim Model structure has no authored groups

- **WHEN** a static view selects Claim Model entities or relations and the
  editor declares no visual groups
- **THEN** Publisher uses its selected bounded structural geometry to render
  every required entity, relation, direction, and qualifier without inventing
  group membership or printing a reading-group key
- **AND** unsupported or infeasible geometry fails before Candidate rather
  than requiring a dummy authored group or dropping a source assertion

#### Scenario: One neutral raw-structure view retains the complete figure grammar

- **WHEN** exactly one unrefined static view selects source entities or
  relations without selecting Claim cards for that view
- **THEN** its question leads one complete figure containing its exact graph,
  relation explanation, source status, and declared limits
- **AND** absence of authored groups does not switch to a separate side-rail
  composition or imply that an unreviewed result is visually accepted
- **AND** a selected upstream authored view without editorial groups retains
  its source-view composition instead of being mistaken for raw structure

#### Scenario: Neutral peer nodes have unequal label lengths

- **WHEN** the selected Dagre adapter composes source nodes with different
  label lengths in one structural view
- **THEN** it measures one sufficient node width for that view, rounds the
  box to its 32-unit grid, and gives every peer the same width and height
- **AND** same-rank left edges align while relations and captions are routed
  against the resulting boxes, not the former varying widths
- **AND** a regular-row Dagre candidate is preferred when every caption clears
  every route; a caption-clearance failure may select the balanced Dagre
  candidate, with its own routes and captions recomputed
- **AND** if neither candidate clears its captions, composition fails rather
  than shrinking text or moving nodes after layout without updating edges

#### Scenario: Method evidence does not become figure copy

- **WHEN** an Edition's selected source and compiler have method or
  dependency-closure limitations that do not alter a promised reader answer
- **THEN** the static SVG and PNG retain reader-question limits and source
  status without printing raw method-limit identifiers as a diagnostic ledger
- **AND** the Candidate retains the exact limitations for inspection and
  qualification, without implying that their absence from the art clears them

#### Scenario: An unsupported construct affects the answer

- **WHEN** a selected reader question depends on source meaning that its
  admitted interpreter cannot preserve
- **THEN** compilation fails before Candidate rather than suppressing the
  limitation in the figure and claiming complete coverage

#### Scenario: A view forbids two selected members in one visual group

- **WHEN** its Edition declares a reasoned forbidden pair of source-qualified
  members and an authored group contains both
- **THEN** Publisher rejects that medium before layout
- **AND** an unselected or duplicate unordered pair fails rather than being
  treated as source authority or silently ignored

#### Scenario: One authored static canvas covers ordered views

- **WHEN** an editor selects one data-only authored static scene for two or
  more ordered static views
- **THEN** Publisher binds the complete scene to the union of their selected
  source assertions and retains each view's own assertion attribution
- **AND** the scene is rendered through the ordinary static SVG and PNG path,
  not accepted as pre-rendered media
- **AND** absent, duplicated, or extra source meaning fails rather than being
  repaired by dropping a view, forging a cross-view relation, or reusing an
  unrelated graphic carrier

#### Scenario: Authored static wording retains source identity

- **WHEN** an authored canvas changes visible wording while retaining the same
  source-qualified graphic bindings
- **THEN** the Candidate declares authored text meaning unverified
- **AND** exact membership and geometry checks do not certify the wording as a
  source assertion or turn the unqualified Candidate into accepted media

#### Scenario: A structural overview does not inherit sibling Claim coverage

- **WHEN** a static view selects source entities and relations but no Claim
  facts, while interactive views select the source Claim facts
- **THEN** the static figure binds and renders its selected structural
  assertions without claiming to paint the unselected Claim facts
- **AND** interactive Claim coverage cannot be transferred to the static
  figure or treated as a shared approval

#### Scenario: A selected relation supplies its endpoint members

- **WHEN** an authored static canvas selects a source relation without separate
  entity selections for its exact endpoints
- **THEN** Publisher admits those source-bound endpoint members as visible
  nodes without requiring duplicate Edition selections
- **AND** an unrelated or source-inconsistent entity still fails

#### Scenario: One static view cannot be represented

- **WHEN** any selected static view cannot fit without structural loss or
  overlap in the composed figure
- **THEN** no complete static Candidate is emitted
- **AND** Publisher does not silently drop or shrink that view to force a pass

#### Scenario: Text clearance dimensions remain distinct

- **WHEN** a source-selected quality rule specifies clearance between text and
  non-owner geometry but does not specify a text-to-text gap
- **THEN** the scene audit applies that distance only to the selected geometry
  predicate and still rejects actual glyph overlap
- **AND** it does not infer the same numeric distance for text pairs
- **AND** a successor authored canvas retains its separately selected
  text-to-text clearance floor

#### Scenario: Editorial groups interleave in causal placement

- **WHEN** a source-authorized static view assigns each selected node to one
  editorial group but a compact causal layout interleaves those groups
- **THEN** Publisher preserves every group label and exact member list in a
  reading key outside the causal graph
- **AND** it does not paint a floating group heading or enclosure that could
  imply a different membership or invent a source relation
- **AND** missing, duplicate, or visually ambiguous members fail with a named
  diagnostic rather than being omitted or silently reassigned

#### Scenario: Compactness conflicts with legibility

- **WHEN** two layouts carry the same selected assertions and one reduces
  empty area only by shrinking text or increasing collisions or crossings
- **THEN** Publisher does not choose that layout solely for its smaller canvas
- **AND** human review of visual hierarchy and unused space remains required
