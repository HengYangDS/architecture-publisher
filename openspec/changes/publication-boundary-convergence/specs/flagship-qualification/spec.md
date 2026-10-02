## ADDED Requirements

### Requirement: Authored static description is separate from the visible subtitle

An authored static SVG SHALL expose the selected title as its accessible name
and an editor-authored description, when present, as its accessible description.
Without a selected description, the visible subtitle MAY remain the rendering
fallback but SHALL NOT alone establish accessibility acceptance for a complex
figure. The Edition editor owns the alternative's semantic adequacy; Publisher
SHALL escape and bind the selected text without inferring source meaning.

#### Scenario: A detailed source-owned static figure is published

- **WHEN** its Edition selects a distinct description of the causal relations and limits
- **THEN** the SVG exposes that text through `aria-describedby` separately from its title
- **AND** qualification still judges the exact artifact and does not infer accessible completeness from field presence

### Requirement: Graphic occurrences do not create semantic identities

An authored medium MAY bind one selected semantic member to several unique
graphic occurrences. Publisher SHALL retain the source-qualified identity,
derive every occurrence's assertion carriers, and check its source and directed
endpoints independently. Semantic completeness SHALL compare selected members,
not graphic counts. Duplicate graphic IDs, local references or conflicting
source facts SHALL fail. Repetition SHALL NOT assert new runtime instances.

#### Scenario: Separate Lane illustrations share one source contract

- **WHEN** two unique graphics reference the same selected Lane concept and relation
- **THEN** both source-bound occurrences are retained without copying the semantic member
- **AND** the result makes no claim about actual Lane instances or concurrency capacity

#### Scenario: A repeated connector reverses its source relation

- **WHEN** one graphic occurrence does not preserve the selected relation's directed endpoints
- **THEN** composition fails despite another valid occurrence of that relation

### Requirement: Static Claims retain visible and structural carriers

Static Claims representing typed relations or scalar subjects SHALL retain own
visible text and all required structural occurrences. Missing structure SHALL
fail without fallback. Unknown coverage SHALL NOT waive typed structural checks.
Structural IDs SHALL NOT replace text or prove exhaustive painting. Opaque
statements SHALL bind own text without fabricated structure; non-Claims SHALL
retain their admitted representation.

#### Scenario: One Claim describes repeated structural occurrences

- **WHEN** several graphic occurrences carry a Claim's selected relation or subject
- **THEN** the Claim retains its visible text and every owning structural occurrence
- **AND** relation Claims bind connectors while scalar Claims bind subject nodes

#### Scenario: Claim text survives without its structural owner

- **WHEN** the Claim's visible text remains but its selected structural owner is absent
- **THEN** composition refuses the unbound Claim instead of using another owner

### Requirement: Aggregate connectors preserve each relation's role

Publisher SHALL classify each source-relation-bearing aggregate member as a directed crossing or
context within one endpoint node. Reverse, missing or ambiguous membership
SHALL fail, and a connector SHALL contain a directed crossing. Internal context
facts and Claim anchors SHALL belong to that node, not borrow arrow direction.

#### Scenario: One forward relation hides a reverse relation

- **WHEN** a forward connector binds both a request and its reverse response
- **THEN** both authored media reject the reversed member independently

#### Scenario: A connector carries valid internal context

- **WHEN** a directed crossing also selects relations internal to its endpoint nodes
- **THEN** crossing carriers bind the arrow and internal carriers bind their owning node
- **AND** a connector with only internal context is rejected

### Requirement: Inspection preserves one fact across repeated graphic sites

Interactive inspection SHALL expose the same selected reference at each bound
graphic site and page without creating a competing factual record. Publisher SHALL
reject duplicate reference/graphic pairs and any disagreement in source digest,
title or facts for one reference. Each occurrence SHALL retain identical Claim
facts, including original subject and object/value. Required structural bindings
SHALL remain; opaque statements MAY bind their own Claim without a subject graphic.

#### Scenario: Two graphic sites inspect one source member

- **WHEN** both sites carry one selected reference and identical fact content
- **THEN** each site exposes that fact with the same source identity

#### Scenario: A second site invents different facts

- **WHEN** the second record changes the same reference's digest, title or fact content
- **THEN** the HTML compositor rejects the conflict rather than selecting a primary record

