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

#### Scenario: An unrelated iframe message arrives

- **WHEN** a message has the wrong sender or page
- **THEN** it cannot navigate, inspect or change the selected reading state

### Requirement: Native capability admission follows semantic support

The reader SHALL preserve source-bound graphic occurrences for native Finder,
focus, Lens, viewport navigation and presentation. Relationship traversal SHALL
require complete, unambiguous logical membership. Occurrence counts SHALL NOT
claim source-entity counts, and unavailable relationship counts SHALL NOT appear
as zero. Inspect retains the selected source facts without creating a second graph.

#### Scenario: A figure groups or repeats source members

- **WHEN** complete logical relationship membership cannot be admitted
- **THEN** native Finder and Lens still read uniquely identified graphic occurrences
- **AND** Path and Reach refuse queries without claiming that no source path exists
- **AND** Passport and Guide state the limitation without invented relationship counts

#### Scenario: Exact logical graph membership is admitted

- **WHEN** source nodes and relationships have complete unambiguous graphic bindings
- **THEN** native Path, Reach, Lens and relationship inspection consume those bindings
- **AND** shared physical segments never become extra logical edges

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

#### Scenario: Mixed source membership has an explicit reader role

- **WHEN** an authored figure binds several source kinds and declares its figure kind
- **THEN** native reading uses that declared architecture role
- **AND** Inspect retains every bound entity and its original source kind
- **AND** no repeated aggregate footer is inserted into the diagram

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
