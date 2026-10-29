## Purpose

Compose a model's views as graph-first pages in one fixed landscape format,
with the page, the figures and the text set together on one grid, and with
portable, deterministic SVG and PNG outputs.

## ADDED Requirements

### Requirement: Fixed presentation format

Every poster SHALL be 2400 × 1350 px, a 16:9 landscape page. The format SHALL
NOT depend on the content: a view that cannot be composed in it is refused,
never drawn on a longer, wider or narrower page.

#### Scenario: Every poster has one shape

- **WHEN** a model with a five-card view and a twelve-card view is built
- **THEN** every poster is 2400 × 1350 px

### Requirement: Pages of plates

A page SHALL carry one, two or three consecutive views that share no
component, each as a plate with its figure in a band of the page. On a page of
several views, each plate SHALL be headed by its view's title and question
where they differ from the model's; a page of one view SHALL set no plate
heading and lead with the model's question on the first page and with the
view's on a later page.

#### Scenario: Every view is printed once

- **WHEN** an edition is composed
- **THEN** its pages carry every planned view exactly once, in plan order

#### Scenario: Views that share a component

- **WHEN** two consecutive views share a component
- **THEN** they are printed on different pages

### Requirement: Bands of plates

A band SHALL hold one plate or several side by side, in reading order,
dividing its width in proportion to the width each figure needs at the densest
step.

#### Scenario: Two short plates beside a wide one

- **WHEN** a page carries three views whose figures do not fit one above another
- **THEN** a composition with two of them side by side in one band and the
  third in the other is among its candidates

### Requirement: Edition grouping

The publisher SHALL choose the grouping for the whole edition rather than page
by page, among groupings whose every page passes every gate, minimising first
the page count and then the total share of the live area in holes, so that a
view too sparse to fill a page alone shares one with its neighbour.

#### Scenario: A sparse view shares a page

- **WHEN** an edition ends with a view of three components that shares no
  component with the view before it, and a page of both passes every gate
- **THEN** that view shares a page with the view before it rather than
  printing as a band on a page of its own

### Requirement: Page grid

The page SHALL be set on one grid owned by the design tokens: an 8 px unit,
twelve columns between fixed margins, a 4 px baseline and a type scale whose
smallest size is 14 px. The head, the masthead's blocks, the rail and every
floating block SHALL start on a column line, and no line of text SHALL be
wider than 80 lowercase n set in its style.

#### Scenario: A summary keeps its measure

- **WHEN** a view has a summary of 300 characters
- **THEN** no summary line is wider than 80 lowercase n set in its style
- **AND** every line starts at the same column line

### Requirement: Page archetypes

The page SHALL use one of three archetypes: the masthead, with the text above
the plates in bands or side by side; the sidebar, with the text in a rail
beside them or in rails on both sides; and, for a page of one view, the corner
page, with the head, summary and legend set in the corners the figure leaves
free. A narrower rail gives a figure fewer columns and so a taller figure.

#### Scenario: A tall view

- **WHEN** a view's figure is taller than a masthead band
- **THEN** a sidebar composition is among its candidates

#### Scenario: A tree

- **WHEN** a single view's figure has one card in its top row and four in its
  bottom row
- **THEN** a corner composition is among its candidates

#### Scenario: Two narrow views

- **WHEN** a page carries two views whose figures are narrower than the page
- **THEN** a masthead composition with the two plates side by side is among
  its candidates

### Requirement: Masthead

The masthead SHALL set the title and question, the summary and the legend side
by side across the top, with the plates across all twelve columns below and the
notes along the foot. It SHALL split the twelve columns among them, and divide
the legend into one to three sub-columns, choosing the split whose band is
shallowest and then whose columns end most nearly level.

#### Scenario: A long legend beside a short title

- **WHEN** a masthead page's legend has twelve entries and its title one line
- **THEN** the legend is set in sub-columns so that it is no taller than the
  title and question beside it, or the summary if that is taller

