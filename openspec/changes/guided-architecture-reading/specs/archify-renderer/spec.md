## ADDED Requirements

### Requirement: Typed Inspect reading

Publisher SHALL group selected Inspect records by their validated reference
kind, preserve every exact field and distinguish source declarations from
editorial statements. Structured values MAY expose their original key/value
hierarchy, but SHALL retain their exact original text and SHALL NOT infer domain
meaning or acceptance. Native graph exploration SHALL remain native-owned.

#### Scenario: One graphic carries several declaration kinds

- **WHEN** a selected graphic binds entities, relationships, Claims or editorial statements
- **THEN** Inspect groups them by reference kind rather than title or paint
- **AND** every record remains available with its original fields and attribution

#### Scenario: A selected field contains structured data

- **WHEN** a field is presented as a canonical JSON object or array
- **THEN** Inspect preserves its keys, scalar types and nested relationships
- **AND** its original value remains available verbatim without truncation
- **AND** a noncanonical or structurally large value remains exact text

#### Scenario: Initial reading does not expand an entire data tree

- **WHEN** the selected record contains a canonical object or array
- **THEN** its structured value starts in a native collapsed disclosure
- **AND** expanding it preserves every key, scalar type and exact original value
- **AND** plain fields remain readable without expanding unrelated data

#### Scenario: A reader returns to the diagram

- **WHEN** the reader closes Inspect after expanding a record or value
- **THEN** the selected diagram and native exploration remain available
- **AND** reading changes neither source bytes nor acceptance state

#### Scenario: Nested values retain readable internal alignment

- **WHEN** complete records and nested values are expanded on a desktop
- **THEN** bounded label columns align peer fields and preserve readable value width
- **AND** nesting adds a small consistent indent rather than recursive fractional columns
- **AND** intrinsic record heights preserve every exact value without upstream formatting

#### Scenario: Inspect presents a coherent desktop reading frame

- **WHEN** a reader searches or selects an occurrence in Inspect
- **THEN** the search and reading controls share one row and both content panes share their top and bottom edges
- **AND** one consistent subject list marks the current selection and owns its scrolling
- **AND** an empty search field explains its purpose and unmatched input presents an explicit empty state
- **AND** selection starts the complete detail at its beginning and retains exact source identity separately from meaning

#### Scenario: Selection remains distinguishable while browsing

- **WHEN** the reader opens an occurrence or hovers another directory row
- **THEN** the selected occurrence has one explicit persistent heading
- **AND** its directory row is brought into view when opened
- **AND** hover differs from current selection without changing its binding

#### Scenario: A graphic represents several source declarations

- **WHEN** the selected graphic has existing native display context and several records of one kind
- **THEN** Inspect presents that exact context as diagram text, not a source-derived summary
- **AND** a visible Diagram text heading separates display wording from typed source declarations
- **AND** the multi-record section starts as an equal-weight outline, independent of which record appears first
- **AND** every record, original field and attribution remains available through native disclosures

#### Scenario: A section has one declaration

- **WHEN** a reference-kind section contains exactly one record
- **THEN** that record opens directly without granting semantic primacy over other kinds
- **AND** all record headings and expanded fields share one intrinsic document grid
- **AND** fine rules separate records without repeated enclosing card borders
- **AND** source identity follows those document rules without another enclosing card
- **AND** section headings follow the selected object heading without skipped levels
- **AND** search and selected-object controls remain aligned above both content panes

#### Scenario: A statement has a declared reading title

- **WHEN** a text or note occurrence has a selected declaration title and complete statement
- **THEN** the subject index uses that title rather than repeating the entire statement
- **AND** the complete statement remains unchanged in the selected detail and graphic
- **AND** all subject rows derive their height from complete text before admitting pointer targets

#### Scenario: Concise navigation retains complete search content

- **WHEN** a reader searches for a stable occurrence identity, declaration title or exact field content
- **THEN** the bound occurrence remains discoverable even when its navigation title omits that text
- **AND** selection exposes the unchanged complete declaration rather than a synthesized search summary

### Requirement: Independent qualified interactive appearance

The Edition MAY select interactive appearance independently of source meaning,
composition and reading. Publisher SHALL provide several qualified styles
through the same reader and SHALL reject unsupported selections. Runtime
switches SHALL preserve content, fonts, geometry and semantic distinctions.

#### Scenario: An editor selects a different initial appearance

- **WHEN** the same selected Edition chooses an admitted style and theme
- **THEN** the reader applies that appearance to its shell and diagram
- **AND** no source assertion, relation, coverage or static geometry changes

#### Scenario: A reader changes style while inspecting a page

- **WHEN** the reader chooses another qualified style or theme
- **THEN** selected page and required content remain available without clipping
- **AND** the session choice changes neither input nor acceptance records

#### Scenario: An unknown style or executable customization is requested

- **WHEN** appearance contains an unsupported style or executable content
- **THEN** preparation fails without substituting a different appearance

### Requirement: Source-bound native exploration

Publisher SHALL retain useful selected-renderer exploration and bind it to
checked visible source members. Physical segments, drawing junctions and
editorial links SHALL NOT create source entities or relations. Complete figures
SHALL remain usable without mandatory playback.

#### Scenario: An Edition selects complete figures

- **WHEN** the editor selects complete figures without timed playback
- **THEN** every declared view remains usable through ordinary navigation
- **AND** no empty guide or mandatory playback is added

#### Scenario: Native exploration selects checked content

- **WHEN** a renderer offers focus and directed relationship exploration
- **THEN** the same public build binds those actions to its checked logical members
- **AND** the native reader owns camera, layout and interaction lifecycle

