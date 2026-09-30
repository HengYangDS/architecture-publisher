# Spec Delta

## MODIFIED Requirements

### Requirement: Edition is a complete authored contract

One editor-owned Edition Project SHALL select audience, reader questions,
source addresses and references, question-scoped required assertions, explicit
limits and omissions, attributed editorial assertions, narrative, and separate
static and interactive presentation obligations. The Build Request, not the
Edition Project, selects source revisions and requested media. A source
assertion selected for a promised view/question SHALL be represented there or
classified by an allowed omission; unselected source facts need not be
enumerated as omissions. Publisher SHALL reject mechanically established
identity, typed-meaning, and declared grouping contradictions. It SHALL NOT
claim to decide whether arbitrary editorial wording is semantically equivalent
to, or contradicted by, the source. The selected public media SHALL attribute
such wording to the editor and disclose its unverified status. Candidate build
alone remains unqualified until the applicable semantic and human acceptance
decision.

#### Scenario: An editorial assertion is added

- **WHEN** an Edition states a cross-source relationship or conclusion not
  asserted by either source
- **THEN** it names the editor as proponent and identifies its selected basis
- **AND** it does not appear as source-approved fact

#### Scenario: An Edition omits a source claim

- **WHEN** a selected source assertion is absent from a view promising its
  reader question
- **THEN** its omission must be classified as covered in another answering
  view of the same medium or as an explicit limit on that answer
- **AND** unrelated, unselected source facts do not create exhaustive-graph
  obligations

#### Scenario: An Edition changes source meaning

- **WHEN** selected source identity or typed Claim Model rules establish an
  incompatible fact, or an authored group violates its declared forbidden pair
- **THEN** compilation rejects that exact contradiction before Candidate
- **AND** a later renderer cannot waive it by painting the same IDs

#### Scenario: Free wording seems to contradict a bound source claim

- **WHEN** an editor writes a stronger unsupported statement while retaining
  the exact source references
- **THEN** each selected public medium visibly attributes the wording to the
  editor and marks it unverified
- **AND** build success does not certify the wording, source endorsement, or
  human acceptance

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

Selected static views SHALL yield one complete-page SVG and PNG. Each view
retains its questions, assertions, reader-question limits, source-status
qualifiers, and graphic-carrier bindings. The figure SHALL separate views
without inventing cross-view relations or
transferring claims or acceptance. Text, structural marks, annotation, and
decoration SHALL fit without clipping, occlusion, overlap, or inadequate
clearance. Missing carriers fail before Candidate; graph-only layout success
is insufficient.

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

## ADDED Requirements

### Requirement: Free editorial framing is visibly attributed

A successor Edition build SHALL visibly identify the editor of free title and
summary text in every selected public medium, and state that the medium itself
does not evidence source endorsement. Build success SHALL NOT establish source
endorsement of that wording.

#### Scenario: An independent editor writes an official-sounding heading

- **WHEN** an editor distinct from the selected source claimant writes a title
  or summary that suggests official source endorsement
- **THEN** the static SVG/PNG and interactive HTML visibly identify the editor
  and state that source endorsement is not evidenced by the diagram
- **AND** the Candidate remains unqualified until the applicable semantic and
  human review, without treating the heading as a source-backed assertion

### Requirement: Standalone pages declare no external assets

Interactive composition SHALL reject declared external scripts, frames,
stylesheets, images, media, and CSS URLs before Candidate. Supported inline
data assets and same-document SVG fragments remain allowed. The standalone
Content Security Policy SHALL block network loads and connections while
allowing selected inline, data, and blob assets. Neither check proves code
cannot attempt blocked requests or that blocking preserves a complete work;
exact-browser qualification remains separate.

#### Scenario: A selected page declares an external image

- **WHEN** a selected interactive page contains an external image or CSS URL
- **THEN** composition fails before a complete Candidate is emitted
- **AND** the reader is not given an apparently standalone work with a missing asset

#### Scenario: Page code attempts an undeclared connection

- **WHEN** executable page code attempts a network connection in the reader
- **THEN** the browser policy blocks the connection
- **AND** a browser error or incomplete rendering cannot be counted as qualification

### Requirement: Edition selects a question-matched visual form

For each promised reader question, the Edition SHALL identify the dominant
relationship it asks the reader to understand and select a source-bound
visual form for each medium. The form SHALL project selected assertions and
explicit limits without becoming a second source model or requiring authored
pixel positions. Publisher SHALL validate representability before layout. It
SHALL NOT infer ownership, temporal order, or evidentiary status merely from
node order, edge direction, labels, or a renderer's default layout.
An explicitly typed native view may supply the form without a duplicate
Edition field; an ambiguous generic selection requires an editor's choice.

#### Scenario: Ownership question is not a traffic flow

- **WHEN** an Edition asks which actor owns a responsibility or handoff
- **THEN** its visual form distinguishes authority and boundary from traffic
  direction using selected source-backed assertions
- **AND** a generic left-to-right relation chain is not accepted solely
  because every selected entity and edge appears somewhere in it

#### Scenario: A responsibility role lacks its attributed basis

- **WHEN** a selected responsibility/handoff form assigns a visible zone,
  membership, or handoff without a same-question selected source assertion or
  separately attributed editorial assertion naming its basis
- **THEN** Publisher reports the affected question and unsupported role before
  layout, without a complete Candidate
- **AND** it does not derive ownership from entity type, box position, line
  direction, or a free narrative summary

#### Scenario: A relation is not an ownership claim

- **WHEN** an Edition binds a responsibility role or handoff directly to a
  selected entity, relation, or structural view rather than a typed Claim or
  editor-attributed assertion with selected source basis
- **THEN** Publisher reports the affected view question and unsupported role
  before layout, even if all referenced source endpoints are present
- **AND** it does not silently reinterpret a traffic route as an authority
  handoff

#### Scenario: Every responsibility role has an attributed basis

- **WHEN** the selected form binds each visible role and handoff to exact
  same-question assertions and discloses applicable conditions and limits
- **THEN** Publisher preserves source versus editorial attribution while
  composing the form without requiring authored pixel positions
- **AND** finite reference validation does not claim that free editorial
  wording is source-endorsed or substantively correct

#### Scenario: Group storage order differs from responsibility reading order

- **WHEN** an Editor changes only the order of the view's group records while
  retaining each group's members and the responsibility form's role order
- **THEN** the form's ordered role references, not group-record position,
  determine the visible reading order
- **AND** the selected group membership and assertion carriers remain exact

#### Scenario: Form or layout cannot answer the question

- **WHEN** the selected form cannot express a required assertion, or every
  complete painted candidate fails readable whole-page composition
- **THEN** Publisher reports the affected question and a bounded editorial
  form, grouping, or source-bound caption need before Candidate completion
- **AND** it does not substitute a prose inventory, a different source claim,
  or an unreviewed renderer-specific fallback

### Requirement: Interactive chapters carry meaning in the chosen form

The neutral interactive medium SHALL compose intrinsically sized, navigable
chapters in one continuous reading work. It SHALL not use a fixed slide height
or a default page-wide source ledger to compensate for unreadable graphic
relations. Selected relationship captions and question-relevant typed Claim
cues SHALL be bound to their exact visible subjects in the chosen form,
measured with the selected font, and placed with whole-page clearance. Routed
forms SHALL additionally clear nodes, other routes, and arrowheads. Full
selected records SHALL remain reachable through focused inspection. No
caption or cue may invent, silently abbreviate, or transfer source authority.

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
