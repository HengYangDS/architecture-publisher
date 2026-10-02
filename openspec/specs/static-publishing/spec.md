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
