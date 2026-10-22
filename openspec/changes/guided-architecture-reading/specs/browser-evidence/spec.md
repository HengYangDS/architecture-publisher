## ADDED Requirements

### Requirement: Required native CI execution

Each native CI job SHALL use locked, job-local tools and execute browser-backed
checks and the frozen Raster rebuild before the whole quality gate. Missing
supply SHALL fail required execution. The Raster manifest owns source identity;
CI uses its caller-provided Forge API and native job-token authentication.
Each platform retains separate evidence and all four coverage floors at 95
percent or higher.

#### Scenario: Required browser supply is missing

- **WHEN** CI has no accessible selected Chromium executable
- **THEN** the npm test preload refuses execution instead of skipping browser checks
- **AND** an explicit caller-selected executable is not silently replaced

#### Scenario: A native CI job qualifies rendering

- **WHEN** locked installation and source verification succeed
- **THEN** the job executes sandbox-enabled browser checks and the frozen Raster journey
- **AND** no privilege increase or skipped prerequisite counts as platform acceptance

### Requirement: Complete native-reader lifecycle evidence

Browser evidence SHALL bind exact HTML and observe selected native exploration,
page navigation, addressed reading, appearance and disposal. Native mechanisms
own their query, camera and finite-journey state. Missing observations SHALL
remain unproved; historical playback or Node results do not qualify a reader.

#### Scenario: An Edition offers complete figures

- **WHEN** no timed mechanism is selected
- **THEN** every page remains a complete manually navigable figure
- **AND** no legacy player obligation or load-time autoplay is inferred

#### Scenario: Native reading is superseded

- **WHEN** page navigation, history, Inspect or disposal supersedes active reading
- **THEN** the old frame cannot resume deferred work or grant destination autoplay
- **AND** selected source geometry remains unchanged

#### Scenario: Rapid relationship replay supersedes queued navigation

- **WHEN** a new addressed relationship choice replaces a destination before native arrival
- **THEN** both the native current view and the requested destination must match before replay
- **AND** the newest choice supersedes queued navigation through the public native API
- **AND** Search or component-detail navigation clears the old address after destination arrival
- **AND** reload cannot revive the superseded relationship or lose a repeated graphic occurrence
- **AND** disposed readers ignore subsequent navigation observations

#### Scenario: An unrelated iframe message arrives

- **WHEN** a message has the wrong sender or page
- **THEN** it cannot navigate, inspect or change the selected reading state

### Requirement: Native capability admission follows semantic support

The public build SHALL preserve every selected graphic occurrence and its exact
source declarations in one Inspect surface. Supported native search, focus,
relationship inspection and viewport navigation SHALL consume the selected
source model, not explanatory geometry. Figure-occurrence counts SHALL NOT
claim source-entity counts. Absent capability SHALL NOT mean zero relationships.

#### Scenario: An authored node supplies a concise note

- **WHEN** an ordinary authored node declares a valid `note`
- **THEN** the renderer passes it unchanged to the native component detail field
- **AND** native typography and reading levels own its presentation
- **AND** it neither creates semantic membership nor relaxes text collision checks

#### Scenario: Explicit literal geometry declares a desktop text budget

- **WHEN** an authored scene declares `typography.minimumTextPx` between 6 and 32
- **THEN** the adapter reuses the native desktop width budget, text fitting and row layout
- **AND** it computes native font sizes, baselines and connection-label footprints together
- **AND** native node type glyphs and Legend entries retain that desktop readability budget
- **AND** the composition honors only the declared intrinsic-height reading mode
- **AND** actual navigation bounds preserve the native stage gap before and after scrolling
- **AND** a resting-position receipt alone does not prove control clearance
- **AND** fixed nodes, routes, labels and selected semantics remain unchanged
- **AND** insufficient space still refuses rendering without reducing the declared budget
- **AND** scenes without this declaration retain their existing presentation

#### Scenario: Intrinsic composition is measured after resolution