### Requirement: Sidebar

The sidebar SHALL set the title, question, summary, legend and notes down a
rail of three, four or five left columns, or the title, question and summary
down three left columns and the legend and notes down three right columns.
Each stack SHALL be centred in the live height with gaps of at most one column
gap, and the plates SHALL take the full height between.

#### Scenario: A rail without an empty middle

- **WHEN** a sidebar page's text is shorter than the live height
- **THEN** its blocks stand at most one column gap apart and the stack is
  centred rather than set at the top

### Requirement: Corner page

A corner page SHALL give its one plate the full width, above the notes or down
to the foot of the live area. Its head, the title and question with the
summary beneath, SHALL start at the top-left corner of the live area, set
either beside the drawn figure or in a strip reserved above it; the legend,
and the notes when the page sets no footer, SHALL be set after the figure is
drawn. A figure that leaves no room for the head beside it SHALL NOT be a
candidate for the first form.

#### Scenario: Text beside a narrow root

- **WHEN** a tree's root row holds one card in the middle of the page
- **THEN** the title is set at the top-left beside it

#### Scenario: A reserved head

- **WHEN** a figure's first row leaves no room beside it for the head
- **THEN** a candidate sets the head and its summary in a strip above the
  figure

### Requirement: Corner placement

The legend of a corner page SHALL take the corner, position and width, from
two to five columns in one or two sub-columns, that leaves the page passing its
gates and then with the least area in holes and in the largest blank
rectangle, then the shortest blank band, then the smallest centroid offset.

#### Scenario: A strip beside a compact figure

- **WHEN** a compact figure leaves a strip two columns wide beside it
- **THEN** a legend set in that strip is among the placements

### Requirement: Floating notes

A corner page that sets no footer SHALL set its notes as one block, stacked or
side by side, in one of the page's bottom corners or along its foot, never above
the figure.

#### Scenario: Notes under a compact figure

- **WHEN** a corner page's figure leaves its lower left corner free
- **THEN** placing the notes there is among its candidates

### Requirement: Text clearance

Every floating block SHALL keep 40 px of paper from every card, wire, label and
other block and 24 px from the boundary frame, and none SHALL be set between a
figure's first and last tier label.

#### Scenario: No text over the figure

- **WHEN** a corner page is composed
- **THEN** no text block lies within 40 px of a card, wire or label

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

### Requirement: Header, legend and notes

Each poster SHALL lead with a title and question: the model's on the first
page; on a later page of one view, that view's, under the model's title when
the view has its own; on a later page of several views, the model's title
alone, each plate asking its own question. Each poster SHALL show one legend
of the kinds, the system boundary and the statuses present, and notes with the
scope, limits, repository and revision and attribution, and SHALL NOT state
whether sources were verified.

#### Scenario: Evidence stays off the poster

- **WHEN** a model declares source digests for every component
- **THEN** the poster's notes name the repository and its revision
- **AND** the poster prints no digest and no verification state

#### Scenario: A later page of one view

- **WHEN** the second page holds one view with its own title and question
- **THEN** it leads with them under the model's title

### Requirement: One summary per page

A page of one view SHALL set that view's summary, or the model's on the first
page when the view has none; a page of several views SHALL set the model's
summary only on the first page, and each plate SHALL set its view's summary
under its heading when it differs from the model's. The scope note SHALL carry
the model's scope only, so that no text is set twice on one page.

#### Scenario: The overview's summary is set once

- **WHEN** a page shows an overview whose summary is the model's
- **THEN** the summary appears once on the page and not again in its notes

#### Scenario: A later page without a view summary

- **WHEN** a later page holds one view that has no summary
- **THEN** the page sets no summary

### Requirement: Uncut text

No title, question, summary, legend entry or plate heading SHALL be cut to fit:
a width at which one does not fit is not used, and a model or view whose
title, question or summary no composition can set is refused with
`poster_title_too_long` or `poster_summary_too_long`.