#### Scenario: A query selects absent or omitted content

- **WHEN** a query selects an unknown or omitted member
- **THEN** the reader refuses it rather than inferring content from geometry

#### Scenario: Reading order has no source relation

- **WHEN** an editorial sequence places unrelated members next to one another
- **THEN** the native query graph contains no invented connection between them
- **AND** reading order is not described as execution or causality

#### Scenario: One meaning has several graphic occurrences

- **WHEN** aggregation or repeated occurrences do not preserve exact query endpoints
- **THEN** the public build preserves every occurrence and its exact Inspect declarations
- **AND** native source reading queries selected source endpoints rather than figure endpoints
- **AND** disconnected source members never become a path through a collapsed figure
- **AND** raw native-mode rendering refuses incomplete exploration before emitting output

#### Scenario: A figure contains unbound painted decoration

- **WHEN** geometry-only text or shapes carry paint identity but no checked Inspect binding
- **THEN** they remain visible without source coverage, queries or Inspect actions
- **AND** semantic Inspect carriers remain exactly equal to their declared binding set
- **AND** extra or missing semantic carriers are rejected rather than ignored

#### Scenario: Several source relations share physical segments

- **WHEN** distinct checked relations use one shared drawn route
- **THEN** native exploration retains each logical identity and its actual endpoints
- **AND** shared strokes are not counted as extra logical hops or painted repeatedly

### Requirement: Reader notes preserve exact semantic occurrence ownership

Authored HTML MAY carry ordered plain-data note cards through the native
renderer. Bound items SHALL use existing statement, coverage, provenance and
Inspect contracts; unbound prose SHALL grant no semantic coverage. Notes SHALL
NOT replace complete diagrams, direct relationships or required routes.

#### Scenario: An editor moves long statements out of diagram geometry

- **WHEN** a note item has a unique stable identity and a selected statement reference
- **THEN** its exact text is visible in the native reader card
- **AND** existing coverage and Inspect bind that occurrence to its source or Edition
- **AND** keyboard inspection restores focus to the same item

#### Scenario: A note has no selected semantic reference

- **WHEN** a title or item is ordinary explanatory prose
- **THEN** it remains visible without source coverage, graph membership or Inspect authority
- **AND** duplicate, absent, unknown or incompatible identities and bindings are refused

#### Scenario: A reader selects diagram-only presentation or export

- **WHEN** native presentation or SVG/raster export omits HTML note cards
- **THEN** the reader declares diagram-only scope without claiming full note coverage
- **AND** ordinary HTML retains every selected statement and complete diagram

### Requirement: Measured node fields preserve desktop readability

Ordinary authored node fields with a declared text floor SHALL use one private
selected-font multiline layout for painting and ink clearance. Exact label,
detail and note strings SHALL remain unchanged. Automatic composition SHALL
derive geometry from complete measured footprints; explicit literal composition
SHALL preserve supplied geometry. An infeasible fit SHALL fail before delivery.

#### Scenario: Complete automatic fields cannot fit readably

- **WHEN** no measured candidate fits all exact fields at the declared floor
- **THEN** building fails with the affected occurrence and measured constraint
- **AND** it never clips, shortens, omits or shrinks text below the floor

#### Scenario: Automatic peers carry different text lengths

- **WHEN** complete ordinary occurrences use automatic composition
- **THEN** every text row shares its measured left ink rail clear of the type glyph
- **AND** peer title rows start on one baseline independent of their content height
- **AND** distinct fields and attributed statements retain a consistent block separator
- **AND** word-boundary line breaking minimizes line count before balancing line lengths
- **AND** standalone separators stay with the preceding phrase where its measured width permits
- **AND** exact text bytes, grapheme boundaries, font floors and paint clearance remain unchanged

#### Scenario: Compact candidates retain fitting indivisible words

- **WHEN** an intrinsic node has a compact preferred width and an indivisible word fits within the measured width limit
- **THEN** the node's minimum width includes the word, type-glyph rail and ink clearance
- **AND** the internal composition search cannot split that word merely to obtain a compact candidate
- **AND** a token exceeding the measured limit retains the existing grapheme-safe fallback without truncation

#### Scenario: An invalid compact alternative does not erase a valid complete candidate

- **WHEN** one intrinsic sizing alternative fails final literal-paint validation
- **THEN** that alternative remains unqualified and the bounded search continues
- **AND** a previously validated complete candidate remains eligible for selection
- **AND** every emitted scene passes the unchanged final geometry checks

#### Scenario: A dense fixed node has sufficient multiline capacity

- **WHEN** selected fonts fit every field at the declared desktop floor
- **THEN** derived rows retain all text within the node and clear its type glyph
- **AND** native metadata retains the original field strings
- **AND** non-wide diagrams retain the existing conservative width budget

#### Scenario: A fixed node cannot contain its fields

- **WHEN** measured ink or glyph clearance exceeds the authored fixed geometry
- **THEN** building fails with an actionable node diagnostic and no partial delivery
- **AND** the input, minimum text floor and selected fonts remain unchanged

#### Scenario: Complete prose contains hard breaks and tabs

- **WHEN** an automatic text occurrence contains LF, CRLF, CR or tabs
- **THEN** internal rows retain contiguous UTF-16 source ranges and the complete original string
- **AND** hard breaks reserve a new logical row; blank rows reserve height without painted ink
- **AND** each tab paints as four spaces while its original byte remains in source metadata
- **AND** soft wrapping remains grapheme-safe and never joins separate logical lines
- **AND** only nonblank single-line paint requests reach the unchanged font measurer
- **AND** the existing work, font floor, ownership and clearance bounds still fail closed