- **WHEN** ordinary occurrences omit calculated geometry
- **THEN** selected font measurements include complete text fields and type glyphs
- **AND** browser evidence checks peer alignment, spacing and actual painted clearance
- **AND** complete repeated occurrences and directed traversals survive resolution
- **AND** a fit envelope alone does not prove text, label-mask or route clearance

#### Scenario: A figure groups or repeats source members

- **WHEN** explanatory figure endpoints cannot stand for exact source relationships
- **THEN** each figure occurrence still opens its complete selected declarations
- **AND** native source reading retains exact distinct entities, relations and page scope
- **AND** inspection returns keyboard focus to the original occurrence
- **AND** collapsed endpoints do not create a source path or invent relationship counts

#### Scenario: A raw native query request has incomplete membership

- **WHEN** the raw renderer receives a native-mode request with declared exploration limits
- **THEN** it refuses before emitting an executable document or partial output
- **AND** the public build still renders the complete figure with checked source reading

#### Scenario: Exact logical graph membership is admitted

- **WHEN** source nodes and relationships have complete unambiguous graphic bindings
- **THEN** native Path, Reach, Lens and relationship inspection consume those bindings
- **AND** shared physical segments never become extra logical edges

### Requirement: Complete source-query evidence

Required directed multi-hop paths, transitive reach and exact source-kind grouping
SHALL be qualified through the selected public build on exact source records.
Editorial figure roles SHALL remain distinct from source kinds.

#### Scenario: Native direct adjacency is available

- **WHEN** a selected source reader offers direct incoming or outgoing relationships
- **THEN** that observation does not qualify a multi-hop path or transitive-reach result
- **AND** a missing required query remains open rather than reported as zero or unreachable

#### Scenario: Exact source types contain similar or absent values

- **WHEN** source kinds share a substring or a source element has no declared kind
- **THEN** grouping retains each exact source kind and the separate undeclared state
- **AND** substring search and editorial figure-role grouping do not qualify that result

### Requirement: Portable addressed reading

Native copy-link actions SHALL address the independent publication and its exact
page. The publication bridge SHALL restore native query state through the native
parser, without same-origin permission, a second query grammar or playback.

#### Scenario: A reader copies and opens a resolved Route

- **WHEN** the copied link opens the standalone HTML in a new window
- **THEN** the selected page and checked native Route are restored
- **AND** no `about:srcdoc` link or autoplay consent is delivered

#### Scenario: Browser navigation restores addressed reading

- **WHEN** a non-overview native query survives page navigation, Back, Forward,
  reload or cross-document return
- **THEN** the parent page and opaque query restore through the native parser
- **AND** each page switch contributes only one browser history entry
- **AND** rapid supersession cannot revive a disposed frame or grant autoplay

#### Scenario: Export is part of the selected query interaction

- **WHEN** a reader opens Export for a current Route or Reach query
- **THEN** the query remains selected and its native share action stays operable
- **AND** canonical export remains free of temporary reader state

#### Scenario: Clipboard policy denies an opaque reader

- **WHEN** the document's effective policy denies Clipboard API access
- **THEN** text links use the native fallback without calling the denied API
- **AND** image copying is unavailable without widening document permissions
- **AND** no permission-policy error is suppressed or treated as acceptance

### Requirement: Appearance and reading preserve visual acceptance

Every offered appearance SHALL retain semantic content, measured contrast,
keyboard focus and diagram/caption separation. Real desktop checks are separate
from source metadata and human judgment. Unobserved predicates stay unproved.

#### Scenario: Each qualified style and theme is exercised

- **WHEN** the exact reader is inspected across its offered appearances
- **THEN** labels, conditions, controls and selected content remain readable
- **AND** style changes preserve measured geometry

#### Scenario: Native controls consume reserved publication space

- **WHEN** native reader chrome reserves space inside a bounded desktop member
- **THEN** the complete canvas and controls remain inside its viewport
- **AND** native measured clearance prevents controls from covering artwork
- **AND** artwork whitespace excludes that declared control reservation
- **AND** camera and geometry remain owned by the native renderer

#### Scenario: Only an automated check passes

- **WHEN** geometry or structure passes without the required reading or visual review
- **THEN** the exact work remains unaccepted for those unobserved predicates