#### Scenario: A summary too long for any column

- **WHEN** a model's summary needs more lines than a poster allows across the
  widest summary column
- **THEN** the build refuses with `poster_summary_too_long` and the line count

### Requirement: Candidate compositions

The publisher SHALL derive for each page a finite, ordered set of candidates:
an archetype with its rail and band arrangement, and for each plate a row
wrapping that splits a wide row into consecutive rows of one band, for rows
derived from relations also the flatter rows that draw a chain along one row, a
figure type step, and, when a page holds outside components, whether a row's
centre is taken over all its cards or only those inside the boundary.

#### Scenario: A wide tier wraps

- **WHEN** a view's only tier holds six cards
- **THEN** a candidate draws them as two rows of three in one band

#### Scenario: A chain runs along a row

- **WHEN** a view's derived rows put three single cards in three rows above a
  row of three
- **THEN** a candidate draws the three single cards along one row

### Requirement: Uncentred rows

When no candidate of a page passes every gate, or the best one crosses wires
or has a route defect, the publisher SHALL also lay the page's plates out with
uncentred rows and choose the page again from both.

#### Scenario: Centring would cross a skipping relation

- **WHEN** centring the rows makes a relation that skips a row turn across the
  wires of the row above its target
- **THEN** the page also measures the uncentred rows and draws the one that
  does not cross

### Requirement: Narrower wrappings

A plate SHALL offer every row wrapping it can draw, widest first. A page
candidate SHALL take a narrower wrapping at a type step only when every wider
one at that step leaves the page failing a gate or with more crossings or
route defects.

#### Scenario: A row that fits is not split

- **WHEN** a page candidate passes every gate with a view's rows of two, three
  and two cards at a step
- **THEN** that candidate does not split the row of three at that step

### Requirement: Whole-word card text

A wrapping whose card width would break a card label or detail inside a word,
path or identifier SHALL NOT be a candidate: card text breaks only at spaces.

#### Scenario: A long word in a narrow column

- **WHEN** a six-column wrapping leaves a card too narrow for the word
  `TransitionPlan`
- **THEN** that wrapping is not a candidate

#### Scenario: A long path in a detail

- **WHEN** a wrapping leaves a card's line narrower than its detail
  `refs/ethos/attestations-set`
- **THEN** that wrapping is not a candidate
- **AND** the drawn card sets the path whole on one line

### Requirement: Natural-height bands

Each plate's band SHALL be at least its figure's natural height at the densest
step, with the page's surplus shared in proportion to those heights. A
grouping whose figures need more height than the page has SHALL NOT be a
candidate.

#### Scenario: A twelve-card plate beside a five-card plate

- **WHEN** a page carries a tall plate and a short one
- **THEN** each plate's band is at least its figure's natural height

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

### Requirement: One step per page

Every plate of one page SHALL use one type step. Among a page's compositions
with equally few crossings and route defects, a larger step SHALL be tried
before a smaller one.

#### Scenario: Two plates share a size

- **WHEN** a page carries a plate that fits at 24 px and one that fits only at
  18 px
- **THEN** both plates are drawn at 18 px

### Requirement: Plate order

Each plate SHALL offer its compositions in order: the fewest crossings, then
the fewest route defects, then the largest type step, then the widest wrapping
with layered rows before flatter ones, then the figure whose ink lies nearest
its field's centre.

#### Scenario: The same choice every time

- **WHEN** the same view is composed twice
- **THEN** both posters are byte-identical

#### Scenario: Fewer crossings before larger type

- **WHEN** a plate draws at 24 px with a crossing and at 20 px without one
- **THEN** its 20 px composition comes first

### Requirement: Chosen page

