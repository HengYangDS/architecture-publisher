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
