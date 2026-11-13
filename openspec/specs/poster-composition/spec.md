# poster-composition Specification

## Purpose

Compose a model's views as graph-first pages in one fixed landscape format,
with the page, the figures and the text set together on one grid, and with
portable, deterministic SVG and PNG outputs.

## Requirements

### Requirement: Tier labels

The numbered tier labels of a figure SHALL stand in one column before it, at
one left edge, each centred on its tier's first row: one gap before the
leftmost card a label names, outside the system boundary for a tier the
boundary encloses. A tier SHALL be named by its label alone, with no rule
under its rows. When no page with the labels in one column passes every gate,
the labels of tiers that start at one edge SHALL share one column before it.

#### Scenario: Tiers that start at different columns

- **WHEN** a view's tiers start at different lattice columns
- **THEN** their numbered labels share one left edge before the figure

#### Scenario: Tiers that start far apart

- **WHEN** the Big Bank tiered view's data tier starts at the mainframe, far
  left of the boundary its front and back ends start at, and no page with one
  label column passes every gate
- **THEN** the front-end and back-end labels share one column before the
  boundary
- **AND** the page passes every gate

### Requirement: Tier brackets

The label of a tier that wraps into several rows SHALL stand level with the
first of them, beside a bracket that spans them all from the first row's top to
the last row's bottom, so that it reads as naming those rows and not as a
relation label between them.

#### Scenario: A tier wrapped into two rows

- **WHEN** the first tier of the AIGW authority view wraps into two rows
- **THEN** its label stands level with the first row, beside one bracket that
  spans both rows

### Requirement: Tier-label column

When a tier label or its bracket before the figure would touch a card, a wire,
a relation label or the boundary, every label SHALL stand in the plate's
tier-label column
instead, as wide as the widest label at the largest tier size plus its marker
and never wider than 280 px.

#### Scenario: Short tier labels

- **WHEN** every tier label of a view is one short word
- **THEN** the label column is narrower than 280 px

### Requirement: Graph-first content

Cards SHALL show their category color, kind icon, label and details;
relations SHALL show their label and details on their wire, once per bus.
Posters SHALL NOT print claim records, digest lists, status tables or reading
indexes.

#### Scenario: A component with details

- **WHEN** a component declares `owns: account tokens`
- **THEN** its card shows its icon, its label and that detail

### Requirement: The publisher's words

The words the publisher sets itself, the key's boundary and status entries, the
headings of the contents and colophon and the editor and source phrases, SHALL be
in the model's language, punctuated as that language punctuates details, lists
and sentences.

#### Scenario: Notes in the model's language

- **WHEN** a model written in Simplified Chinese declares a scope and limits
- **THEN** the edition heads them 范围 and 局限
- **AND** their sentences end with the ideographic full stop

### Requirement: Whole-word card text

A wrapping whose card width would break a card label or detail inside a word,
path or identifier SHALL NOT be a candidate. Text written with spaces breaks
only at them; Han and Kana text, written without them, breaks between its
characters, except that a closing mark stays with the character before it and
an opening mark with the one after. The rules read the characters alone, so a
text breaks the same way on every host.

#### Scenario: A long word in a narrow column

- **WHEN** a six-column wrapping leaves a card too narrow for the word
  `TransitionPlan`
- **THEN** that wrapping is not a candidate

#### Scenario: A long path in a detail

- **WHEN** a wrapping leaves a card's line narrower than its detail
  `refs/ethos/attestations-set`
- **THEN** that wrapping is not a candidate
- **AND** the drawn card sets the path whole on one line

#### Scenario: A Chinese label in a narrow column

- **WHEN** a card's label is 订单数据库，主库 and its column holds three of its
  characters
- **THEN** the label wraps between characters
- **AND** no line begins with the comma

### Requirement: Cards as large as their text

A card SHALL be as wide as its label and its longest detail need on one line,
within card measures of 16 ems for a label and 24 ems for a detail, and as
wide as the widest card in its lattice column, and no wider; a field too
narrow for that width narrows the cards and their text wraps.

#### Scenario: A short card in a row of tall ones

- **WHEN** a row holds a card with one detail line beside a card with five
- **THEN** both cards share the row's height and the short card's spare height
  lies below its text

#### Scenario: Cards of one column

- **WHEN** one lattice column holds a card with a short label above a card
  with a long one
- **THEN** both cards take the longer card's width

### Requirement: No stretched cards

Every card of a row SHALL be as tall as the row's tallest text, with its label
first and its details directly beneath. A card SHALL NOT grow to fill its band:
a figure shorter than its band deepens its channels within their token bound
and is centred in the rest.

#### Scenario: A sparse view keeps compact cards

- **WHEN** a view of two rows of three cards is composed on a page of its own
- **THEN** no card is taller than its row's tallest text needs

### Requirement: Ink-centred figure

