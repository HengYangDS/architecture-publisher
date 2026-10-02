# flagship-qualification Specification

## Purpose

Define non-compensating semantic, communication, visual, accessibility, runtime,
and human acceptance gates for flagship architecture publications.

## Requirements

### Requirement: Flagship acceptance is conjunctive

A flagship Edition SHALL pass semantic fidelity, coverage, geometry, browser,
accessibility, installed-use, recovery, and human visual acceptance. No weighted
score or success in one dimension SHALL compensate for failure in another.

#### Scenario: Automated geometry passes but the composition is poor

- **WHEN** overlap, clipping, glyph, route, and endpoint checks pass but the
  designated human reviewer rejects hierarchy, rhythm, density, or character
- **THEN** flagship acceptance fails
- **AND** the rejection records the Edition and artifact identities without
  changing source meaning

#### Scenario: A beautiful artifact omits required meaning

- **WHEN** the artifact is visually approved but fails semantic coverage
- **THEN** flagship acceptance fails before publication

### Requirement: Faithful, intelligible, and restrained review

Flagship review SHALL separately judge `faithful`, `intelligible`, and
`restrained` qualities. Faithfulness covers source truth and explicit limits;
intelligibility covers immediate purpose, hierarchy, routes, and mechanism
completeness; restraint covers proportion, typography, whitespace, rhythm,
color, and absence of ornamental noise.

#### Scenario: A flagship overview is evaluated by a reader

- **WHEN** the selected overview is reviewed at its intended display size
- **THEN** the reader can identify the product purpose and causal spine within
  three seconds, locate authority, media, qualification, publication, and
  feedback within thirty seconds, and trace an important claim to its source
  and limits within five minutes

### Requirement: Visible geometry is measured from painted output

Qualification SHALL inspect actual glyph, stroke, arrowhead, node, viewport, and
canvas envelopes for every declared delivery size. It SHALL reject unintended
overlap, clipping, overflow, ambiguous crossings, detached endpoints, template
badges, debug counters, and unbalanced terminal whitespace.

#### Scenario: Source geometry differs from browser paint

- **WHEN** a source-space check passes but the painted browser or raster output
  overlaps, clips, overflows, or disconnects a relationship
- **THEN** the medium fails qualification

### Requirement: Human acceptance is bounded evidence

A human visual decision SHALL bind the exact artifact digest, Edition digest,
review rubric, viewport or physical size, reviewer identity, verdict, and notes.
It SHALL NOT become a generic approval of future artifacts or another semantic
truth source.

#### Scenario: An accepted Edition is regenerated

- **WHEN** regenerated artifact bytes differ from the accepted bytes
- **THEN** the previous human decision is inapplicable
- **AND** a new flagship release requires fresh review

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

#### Scenario: Two relations share one routing segment

- **WHEN** both declare valid ordered routes through geometry-only junctions
- **THEN** each retains independent source endpoint and direction checks
- **AND** shared geometry grants no shared permission

#### Scenario: A source route is reversed or disconnected

- **WHEN** a segment's traversal, arrow or attachment contradicts its declared source route
- **THEN** Publisher rejects the route despite another valid shared carrier

### Requirement: Route contacts and painted direction agree

Adjacent traversals SHALL join both physical occurrence IDs and their actual
contacts within one source unit. Reversal SHALL reverse traversal, not paint.
Opposing painted arrows SHALL fail. The final traversal SHALL carry forward,
nonzero emitted directional evidence. Legacy edge checks SHALL remain intact.

#### Scenario: Junction identity hides a geometric gap

- **WHEN** adjacent edges name one junction but touch its opposite sides
- **THEN** the route fails unless an explicit segment spans those contacts

#### Scenario: Opposite routes share unarrowed geometry

- **WHEN** each route supplies its own forward terminal arrow
- **THEN** their common unarrowed segment may be traversed in opposite directions

### Requirement: Route expansion has finite existing bounds

A canvas/page SHALL contain at most 2,048 routes, 2,048 traversals per route,
8,192 traversal references and 8,192 reference/graphic pairs. Expansion SHALL
be counted before deduplication. Duplicate route IDs, missing segments and
repeated segments within one route SHALL fail independently of other carriers.

#### Scenario: Repeated references exceed the expansion bound

- **WHEN** traversal references exceed 8,192 before any deduplication
- **THEN** the scene is rejected instead of expanding its inspection records

### Requirement: Editorial routes retain Edition ownership

An editorial route SHALL bind one exact assertion reference and Edition digest.
Its endpoint entities SHALL be supported by the assertion's selected basis.
Its own visible statement SHALL remain required. Shared physical segments SHALL
paint once while retaining each relation/editorial inspection record separately.

#### Scenario: Conditional explanation returns to one entity

- **WHEN** a basis-bound editorial route connects two occurrences of one entity
- **THEN** it remains editorial and does not create a source self-loop

#### Scenario: An editorial route copies source authority

- **WHEN** its Edition digest changes, its own statement is omitted, or it claims
  to be an unselected direct relation
- **THEN** Publisher rejects the route without inventing source endorsement

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

### Requirement: Native measurement is a bounded prepared operation

Publisher SHALL measure shaped outline ink using the selected native renderer.
The supervised batch SHALL include static framing and needed wrap candidates.
Exact text, family, weight, size and anchor SHALL bind cached bounds. Misses SHALL
fail without estimation or another invocation. Query, glyph, byte, memory, time
and reply limits SHALL bound preparation and owned-worker reclamation.

#### Scenario: A cached label changes its shaping identity

- **WHEN** text, family, weight, size or anchor was not prepared
- **THEN** measurement fails instead of reusing another shaped box

#### Scenario: Parent metadata parsing is mistaken for supervised shaping

- **WHEN** font metadata and glyph availability are checked outside the Worker
- **THEN** Publisher does not claim that native supervision contains that parsing

### Requirement: Measured text is preserved within its supported profile

Publisher SHALL preserve exact single-line horizontal LTR Latin, Greek,
Cyrillic, Common and explicitly supplied Han text. Unsupported scripts,
combining marks, controls, joiners and variation selectors SHALL fail. Authored
paint SHALL preserve spaces and select geometric precision without synthetic
faces. Independent native and browser paint SHALL not be inferred from font pins.

#### Scenario: Spaces collapse despite an exact-font measurement

- **WHEN** visible authored text contains consecutive spaces
- **THEN** both independent painters preserve them rather than change measured meaning

#### Scenario: A supplied font lacks a selected Han character

- **WHEN** a selected visible Han character has no glyph in the selected face
- **THEN** the missing glyph fails without ambient font discovery

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