### Requirement: Node type encoding has one semantic owner

The Edition's `visualPolicy.figureTypes` SHALL define one pinned glyph per
effective kind. Every ordinary figure, Passport, Lens, Finder, Legend and
canonical export SHALL reuse it across all selected pages and media, independent
of paint. Type rows SHALL place a bounded icon before a readable label, without
count badges. Source kinds, navigation counts and source-owned primitive artwork
SHALL retain their separate meaning.

#### Scenario: Paint and source kinds differ

- **WHEN** a checked source component uses a Backend paint role
- **THEN** its Passport, Legend and Lens identify the effective figure kind
- **AND** no Backend identity is inferred from the paint or corner symbol

#### Scenario: Reader wording differs from internal type identity

- **GIVEN** the Edition catalog declares an icon and readable label for a kind
- **WHEN** Publisher composes the selected static and interactive works
- **THEN** every type-identifying key and reader control uses that label
- **AND** its layout measures the displayed wording rather than the internal key
- **AND** source kinds, exact membership and effective kind identity remain unchanged
- **AND** conflicting labels for one kind or ambiguous labels across kinds are refused
- **AND** string catalog entries retain their previously valid literal wording

#### Scenario: Mixed source membership has an explicit reader role

- **WHEN** an authored figure binds several source kinds and declares its figure kind
- **THEN** native reading uses that declared architecture role
- **AND** Inspect retains every bound entity and its original source kind
- **AND** no repeated aggregate footer is inserted into the diagram

#### Scenario: Mixed source kinds have no declared reader role

- **WHEN** a graphic binds several source kinds without an editorial figure kind
- **THEN** composition refuses the ambiguous type instead of inventing a grouping type
- **AND** an explicit architecture role retains every member and original source kind
- **AND** grouping alone does not establish a component, subsystem or execution role

#### Scenario: A kind occurs on several selected pages

- **WHEN** ordinary figures share an effective kind across selected pages
- **THEN** nodes, Passport, Lens, Finder, Legend entries and exports use the same resolved glyph
- **AND** one Legend entry contains one glyph and its native Lens groups all occurrences

#### Scenario: The selected publication has an invalid type catalog

- **WHEN** a catalog is absent, misses a later-page kind, uses an unsupported glyph,
  or maps distinct kinds to identical resolved artwork
- **THEN** preflight refuses the publication before any selected medium renders
- **AND** neutral composition cannot bypass this contract or discard its catalog

#### Scenario: An occurrence attempts an independent icon override

- **WHEN** authored input supplies a per-occurrence icon or suppression value
- **THEN** the authoring contract refuses it rather than adding another mapping authority
- **AND** checked scene icons remain projections of the Edition catalog

#### Scenario: Source-owned primitives have no automatic type glyph

- **WHEN** selected artwork consists only of source-owned primitive figures
- **THEN** it requires no automatic glyph catalog and its artwork remains unchanged
- **AND** unused catalog entries remain valid when selected pages omit those types

#### Scenario: A source node has no declared kind

- **WHEN** an ordinary source node has a null kind
- **THEN** composition preserves that null source fact and uses the separate `source element` figure role
- **AND** that role requires its own catalog glyph in the node and Legend
- **AND** missing role coverage is refused without inventing a source kind or relation predicate

#### Scenario: Responsibility pages use the same type encoding

- **WHEN** a selected responsibility page paints ordinary source nodes
- **THEN** it uses the same catalog resolution and node glyph painter as other selected pages
- **AND** its Legend places each represented glyph before its kind label without count badges
- **AND** node labels reserve measured glyph clearance without changing source relationships

#### Scenario: Type labels exceed their measured space

- **WHEN** a node or Legend cannot contain its declared label and icon
- **THEN** native measured layout rejects the candidate rather than overlapping or hiding it

#### Scenario: Native type Legend activation

- **WHEN** a reader activates a represented type through its Legend
- **THEN** its measured pointer target covers the visible glyph and type label
- **AND** pointer, Enter and Space use the same native Lens selection toggle
- **AND** closing Lens preserves the selected kind
