# archify-renderer Specification

## Purpose

Render explicit typed diagram inputs through a pinned offline native backend,
independent of ETHOS, developer checkouts and undeclared host tooling.

## Requirements

### Requirement: Source-selected offline rendering

The renderer SHALL verify the selected input digest and bundled native runtime,
execute native schema and showcase artifact checks, and produce HTML without
requiring Git, ETHOS, Python, remote credentials or a developer checkout.

#### Scenario: Installed renderer receives portable typed input

- **WHEN** a valid selected diagram is rendered from an installed package in a relocated directory
- **THEN** native checks execute and a digest-bound self-contained HTML is produced
- **AND** the result reports browser and semantic acceptance as not performed

#### Scenario: Input requests undeclared source or network effects

- **WHEN** repository-source metadata or remote brand retrieval is requested
- **THEN** the offline renderer rejects it before executing upstream code

#### Scenario: Native quality check rejects a diagram

- **WHEN** native schema or showcase geometry checks fail
- **THEN** no final output file is published and the native diagnostic remains observable

### Requirement: Bounded non-overwriting file effects

The renderer SHALL write only a new explicit target after successful checks,
preserve existing content, and require caller-selected immutable input bytes.

#### Scenario: Output is occupied

- **WHEN** the target exists at preflight or arrives before final file creation
- **THEN** the operation fails without overwriting its contents

#### Scenario: Selected input or bundled supply has changed

- **WHEN** input or dependency bytes differ from their selected identities
- **THEN** rendering fails without creating the final HTML

### Requirement: Interactive inspection preserves selected meaning

Standalone interactive media SHALL provide a reversible reading state for
selected meaning. Its subject index SHALL reach every visible graphic and every
selected record without a page-wide record dump or a panel covering only part
of the diagram. Keyboard entry and return SHALL preserve a useful focus target.

#### Scenario: Reader inspects a diagram subject

- **WHEN** a reader opens inspection from a diagram subject or the chapter header
- **THEN** the subject index reaches every selected record without dropping one
- **AND** the complete diagram remains available on return at the same chapter
- **AND** a keyboard reader returns to the invoking subject or header control

### Requirement: Source identity is not source content

Interactive inspection SHALL label a selected source's namespace, claimant, and
exact digest as provenance metadata. It SHALL distinguish that identity from
source bytes and verified domain truth. Without a source-owner-supplied
verifiable locator, Publisher SHALL NOT offer a source-code pane or inferred
file or network link.

#### Scenario: A standalone work has no source-code link

- **WHEN** the exact selected source identity is available but source bytes and
  an owner-supplied locator are not part of the interactive work
- **THEN** inspection presents the identity and its scope without a dead-end
  source-code control or an invented path
- **AND** the Candidate manifest and input lock remain the exact audit carriers

### Requirement: Generic styling does not depend on adopter name

Generic code SHALL NOT choose font, palette, group capacity, or raster width
by source-product name. Historical v1 output rules SHALL remain truthfully
classified.

#### Scenario: Two Editions require different presentation

- **WHEN** two valid Editions select different visual policies or bounded
  raster widths
- **THEN** each Candidate carries its own policy and output identities
- **AND** the generic compiler uses no adopter-name branch

### Requirement: Interactive chapters carry meaning in the chosen form

Neutral HTML SHALL compose intrinsic, navigable chapters in continuous flow,
not fixed-height slides or a default page-wide source ledger. Relation captions
and question-relevant typed Claim cues SHALL bind exact visible subjects, use
selected-font metrics and clear the page. Routes SHALL clear nodes, routes and
arrowheads. Focused inspection SHALL expose full selected records. Captions and
cues SHALL NOT invent, silently abbreviate or transfer source authority.

#### Scenario: A selected relation has a readable source label

- **WHEN** the source label fits a feasible routed graph at the declared
  desktop reading size
- **THEN** the reader can identify that relation in the graphic without
  consulting a numbered prose ledger
- **AND** the emitted label clears nodes, other labels, arrowheads, and the
  page boundary after the actual graph renderer has painted it

#### Scenario: A selected Claim qualifies a diagram relation

- **WHEN** the Edition selects a typed Claim whose answer depends on its
  plane, condition, scope, or validity
