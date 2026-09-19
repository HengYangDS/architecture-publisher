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
