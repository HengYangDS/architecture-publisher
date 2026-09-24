# Spec Delta

## MODIFIED Requirements

### Requirement: Evolution is conservative and approval preserving

The compiler SHALL compare exact semantic inputs, determine affected Editions
and views through declared dependencies, and distinguish rebuild,
requalification, review, acceptance, and publication. Declared view selectors
SHALL be reevaluated against the selected current Claim Model, and the exact
materialized selection SHALL be recorded before layout or rendering. Unknown
dependencies SHALL broaden obligations; regeneration SHALL NOT transfer prior
approval. A stored or authored layout whose layout-affecting inputs have
changed SHALL be diagnosed as stale and SHALL NOT silently qualify new output.

#### Scenario: A claim changes without changing graph cardinality

- **WHEN** a claim changes plane, condition, scope, maturity, value, or provenance
- **THEN** every dependent view is marked affected
- **AND** previous semantic, visual, browser, and human approval is not reused

#### Scenario: Generated output is edited

- **WHEN** a generated SVG, PNG, or HTML file differs without a selected Edition
  source change
- **THEN** qualification rejects the artifact as an unowned projection

#### Scenario: A declared selector changes membership

- **WHEN** a selected source revision adds or removes a claim matched by a
  declared view selector
- **THEN** the materialized view membership and its exact dependency identity
  change
- **AND** applicable media are rebuilt and requalified without inheriting
  acceptance of the previous membership

#### Scenario: Authored layout no longer matches selected meaning

- **WHEN** exact selected layout-affecting semantic or authoring inputs differ
  from those bound by an authored or cached layout
- **THEN** the layout is reported stale and is either recomputed within the
  Edition's constraints or returned for author review
- **AND** stale geometry cannot qualify a new Candidate merely because it is
  still syntactically valid

## ADDED Requirements

### Requirement: Existing Edition and Provider contracts remain truthful

Every previously valid Edition v1 and Provider v1 input SHALL retain its
source-bound meaning, omission policy, and selected scene meaning when
compiled by a successor Publisher. The existing v1
`authoredInputSha256` SHALL remain an identity-only value, not evidence that
authoring bytes were consumed. New fields MAY extend v1 only when their absence
preserves those meanings. A change to a previously declared output default
SHALL be identified as either a correction of a proven contract violation or
a versioned successor behavior, with fresh applicable qualification in both
cases. If a new behavior requires reinterpreting a valid v1 input or changes
the Provider's standard-value promise, Publisher SHALL introduce and select
a versioned successor contract and migrate each consumer explicitly rather
than changing v1 in place.

#### Scenario: A prior Edition is rebuilt by the successor

- **WHEN** an unchanged valid Edition v1 and Provider v1 input is selected
- **THEN** the selected claims, omissions, scene meaning, identity-only
  authoring digest retain their prior meaning
- **AND** the new build does not claim that the legacy digest proves media
  consumption

#### Scenario: A proposed extension changes a valid v1 input

- **WHEN** selected authoring or visual-policy behavior would reinterpret a
  previously valid v1 field or Provider v1 output
- **THEN** that behavior is rejected under v1 and requires a reviewed successor
  Edition and corresponding Provider contract before consumer migration

### Requirement: Authored rendering dependencies are truthfully bound

When an Edition declares exact authored bytes as a media-rendering dependency,
the Candidate SHALL identify the selected input, prove that the selected
renderer consumed it, and bind the resulting artifact to that dependency.
Source-owned packages MAY materialize those bytes through the existing Provider
contract; generic compilation SHALL NOT discover or execute an unselected
package export. A digest used only to distinguish an Edition or
an external authoring process SHALL be explicitly classified as identity-only;
it SHALL NOT satisfy media provenance, reproduction, or visual qualification.
An absent, changed, unselected, or unreadable declared rendering dependency
SHALL fail before a successful Candidate is emitted.

#### Scenario: Selected authoring changes the static medium

- **WHEN** a source-owned Edition selects changed static authoring bytes with a
  new exact identity
- **THEN** static compilation consumes those bytes and binds the new static
  artifact and Candidate identities to them
- **AND** unchanged interactive composition remains independently identifiable

#### Scenario: A declared digest is not consumed

- **WHEN** an Edition supplies an authored-input digest but the selected build
  does not read or execute the corresponding input
- **THEN** the result classifies the digest as identity-only and reports media
  consumption as unproved
- **AND** no qualification or publication claim treats the digest as evidence
  that the authored input shaped the emitted medium

#### Scenario: Selected authoring is unavailable

- **WHEN** selected authoring bytes are missing, unreadable, or differ from the
  declared identity
- **THEN** the build fails without a successful new Candidate or changed
  publication target

### Requirement: Source-owned visual policy governs generic media

An Edition using the newly admitted visual-policy contract SHALL select its
applicable font supply, visual grammar, density, layout constraints, and
bounded output dimensions, or explicitly select a documented neutral
structural profile. Previously valid v1 Editions without that policy SHALL
remain under their existing declared output rules; an implementation mismatch
SHALL NOT be misrepresented as a new source-owned choice. The generic compiler SHALL NOT
choose an adopter-specific font, preset, group cardinality, or raster width by
source product identity. A renderer SHALL report an unsupported selected policy
instead of silently substituting another style or discarding meaning.

#### Scenario: Two source products select different presentation

- **WHEN** two valid Editions select different fonts, visual grammars, or
  bounded raster widths for the same generic build capability
- **THEN** each Candidate carries its own selected presentation and output
  identities without a product-name branch in the compiler

#### Scenario: Selected visual policy is unsupported

- **WHEN** the selected renderer cannot honor an Edition's required font,
  layout constraint, or output dimension
- **THEN** compilation fails with an explicit unsupported-policy diagnostic
- **AND** it does not substitute a default, shrink below declared readability
  limits, or emit an apparently qualified artifact