### Requirement: Authored statements retain their own source identity

Publisher SHALL bind each explicitly selected direct source statement to its
own visible Claim text. Existing valid anchored aggregate text SHALL retain
its representation and limits. Opaque statements SHALL retain exact facts
without fabricated dependencies. Unknown coverage SHALL NOT waive typed
structural checks. Text attribution SHALL NOT establish truth or acceptance.

#### Scenario: Two opaque statements share a document subject

- **WHEN** both original Claims have distinct visible statement occurrences
- **THEN** each retains its own identity and immutable facts without a mandatory subject box
- **AND** removing one required statement witness fails coverage

#### Scenario: An occurrence substitutes another Claim

- **WHEN** its selected Claim identity, digest or derived immutable facts disagree
- **THEN** Publisher refuses the mismatch without pretending to decide every paraphrase

### Requirement: Statement obligations derive from required assertions

Publisher SHALL derive assertions and structural closure from Edition views
and native selections. The existing declaration SHALL contain structural
closure, explicitly selected direct Claims and all required editorial
statements. Direct selection SHALL include required unanchorable opaque
Claims. Hidden, undeclared or missing text SHALL fail without anchor fallback.

#### Scenario: Two direct statements share their only visible text

- **WHEN** one text occurrence is the sole carrier of two distinct required direct statements
- **THEN** coverage fails until each statement has at least one exclusive visible witness
- **AND** shared additional context may remain beside those own witnesses

#### Scenario: A direct Claim loses its own text but keeps a subject label

- **WHEN** the required direct text disappears while its subject or relation remains visible
- **THEN** coverage fails without downgrading the Claim to anchored aggregate text

#### Scenario: A previously valid anchored input is rebuilt

- **WHEN** it does not select the new direct statement representation
- **THEN** its existing v1 interpretation and limitations remain unchanged

#### Scenario: A declaration attempts to hide an opaque required Claim

- **WHEN** the Edition requires an unanchorable opaque Claim but direct text is not declared
- **THEN** compilation refuses it rather than inventing a document dependency

### Requirement: Editorial explanations and adornments remain distinct

An editorial occurrence SHALL bind an existing Edition assertion, proponent,
basis and question. An adornment SHALL contribute no source identity, topology,
semantic coverage or authority. Publisher SHALL distinguish both from literal
source relations. A multi-relation summary SHALL remain editorial regardless
of valid constituent carriers; geometry SHALL NOT create a transitive edge.

#### Scenario: A required editorial statement shows only its source basis

- **WHEN** its exact Edition-qualified text witness is missing
- **THEN** coverage fails without attributing the editor's assertion to a source

#### Scenario: A statement-only view has no structural source assertion

- **WHEN** every required Claim and editorial statement has its admitted visible text carrier
- **THEN** no fabricated source node is required and wording remains unverified

#### Scenario: Routing geometry distributes one candidate object

- **WHEN** geometry-only junctions and segments connect several source occurrences
- **THEN** they do not become new source entities, permissions or evidence of instances

#### Scenario: A conditional explanation joins the same entity twice

- **WHEN** an Edition assertion explains a conditional consequence between two occurrences
- **THEN** the explanation retains editorial attribution without a source self-loop

### Requirement: Authored primitives have derived paint footprints

An authored node MAY select bounded circle, rect, line and polyline primitives.
Publisher SHALL derive fill, stroke, cap/join and closed-shape paint footprints
and validate any supplied envelope. Semantic port bounds SHALL remain separate.
Raw SVG, arbitrary paths, transforms, external references and executable content
SHALL fail. Primitive choice SHALL NOT define source role semantics.

#### Scenario: An author understates a primitive's ink envelope

- **WHEN** the selected shape or stroke exceeds the supplied paint envelope
- **THEN** validation refuses the false envelope or derived collision without moving ports

#### Scenario: A canvas exceeds the finite painting budget

- **WHEN** it exceeds 32 primitives per node, 64 points per polyline, 4096 primitives or 32768 points per canvas
- **THEN** Publisher refuses it before rendering

#### Scenario: A filled contour cancels its own winding