A drawn figure SHALL move across its plate, its field and any tier-label
column, without leaving it, until the centroid of its ink, tier labels
included, lies within 2.5 percent of the plate's width from its centre line;
when its tier labels would then touch the figure, it SHALL be centred so within
its field alone. A figure already within that distance keeps its outline
centred.

#### Scenario: Single cards off the middle of a wide row

- **WHEN** a figure's one-card rows sit half a column right of its two-card
  rows
- **THEN** the figure moves left until its ink is near the centre line

### Requirement: Figure containment

No card, wire, relation label or tier label SHALL be drawn outside its plate:
its field and, for a figure with tier labels, the label column beside it. A
long relation SHALL run in a corridor or lane inside the figure's content
width; a candidate in which it has none is not composed.

#### Scenario: A corridor past the last column

- **WHEN** the only free gap for a long relation lies past the figure's last
  used column, outside its field
- **THEN** that candidate is rejected and the relation never runs off the page

### Requirement: Figure type steps

The figure SHALL be set in one of five steps of card label, detail and
relation-label sizes: 18/14/14, 20/16/16, 24/18/18, 28/20/20 and 32/24/24 px. A
step SHALL scale the cards' padding, icons, gaps and wires with its text. No
size SHALL exceed 1.8 times its size at the densest step, and every card label
SHALL be smaller than the view heading.

#### Scenario: A sparse view is set large

- **WHEN** a view of seven components has a page of its own
- **THEN** its figure uses the 28 or 32 px step that fits its field

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

### Requirement: Type floor

Every figure text SHALL use a size of the type scale, none smaller than 14 px;
no card text SHALL break inside a word. These hold by construction: a
composition that would break one is never drawn.

#### Scenario: Text floor

- **WHEN** any plate is composed
- **THEN** every style it sets text in is a size of the type scale of at least
  14 px

### Requirement: Route shape

Every relation on a poster SHALL have at most two bends, or four when it skips
rows, and no wire SHALL cross a card or a label. Crossings, route defects and
bends SHALL be recorded in the page's measures and SHALL NOT refuse a page.

#### Scenario: A route between adjacent rows

- **WHEN** a relation connects adjacent rows
- **THEN** its wire has at most two bends

#### Scenario: A drawn crossing is recorded

- **WHEN** a page that passes every gate draws a crossing
- **THEN** the build delivers it and its manifest entry records the crossing

### Requirement: Status styles

Relations and components with status `planned` SHALL be drawn dashed, and
those with status `retired` SHALL be drawn dotted and muted. The plate's key
SHALL explain each style present.

#### Scenario: A planned relation

- **WHEN** a relation has status `planned`
- **THEN** its wire is dashed and the key explains the dashed style

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

### Requirement: Plate width

A plate's figure SHALL take the narrowest of 100, 80 and 65 percent of the
body's width at which its chosen composition has no more crossings and route
defects than at the full width. A view without a summary SHALL take a narrower
share only when one of its components claims files, its figure at the full
width spans no more than that share, and it keeps its type step there.

#### Scenario: A narrow view

- **WHEN** a view's figure spans 47 percent of the body at its largest step
  and keeps its step and wiring at 65 percent
- **THEN** its plate's figure takes 65 percent of the body's width

#### Scenario: A wide view without a summary

- **WHEN** a view without a summary spans the whole body
- **THEN** its plate's figure keeps the full width

### Requirement: Room for a view's summary

A view with a summary SHALL give up at least a fifth of the body's width: its
figure SHALL take 80 percent, at the type step that width allows, or 65 percent
when that keeps its step at 80 percent. When 80 percent adds crossings or route
defects, its figure SHALL keep the full width and its reading SHALL be left out.

#### Scenario: A wide view with a summary

- **WHEN** a view with a summary spans the whole body and keeps its wiring at
  80 percent
- **THEN** its plate's figure takes 80 percent of the body's width

### Requirement: Recorded plates

The manifest SHALL record each plate's number, view, figure width, whether its
reading was set or left out, type step, wrapping, row shape and centring; its measures: crossings, route defects, bends, empty
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

The engine SHALL draw a plate as an SVG of its shapes, with any icons as inline
paths and no text, paper, head, key or notes, and SHALL report its text as runs:
each run's text, position, size, weight, colour and the width it measured, and
the component whose title it is. Its colours SHALL come from the edition's
resolved palette only, and on a strip plate relation labels SHALL be set in
the regular weight, so they read under the parts they join.

#### Scenario: Shapes without text

- **WHEN** a plate is drawn
- **THEN** its SVG holds no text and no glyph outlines
- **AND** every card label, detail and relation label is one of its runs

### Requirement: Faces of figure text

Figure text SHALL be measured in the house faces, each run in the first face of
its weight's chain that draws it whole: Source Sans 3, then Noto Sans CJK SC.
Each house face SHALL be measured with the pair kerning of its own `kern`
feature, so a run of letters is as wide as Typst sets it. A text in a
right-to-left or shaped script, or with a character no face draws, SHALL be
refused.

