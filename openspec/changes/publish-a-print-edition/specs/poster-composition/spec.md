## REMOVED Requirements

### Requirement: Fixed presentation format

**Reason**: Plates are composed for the print edition's body field, not for a 2400 × 1350 px poster.

**Migration**: See Plates.

### Requirement: Pages of plates

**Reason**: Each view is one plate on a page of its own.

**Migration**: See Plates.

### Requirement: Bands of plates

**Reason**: A page holds one plate.

**Migration**: See Plates.

### Requirement: Edition grouping

**Reason**: Views are not grouped; no delivery shared a page between views.

**Migration**: See Plates.

### Requirement: Page grid

**Reason**: The house class sets the page on its own grid.

**Migration**: See the print edition requirements in edition-delivery.

### Requirement: Page archetypes

**Reason**: Typst sets the page's text; the engine composes figures only.

**Migration**: See Plates and Plate drawing.

### Requirement: Masthead

**Reason**: The edition's head replaces the poster masthead.

**Migration**: See Edition page frame in edition-delivery.

### Requirement: Sidebar

**Reason**: The edition's head replaces the rail.

**Migration**: See Edition page frame in edition-delivery.

### Requirement: Tier labels beside a rail

**Reason**: Plates have no rail.

**Migration**: None.

### Requirement: Corner page

**Reason**: Plates have no floating head.

**Migration**: See Plates.

### Requirement: Corner placement

**Reason**: The key is one line above the foot.

**Migration**: See Edition page frame in edition-delivery.

### Requirement: Floating notes

**Reason**: Scope and limits are stated once, on the contents and colophon.

**Migration**: See Print edition in edition-delivery.

### Requirement: Text clearance

**Reason**: No text floats beside a figure.

**Migration**: None.

### Requirement: Header, legend and notes

**Reason**: The edition sets each plate's head and key.

**Migration**: See Edition page frame in edition-delivery.

### Requirement: One summary per page

**Reason**: The summary is set once, on the contents.

**Migration**: See Print edition in edition-delivery.

### Requirement: Uncut text

**Reason**: Typst sets titles and questions; the edition refuses a title wider than its line.

**Migration**: See Edition page frame in edition-delivery.

### Requirement: Candidate compositions

**Reason**: A plate's candidates are its wrappings, steps and centrings.

**Migration**: See Plate composition order.

### Requirement: Uncentred rows

**Reason**: Uncentred rows are always among a plate's candidates.

**Migration**: See Plate composition order.

### Requirement: Narrower wrappings

**Reason**: One order chooses among a plate's candidates.

**Migration**: See Plate composition order.

### Requirement: Natural-height bands

**Reason**: A plate is laid out for the whole body field.

**Migration**: See Plates.

### Requirement: One step per page

**Reason**: A page holds one plate.

**Migration**: None.

### Requirement: Plate order

**Reason**: One order chooses among a plate's candidates.

**Migration**: See Plate composition order.

### Requirement: Chosen page

**Reason**: One order chooses among a plate's candidates.

**Migration**: See Plate composition order.

### Requirement: Recorded composition

**Reason**: The manifest records plates.

**Migration**: See Recorded plates.

### Requirement: Recorded admission

**Reason**: Balance is recorded, not admitted.

**Migration**: See Recorded plates.

### Requirement: Sparse pages

**Reason**: Balance no longer refuses a plate.

**Migration**: See Balance gate.

### Requirement: Sparse pages that wire cleaner

**Reason**: Wiring faults come first in every choice.

**Migration**: See Plate composition order.

### Requirement: Draft pages

**Reason**: Balance no longer refuses a plate, so no plate is a draft.

**Migration**: See Balance gate.

### Requirement: Unadmitted editions refused

**Reason**: Only a view that cannot be laid out is refused.

**Migration**: See Unfittable views refused.

### Requirement: Portable deterministic output

**Reason**: Typst renders the edition and its images; figures carry live text.

**Migration**: See Plate drawing and Live figure text.

### Requirement: Bundled faces

**Reason**: Figure text is measured and set in the house faces.

**Migration**: See Faces of figure text.

## MODIFIED Requirements

### Requirement: The publisher's words

The words the publisher sets itself, the key's boundary and status entries, the
headings of the contents and colophon and the editor and source phrases, SHALL be
in the model's language, punctuated as that language punctuates details, lists
and sentences.

#### Scenario: Notes in the model's language

- **WHEN** a model written in Simplified Chinese declares a scope and limits
- **THEN** the edition heads them 范围 and 局限
- **AND** their sentences end with the ideographic full stop

### Requirement: Status styles

Relations and components with status `planned` SHALL be drawn dashed, and
those with status `retired` SHALL be drawn dotted and muted. The plate's key
SHALL explain each style present.

#### Scenario: A planned relation

- **WHEN** a relation has status `planned`
- **THEN** its wire is dashed and the key explains the dashed style

### Requirement: Type floor

Every figure text SHALL use a size of the type scale, none smaller than 14 px;
no card text SHALL break inside a word. These hold by construction: a
composition that would break one is never drawn.