- **WHEN** a fill-only closed polygon traverses the same triangle in opposite directions
- **THEN** Publisher refuses the zero-area contour rather than treating its bounds as visible ink

#### Scenario: Primitive ink extends beyond its semantic port box

- **WHEN** a public renderer receives no optional paint envelope and the derived ink collides with text or another owner
- **THEN** the same normalized scene drives auditing and painting without moving ports

### Requirement: Primitive point budgets count actual paths

The canvas point budget SHALL include line endpoints, polyline vertices and
explicit closing traversals. Geometry-only adornments SHALL consume those
budgets without contributing source coverage, inspection or relation endpoints.

#### Scenario: Lines exceed the canvas budget after polyline saturation

- **WHEN** polylines consume 32768 points and another line adds two endpoints
- **THEN** Publisher refuses the canvas before painting

### Requirement: Source marks cannot use background-only painting

Publisher SHALL refuse a source-bearing primitive node whose complete fill and
stroke selection resolves to the canvas background. Outlined paper interiors
MAY remain valid. This predicate SHALL NOT imply perceptual contrast or visibility
at every delivery scale.

#### Scenario: Final paper painting erases an earlier contrasting operation

- **WHEN** the final primitive ends with background-only fill or stroke
- **THEN** Publisher refuses it conservatively without treating earlier possibly covered paint as a witness

#### Scenario: A source mark paints only paper

- **WHEN** its fill and stroke resolve to the same color as the medium background
- **THEN** Publisher refuses the structural carrier instead of counting invisible bounds

### Requirement: Adornments cannot define source grouping

Interactive structural groups SHALL partition non-adornment nodes only.
Geometry-only adornments SHALL remain outside those groups and SHALL NOT
enlarge their selected-source frames.

#### Scenario: A routing mark is added beside a grouped source node

- **WHEN** the source group selects the node but not the adornment
- **THEN** the grouping remains valid and adding the adornment as a member fails

### Requirement: Relation routes bind exact ordered traversals

A source relation route SHALL identify its exact relation, source/destination
entity occurrences and ordered segments with traversal directions. Publisher
SHALL validate source direction, continuous attachment and every segment.
Shared segments SHALL preserve each carrier independently. Reachability or an
editorial summary SHALL NOT replace exact source endpoints and route identity.
Existing scene-member, point and traversal-reference budgets SHALL remain bounds.

#### Scenario: Two relations share one routing segment

- **WHEN** both declare valid ordered routes through geometry-only junctions
- **THEN** each retains independent source endpoint and direction checks
- **AND** shared geometry grants no shared permission

#### Scenario: A source route is reversed or disconnected

- **WHEN** a segment's traversal, arrow or attachment contradicts its declared source route
- **THEN** Publisher rejects the route despite another valid shared carrier

### Requirement: Selected fonts have one measured paint identity

Edition font resources SHALL bind exact bytes, digest, face/weight and attributed
distribution evidence. Direct, declarative and executable materialization SHALL
agree. Measurement, embedding and raster SHALL use the same selected bytes.
Missing glyphs, pins, faces or required evidence SHALL fail without host discovery
or silent fallback. Declared evidence SHALL NOT grant legal or source approval.
Existing resource-count, input-byte and raster-font budgets SHALL remain bounds.

#### Scenario: Font measurement and final painting select different bytes

- **WHEN** any consumed font identity differs between measurement and rendering
- **THEN** Publisher refuses qualification rather than reuse historical metrics

#### Scenario: Required selected font evidence is missing

- **WHEN** selected font bytes, face/weight or required distribution evidence are unavailable
- **THEN** the exact input failure is reported without discovering a substitute font

### Requirement: Media derive independent occurrence evidence

Static and interactive SHALL independently derive carriers, statements, routes,
geometry and qualification. Shared pure validators and selected font bytes MAY
be reused; neither medium's geometry, DOM, coverage or approval SHALL authorize
the other. A static-only refinement change SHALL preserve the interactive
scene/render payload when its consumed inputs are unchanged.

#### Scenario: Only static presentation changes

- **WHEN** static refinement changes while interactive consumed meaning and resources remain identical
- **THEN** interactive scene/render payload bytes remain unchanged
- **AND** whole-Candidate metadata is rebound rather than borrowing prior acceptance