The publisher SHALL choose each page among its candidates that pass every
gate: the fewest crossings, then the fewest route defects, then the fewest
bends, then the least area in holes and in the largest blank rectangle, then
the smallest centroid offset. Each candidate SHALL try its plates'
compositions in order of fewest wiring faults, then largest type step, and
keep the first with which the page passes every gate.

#### Scenario: A page without crossings

- **WHEN** two candidates of a page pass every gate and only one draws a
  crossing
- **THEN** the page draws the other

### Requirement: Recorded composition

The manifest SHALL record each page's views and composition: archetype, rail,
flank, reserved head strip, notes placement, band arrangement, centring and
tier-label arrangement, and each plate's view, type step, wrapping and row shape; and the page's
measures: crossings, route defects, bends, empty share and rectangle, blank
band, hole share and centroid. Every recorded page passes every gate.

#### Scenario: A page in the manifest

- **WHEN** an edition is built
- **THEN** its manifest records every page's composition and measures
- **AND** no recorded page misses a gate

### Requirement: Unbalanced views refused

An edition that no grouping prints on pages passing every gate SHALL be
refused with `poster_unbalanced`, naming each view that no passing page holds,
alone or with a neighbour, with every gate its closest page misses, the
measured value and the limit. A view that no page can lay out at any step or
wrapping SHALL be refused with `poster_unfittable` and its id. No output SHALL
be written.

#### Scenario: A model too sparse for a balanced page

- **WHEN** a model of two components and one relation is built
- **THEN** the build refuses with `poster_unbalanced`
- **AND** the problem for its view gives each missed gate's measured value and
  limit
- **AND** no output directory is created

### Requirement: Balance gate

A page SHALL pass when, over its live area, the largest rectangle no ink
touches covers at most 12 percent of it; no band 96 px or taller runs across
its whole width without text, cards, labels or glyphs; at most 40 percent of
it lies in holes, empty squares at least 240 px on a side; and its ink
centroid lies within 12 percent of the centre across and down.

#### Scenario: A blank band across the page

- **WHEN** text fills the live area except a band 304 px tall across its whole
  width, crossed only by one wire
- **THEN** the page fails the empty-share and blank-band gates

### Requirement: Balance measurement regions

Every balance measure SHALL be taken over the page's live area from every mark
the page prints, text included. A blank band SHALL count wires and rules as
blank, the empty rectangle and the holes SHALL count every mark, and the
centroid SHALL weight each mark by how dark it prints.

#### Scenario: A wire across a blank band

- **WHEN** only a wire crosses a 304 px band of the live area
- **THEN** the page measures a 304 px blank band
- **AND** the wire divides the largest blank rectangle

#### Scenario: Dark text weighs more than white cards

- **WHEN** text fills a quarter of the live area at its left and white cards
  the same area at its right
- **THEN** the centroid lies left of centre

### Requirement: Type floor

Every text SHALL use a size of the type scale, none smaller than 14 px; every
text block SHALL keep its measure and no card text SHALL break inside a word.
These hold by construction: a composition that would break one is never
drawn.

#### Scenario: Text floor

- **WHEN** any poster is built
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
those with status `retired` SHALL be drawn dotted and muted. The legend SHALL
explain each style present.

#### Scenario: A planned relation

- **WHEN** a relation has status `planned`
- **THEN** its wire is dashed and the legend explains the dashed style

### Requirement: Portable deterministic output

Each poster SHALL be written as SVG whose text is converted to glyph outlines
and whose icons are inline paths, and as PNG at 2400 and 6000 px wide rendered
from that SVG by the vendored renderer. The publisher SHALL NOT discover host
fonts. Building the same model with the same publisher version on one platform
SHALL reproduce identical bytes.

#### Scenario: Rendering without fonts

- **WHEN** a poster SVG is opened on a machine without the bundled fonts
- **THEN** it renders the same glyphs because it contains no font references

#### Scenario: Rebuild

- **WHEN** a model is built twice into two directories on one platform
- **THEN** every SVG and PNG in one equals the corresponding file in the other