#### Scenario: Text floor

- **WHEN** any plate is composed
- **THEN** every style it sets text in is a size of the type scale of at least
  14 px

### Requirement: Balance gate

A plate SHALL be measured over its body field: the share of the largest
rectangle no ink touches, the tallest band without text, cards, labels or
glyphs across the whole width, the share in holes, empty squares at least
240 px on a side, and its ink centroid. The manifest SHALL record each gate a
plate misses, with its value and limit: 12 percent, 96 px, 40 percent and 12
percent of the centre. A miss SHALL NOT refuse a plate.

#### Scenario: A blank band across the page

- **WHEN** text fills the body field except a band 304 px tall across its whole
  width, crossed only by one wire
- **THEN** the manifest records the plate missing the empty-share and
  blank-band gates
- **AND** the plate is delivered

### Requirement: Balance measurement regions

Every balance measure SHALL be taken over the plate's body field from every
mark the figure draws, text included. A blank band SHALL count wires as blank,
the empty rectangle and the holes SHALL count every mark, and the centroid
SHALL weight each mark by how dark it prints.

#### Scenario: A wire across a blank band

- **WHEN** only a wire crosses a 304 px band of the body field
- **THEN** the plate measures a 304 px blank band
- **AND** the wire divides the largest blank rectangle

#### Scenario: Dark text weighs more than white cards

- **WHEN** text fills a quarter of the body field at its left and white cards
  the same area at its right
- **THEN** the centroid lies left of centre

## ADDED Requirements

### Requirement: Plates

Each view SHALL be composed alone as one plate for the print edition's body
field, 2256 by 1071 px, set at two thirds of a point per pixel. A plate SHALL
hold the view's figure only.

#### Scenario: A plate fits the body

- **WHEN** a model's plates are composed
- **THEN** each plate is at most 2256 px wide and 1071 px high
- **AND** each view of the plan is one plate, in plan order

### Requirement: Plate candidates

A plate's candidates SHALL be every row wrapping its view can draw, at each
figure type step, with each row centred over all its cards, over only those
inside the boundary when its rows hold outside cards, and uncentred, and with
its tier labels in one column or before the edges their tiers start at.

#### Scenario: Uncentred rows are tried

- **WHEN** centring a view's rows makes a relation that skips a row cross a wire
- **THEN** the plate also tries the rows uncentred and draws the one that does
  not cross

### Requirement: Plate composition order

Among a plate's candidates the publisher SHALL choose the fewest crossings,
then the fewest route defects, then the largest type step, then the widest
wrapping, then layered rows before flatter ones, then the least of the body in
holes and in the largest blank rectangle.

#### Scenario: Fewer crossings before larger type

- **WHEN** a view crosses no wires at the smallest step and crosses one at a
  larger step
- **THEN** its plate is set at the smallest step

### Requirement: Recorded plates

The manifest SHALL record each plate's number, view, type step, wrapping,
row shape and centring; its measures: crossings, route defects, bends, empty
share and rectangle, blank band, hole share and centroid; and each balance gate
it misses.

#### Scenario: A plate in the manifest

- **WHEN** an edition is built
- **THEN** its manifest records every plate's composition and measures

### Requirement: Unfittable views refused

A view that no wrapping lays out in the body field at the smallest step SHALL be
refused with `plate_unfittable` and its id, and the build SHALL write nothing.

#### Scenario: A view too large for the body

- **WHEN** a view's cards cannot be laid out in the body field at 18/14/14 px
- **THEN** the build refuses with `plate_unfittable` naming the view

### Requirement: Plate drawing

The engine SHALL draw a plate as an SVG of its shapes, with its icons as inline
paths and no text, paper, head, key or notes, and SHALL report its text as runs:
each run's text, position, size, weight, colour and the width it measured, and
the component whose title it is.

#### Scenario: Shapes without text

- **WHEN** a plate is drawn
- **THEN** its SVG holds no text and no glyph outlines
- **AND** every card label, detail and relation label is one of its runs

### Requirement: Faces of figure text

Figure text SHALL be measured in the house faces, each run in the first face of
its weight's chain that draws it whole: Source Sans 3, then Noto Sans CJK SC. A
text in a right-to-left or shaped script, or with a character no face draws,
SHALL be refused.

#### Scenario: Letters the CJK face lacks

- **WHEN** a component label is `Łódź`
- **THEN** the label is measured in Source Sans 3 and the build is not refused

#### Scenario: An Arabic title

- **WHEN** a model's title is written in Arabic
- **THEN** the build refuses with `glyphs_missing` and the problem
  `script_unsupported` at `/title`

### Requirement: Live figure text

The print edition SHALL set every run of a plate as text in the house faces at
the engine's position and size, over the plate's shapes, ragged on the engine's
lines. A run that Typst sets wider than the engine measured SHALL be refused with
`edition_text_wider`.

#### Scenario: Searchable figure text

- **WHEN** the print edition of a model is built
- **THEN** every card label of its plates can be extracted as text from its page