- **THEN** a source-bound visual cue near its exact relation or subject
  distinguishes the necessary qualification in the default reading state
- **AND** focused inspection exposes the complete selected record without
  making the cue a new editable Claim

#### Scenario: The complete visual argument is infeasible

- **WHEN** measured labels and cues cannot fit without illegible scaling,
  collisions, omission, or a false source assertion
- **THEN** composition fails with the selected view and a bounded editorial
  regrouping or caption need
- **AND** an ordinal-only graph plus default relation transcript is not
  emitted as an apparently complete architecture diagram

#### Scenario: A short chapter precedes another chapter

- **WHEN** one selected mechanism needs less than a viewport of height
- **THEN** the next complete chapter follows in document flow rather than
  leaving an otherwise empty fixed-height slide
- **AND** navigation and inspection preserve each chapter's own identity,
  question, selected meaning, and keyboard focus

#### Scenario: Desktop width admits a shorter complete figure

- **WHEN** validated layout candidates preserve the same selected meaning
  and a horizontal candidate keeps labels readable at the declared desktop
  width while using less intrinsic height
- **THEN** composition does not prefer a tall isolated figure solely because
  it fits a fixed slide-height rectangle better
- **AND** actual browser paint verifies readable labels, complete routes,
  and the unchanged selection before visual acceptance

#### Scenario: A wrapping cut saves height but introduces a long detour

- **WHEN** valid candidates have readable labels and a wrapping cut reduces
  height while adding avoidable route distance
- **THEN** the single layout owner compares intrinsic height plus mean route
  detour before total route length, not height alone
- **AND** detour is the complete orthogonal route length beyond its terminal
  Manhattan distance; no emitted point or selected relation is adjusted
- **AND** at most four native candidates per selected page remain within the
  existing execution, output, and page-count bounds

#### Scenario: Exact applicability belongs to the reading region

- **WHEN** a graph has selected relation qualifiers or reader limits
- **THEN** native intrinsic layout places them alongside the complete figure
  when sufficient reading width exists, otherwise directly below it
- **AND** their exact subjects, predicates, exceptions, and attribution stay
  visible without a page-wide source inventory or a narrow-device variant

#### Scenario: Selected claims share exact context

- **WHEN** every selected Claim contains an identical context fact
- **THEN** one visible shared context may carry that fact without repeating it
- **AND** every distinct condition, scope, claimant, validity, value, and
  semantic anchor remains with its own Claim and complete Inspect record

#### Scenario: Display spelling could conflate typed applicability

- **WHEN** two selected scalar types or dimension values would have the same
  unquoted display spelling
- **THEN** unambiguous tokens distinguish their names and values in both
  visible media and Inspect before exact shared context is factored; only
  nonreserved identifiers omit quotes, with other strings using canonical JSON
- **AND** a string containing dimension punctuation cannot become equivalent
  to another Claim's conjunction

### Requirement: Neutral interactive geometry has one exact layout owner

Neutral interactive graphs SHALL use one pinned layout implementation for node,
flat-group, label, and complete route geometry. The SVG painter SHALL preserve
those coordinates. Viewport interaction SHALL neither re-route nor re-label.
Missing or invalid geometry SHALL fail before Candidate success. Verified
layout supply SHALL execute in the existing bounded owned-worker scope.

#### Scenario: Parallel relations and a return cycle coexist

- **WHEN** two selected relations share endpoints and another returns upstream
- **THEN** each retains its own complete route and source identity
- **AND** actual paths, arrowheads, and measured labels clear unrelated nodes
- **AND** a browser interaction cannot replace the selected route

#### Scenario: A route crosses a flat-group boundary

- **WHEN** the layout returns cross-group, intra-group, or self-loop sections
- **THEN** section and label coordinates are normalized from the named container
- **AND** every terminal attaches to its selected leaf-node boundary
- **AND** missing sections or ambiguous containers fail without a fallback line

#### Scenario: Layout supply stalls or returns malformed output

- **WHEN** the selected worker exceeds a declared time or output bound
- **THEN** the existing supervisor reclaims its owned process scope
- **AND** the operation fails without emitting an apparently successful Candidate
- **AND** prior artifacts, source meaning, and static geometry remain unchanged