#### Scenario: Letters the CJK face lacks

- **WHEN** a component label is `Łódź`
- **THEN** the label is measured in Source Sans 3 and the build is not refused

#### Scenario: An Arabic title

- **WHEN** a model's title is written in Arabic
- **THEN** the build refuses with `glyphs_missing` and the problem
  `script_unsupported` at `/title`

#### Scenario: Pairs kerned apart

- **WHEN** a part's detail reads `format: (json)`
- **THEN** its run is measured as wide as Typst sets it, with the bracket and
  the j apart, and the build is not refused

### Requirement: Live figure text

The print edition SHALL set every run of a plate as text in the house faces at
the engine's position and size, over the plate's shapes, ragged on the engine's
lines. A run that Typst sets wider than the engine measured SHALL be refused with
`edition_text_wider`.

#### Scenario: Searchable figure text

- **WHEN** the print edition of a model is built
- **THEN** every card label of its plates can be extracted as text from its page

### Requirement: Strips sized by their code

With `strip` marks, each part SHALL be drawn as its label, a strip and a
caption. The strip's length SHALL be proportional to the part's bytes on one
scale for the whole edition, at least 2 px for a part with any bytes; every
strip has one thickness. Each owned file is one segment in path order, as wide
as its share of the strip, in the dye of its age band. A part that owns no files
SHALL be a short dashed outline. The key SHALL show a scale bar.

#### Scenario: Shares of a strip

- **WHEN** a part owns two files of 3 KB and 1 KB
- **THEN** its strip has two segments of three quarters and one quarter of its
  length

#### Scenario: One scale

- **WHEN** one part owns 200 KB and another 20 KB in the same edition
- **THEN** the first strip is ten times as long as the second, on every plate

### Requirement: Strips keep to their boxes

A strip SHALL never be shortened to fit a column: no column of a view is
narrower than its longest strip. When a view cannot hold the edition's strips,
the edition SHALL draw every strip shorter, 360 px and then 240 px for its
largest part, on one scale still, and plan its views again.

#### Scenario: A strip keeps to its box

- **WHEN** a view's columns would be narrower than its longest strip
- **THEN** that layout is refused and the plate tries another wrapping, so no
  strip runs past its box or the boundary

#### Scenario: A shorter scale for the edition

- **WHEN** a view cannot be laid out with strips of 360 px for the largest part
- **THEN** every plate of the edition draws its strips at 240 px for the largest
  part, and each key's sample strip shows that scale

### Requirement: Age bands

Every edition SHALL divide its cited files into three age bands counted back
from the pin's commit: changed within a week, within three months, and earlier.
A file's age SHALL be the pin's commit time minus that of its last change at or
before the pin. The key SHALL name the bands and the pin's date.

#### Scenario: Recent and older files

- **WHEN** an edition's files changed one, thirty and four hundred days before
  the pin
- **THEN** the three files fall in three different bands, the same bands every
  edition uses

### Requirement: Citation ticks and the hub

With `strip` marks, every relation's line SHALL be drawn at one weight with one
tick across it near its source for each file the relation cites, up to five
ticks and the count written beside more. The part with the most incoming
relations of a view, when it has at least three and more than any other part,
SHALL be the hub, and the relations into it SHALL be drawn in the oldest dye.

#### Scenario: A hub and its citations

- **WHEN** four relations of a view end at the supplies and one of them cites two
  files
- **THEN** those four lines are in the oldest dye, that line carries two ticks,
  and the key names the supplies

### Requirement: Marks keep the gates

A plate with either marks SHALL pass the same containment, balance, type floor,
whole-word text and routing gates, and a view neither marks can fit SHALL be
refused as before.

#### Scenario: The same view with both marks

- **WHEN** one view is composed with `card` and with `strip` marks
- **THEN** both plates pass every gate or the view is refused with the gate's reason

### Requirement: Runs of details without word spaces

In an edition whose language is written without spaces between words, the run
of each line of a part's details SHALL report the width Typst sets the line in,
and the run of a line to be spread SHALL also name its measure. A strip part's
counts SHALL report that width too and SHALL end at their box's edge.

#### Scenario: A line to be spread

- **WHEN** a plate of a language written without spaces between words holds a
  detail line, not its detail's last, whose slack is no more than a tenth of an
  em for each place it opens
- **THEN** that line's run names the measure, and the part's text block is
  measured at it

#### Scenario: A detail's last line

- **WHEN** a plate of a language written without spaces between words holds a
  detail's last line of Han and letters
- **THEN** its run names no measure and reports the width Typst sets it in,
  narrower than the CJK face alone measures it

#### Scenario: A strip part's counts

- **WHEN** a Chinese strip plate sets a part's counts
- **THEN** they end at the box's edge, and their run reports the width Typst
  sets them in
