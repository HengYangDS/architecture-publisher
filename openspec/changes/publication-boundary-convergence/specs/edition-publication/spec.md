# Spec Delta

## MODIFIED Requirements

### Requirement: Successor Candidate manifest binds selected supplies

Candidate v2 SHALL bind input lock, Edition, semantic digest, selected checked
semantic supplies, and each medium's independent Scene, artifacts and checked
supplies. Supply records SHALL state identity, basis and method; checked file
sets are not execution traces. Publisher semantic and media file sets remain
distinct. Unselected implementations, package-only content and output paths
stay outside Candidate identity. Reader obligations and limits remain visible.

#### Scenario: One selected input produces two sibling media

- **WHEN** a successor Build Request selects static and interactive media and
  the same materialized inputs are built at two fresh output locations
- **THEN** the two builds have identical Candidate and artifact identities
- **AND** the static SVG/PNG and interactive HTML have distinct Scene hashes,
  artifact hashes, and medium-specific supplies without shared coordinates or
  DOM ownership

### Requirement: Static views compose one faithful figure

When static media is selected, its ordered views SHALL produce one standalone
SVG and one PNG through a complete-page composition. Each view SHALL retain
its own questions, assertions, limits, and graphic-carrier bindings. The
figure SHALL distinguish views without inventing cross-view relations or
transferring a claim or acceptance between them. All visible text, structural
marks, annotation and decoration SHALL fit together: clipping, obscuring
overlap, insufficient clearance, or missing visible carriers SHALL fail before
a complete Candidate. Graph-only layout success is insufficient.

#### Scenario: Two static views answer distinct questions

- **WHEN** an Edition selects two static views with distinct questions and
  source assertions, including one source entity present in both views
- **THEN** one static SVG and PNG visibly distinguish both views and retain
  each view's own assertion-to-graphic carriers and limits
- **AND** no edge or endorsement is inferred merely from the shared entity

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

## ADDED Requirements

### Requirement: Interactive graph viewport preserves readable navigation

The standalone interactive medium SHALL retain one complete selected graph and
its keyboard-readable source lists at every viewport width. If fitting that
graph on a compact viewport would reduce primary node labels below 12 CSS
pixels, the initial camera MAY focus a source-order relation and its endpoints
at a readable scale; this is a viewport choice, not a new Edition view or a
source assertion. The reader SHALL be able to inspect the whole graph with an
explicit Fit action. Responsive observation SHALL NOT overwrite an explicit
source-list focus, direct graph interaction, or explicit Fit on a same-layout
resize.

#### Scenario: A dense graph opens on a compact viewport

- **WHEN** the complete selected graph would need primary node text below 12
  CSS pixels to fit the available width
- **THEN** its initial viewport shows a readable source-order relation or node
  while every selected graph element remains present and navigable
- **AND** the complete source lists and an explicit Fit action remain available
  without replacing the graph with a narrower representation

#### Scenario: A reader chooses a graph focus

- **WHEN** a reader focuses an exact source-list item or directly interacts
  with the graph and the container is then resized within the same layout
- **THEN** responsive observation preserves the reader's selection and camera
  rather than silently returning to a full-graph fit or a previous automatic focus

#### Scenario: A reader explicitly requests the whole graph

- **WHEN** the reader invokes Fit after automatic or manual focus
- **THEN** the complete graph is fitted, any highlighted focus is cleared, and
  a later resize does not reapply the initial automatic focus

### Requirement: Installed package identity is separate execution evidence

Successor build and replay SHALL report the current installed Publisher package's
declared content-tree identity, method, and scope outside the lock and
Candidate. Package drift detected before emission SHALL fail. Package-only
changes may alter this evidence without changing Candidate bytes. The tree
is not archive identity, original-builder attestation, or acceptance; the
designated accepter's publication policy decides what else to require.

#### Scenario: Package-only content changes

- **WHEN** the same exact inputs and selected implementation file sets are
  built from two packages differing only in nonselected content
- **THEN** Candidate and artifact identities remain equal while the current
  installed-package tree identities differ
- **AND** a replay match does not claim which package built the original Candidate

#### Scenario: Installed package changes during compilation

- **WHEN** the installed package content differs between the build's opening
  and pre-emission checks
- **THEN** compilation fails before emitting a successful Candidate

#### Scenario: Qualification report remains derivable

- **WHEN** successor qualification selects a Policy and replays a Candidate
- **THEN** its records-bound report remains derivable from the selected
  Candidate, Qualification Set, and Policy without a package-tree field
- **AND** the separate replay result retains current package evidence without
  claiming the original builder or authenticating the installed package
