## Purpose

Lay out every view on one lattice of cards with orthogonal wires and labels in
the channels between rows, deterministically and measurably neat, for each
medium's own metrics.

## ADDED Requirements

### Requirement: Cards on one lattice

Cards SHALL stand on one lattice of equal slots chosen within the medium's
bounds. A medium that sizes cards by their text SHALL draw each card as wide as
its text within its slot and every card of one lattice column as wide as the
widest of them; otherwise every card SHALL fill its slot. Every card of a row
SHALL be as tall as the row's tallest content and share its top and bottom
edges, and card positions SHALL be whole or half columns of one pitch.

#### Scenario: Cards with different amounts of text

- **WHEN** one component has one detail line and another in its row has three
- **THEN** both cards have the height of the three-line card
- **AND** both cards share their top and bottom edges

#### Scenario: Rows of different heights

- **WHEN** one row's cards each have one detail line and another row's three
- **THEN** the first row is shorter than the second

#### Scenario: A centered parent

- **WHEN** one component calls two components placed in adjacent columns
- **THEN** it may sit on the half column between them

#### Scenario: Cards of one column on a poster

- **WHEN** a poster's lattice column holds a card with a short label above one
  with a long label
- **THEN** both cards take the long label's width
- **AND** a card with a short label in another column stays narrower

### Requirement: Column gaps for compact cards

When the cards are narrower than the field divides into, the column gap MAY
widen up to the medium's spread of the token gap. The placement SHALL weigh a
column count that narrows every card below the width the medium asks for
against the alignment it buys.

#### Scenario: Compact cards in a wide field

- **WHEN** three cards of 400 px share a 2000 px field
- **THEN** their column gaps are wider than the token gap and at most twice it

### Requirement: Deterministic optimal placement

Rows SHALL be placed by an exact search over row orders and lattice positions,
within a fixed state budget, that minimizes one fixed cost: crossings between
adjacent rows weigh most, then same-row relations without room for a straight
arrow; row centring where the medium asks for it, cards narrowed below their
text, bends, spare columns, off-centre bus hubs, half-column use and departures
from model order weigh less. The same model and medium SHALL always produce
the same positions.

#### Scenario: Straight wires are preferred

- **WHEN** a component's only caller sits in the row above and the medium does
  not centre rows
- **THEN** the component is placed directly below its caller when no crossing
  or collision results

#### Scenario: Repeated layout

- **WHEN** a view is laid out twice with the same metrics
- **THEN** both runs return identical positions, routes and label boxes

### Requirement: System boundary

When a view shows components of the described system together with
components whose kind category is `person` or `external`, the internal
components of every internal row SHALL occupy one shared column interval with
the others outside it, and the layout SHALL return one boundary rectangle
named after the repository, or after the model's title when it declares none.

#### Scenario: External clients below the system

- **WHEN** a view has three internal rows and a final row of external clients
- **THEN** one rectangle encloses the three internal rows
- **AND** no external card lies inside it

### Requirement: Unplaceable boundary

When no column interval can keep every outside component outside the
boundary, the layout SHALL be refused with the rows that mix inside and outside
components and the remedy of giving outside components their own tier.

#### Scenario: No column beside the boundary

- **WHEN** a tier holds three people and one service above a tier of four
  services
- **THEN** the view is refused with `layout_boundary_unplaced` and the first
  tier's members

### Requirement: Channel routing

Wires and relation labels SHALL lie in the channels between rows, or below a
view's only row, except straight arrows between neighbors of one row and the
corridor segments of relations that skip rows. A relation between adjacent
rows SHALL leave its source vertically, make at most one horizontal jog and
enter its target vertically. Ports on one card side SHALL keep the order of
their far ends, each as near its far end as the port spacing allows.

#### Scenario: A single jog

- **WHEN** a relation connects cards in adjacent rows and different columns
- **THEN** its wire has two bends inside the channel between those rows

#### Scenario: A wire straight across

- **WHEN** two cards in adjacent rows overlap across and each has one port
  facing the other
- **THEN** their wire runs as one vertical

### Requirement: Fewest crossings per channel

Each channel SHALL take the routing with the fewest crossings over every port
spacing and up to three label rows, then the lowest channel.

#### Scenario: Labels that do not fit side by side

- **WHEN** two relations travel into one card from the same side and their
  labels do not fit side by side in one label row without crossing
- **THEN** the channel takes a second label row and its wires do not cross

### Requirement: Turns clear of other cards

Among a channel's routings with equally few label rows, the publisher SHALL
count against a routing each vertical that turns in the band just under a card
of the row above, or just over a card of the row below, that is not its own
end, so that a turn on a label row is preferred where it crosses nothing; a
reader takes such a vertical for that card's wire.

#### Scenario: A target under another card

- **WHEN** a relation's target lies under another card of the row above and a
  label row holds its jog without a crossing
- **THEN** its wire turns on the label row, not just under that card

### Requirement: Route clearances

Each medium SHALL set a least distance between parallel wires of different
relations and between a relation label and another relation's wire, and the
channel routing SHALL keep them between tracks, jogs, corridors and ports
wherever the cards leave room. On posters the distances SHALL be at least
24 px and 16 px.

#### Scenario: Two jogs on one label row

- **WHEN** a poster channel sets two relations' jogs on one label row
- **THEN** they are at least 24 px apart

#### Scenario: A label between two verticals

- **WHEN** a poster channel sets a relation's label in a gap between two other
  relations' verticals
- **THEN** the label keeps at least 16 px from each

### Requirement: Buses, corridors and lanes

Relations sharing a source, label, details, status and target row SHALL form
one bus with one label, as SHALL relations sharing a target, label, details,
status and source row, unless the bus would pass another wire leaving its hub
on the same side. A relation that skips rows SHALL pass every row between
through a column gap, an empty cell or a lane beyond the outermost cards,
taking the free one that crosses the fewest wires and then runs shortest.

#### Scenario: A fan-out bus

- **WHEN** one component realizes four clients in the next row with the same
  label
- **THEN** one vertical leaves the component, one horizontal spans the four
  clients and one label names the relation once

#### Scenario: A relation skipping a row

- **WHEN** a relation connects the first and third rows
- **THEN** its wire passes the second row outside every card

#### Scenario: A lane around the figure

- **WHEN** every column gap and empty cell a relation that skips rows could
  pass would cross a wire
- **THEN** it runs in a lane beyond the outermost cards

### Requirement: Lanes beyond the cards

A medium that draws its own wires SHALL, when a layout crosses and has
relations that skip rows, lay the view out again with room for a lane beyond
the cards on each side, and keep the layout with fewer crossings. A lane SHALL
keep twice the least distance between parallel wires from the outermost cards
and the system boundary.

#### Scenario: A skipping relation that crosses

- **WHEN** a poster figure crosses a wire and holds a relation that skips rows
- **THEN** the figure is also laid out with a lane on each side
- **AND** the layout with fewer crossings is drawn

### Requirement: Measured neatness

Each laid-out view SHALL be measured for non-orthogonal segments, segments
shared by different relations, wires through cards, and label boxes that
overlap cards, other labels, other relations' wires or the system boundary's
edge. Any of these SHALL refuse that layout with the offending relation, card
or label. Crossings SHALL be minimized and reported, never refused, and drawn
only as perpendicular crossings away from bends and ports.

#### Scenario: A clean view

- **WHEN** the AIGW overview is laid out
- **THEN** its measurements report no shared segment, no wire through a card,
  no label collision and no crossing

#### Scenario: An unavoidable crossing

- **WHEN** three components in one row each call the same three components in
  the next row
- **THEN** the view is laid out with nine crossings, the minimum for two rows
- **AND** the measurements report that number without refusing

### Requirement: Route shape and route defects

A relation between adjacent rows SHALL have at most two bends, and one that
skips rows at most four. Each layout SHALL also count route defects a reader
misreads although no wire crosses: parallel wires of different relations
closer than 24 px, a wire stopping less than 48 px short of another in line
with it, two arrowheads closer than two arrowhead lengths and a relation label
within 16 px of another relation's wire. Route defects SHALL be reported, not
refused.

#### Scenario: A relation between adjacent rows

- **WHEN** a relation connects two adjacent rows
- **THEN** its wire has at most two bends

#### Scenario: Two wires close together

- **WHEN** two relations' verticals run 12 px apart along 100 px
- **THEN** the layout reports one route defect naming both relations
- **AND** the layout is not refused

### Requirement: Marks a reader joins

Two relations' jogs and labels on one label row of a poster, and the tracks of
one band, SHALL keep 48 px apart, or twice the step's wire separation when that
is more; closer, a reader continues one into the other and reads the row as
one labelled bus. A wire that stops less than 48 px short of another in line
with it SHALL count as a route defect. A corridor outside the system boundary
SHALL keep two wire separations from its edge.

#### Scenario: Two labels on one row

- **WHEN** two relations' labels share one label row of a channel
- **THEN** they stand at least 48 px apart

#### Scenario: A wire that stops short of another

- **WHEN** a wire stops 40 px short of another in line with it
- **THEN** the page's measures count a route defect

### Requirement: Wires a reader gives to the wrong card

A wire that turns less than 48 px beside a card it does not connect, within
that card's span, SHALL count as a route defect, and so SHALL two wires closer
than 40 px for more than 96 px. Each wrapping SHALL also be laid out with
channels that take more label rows so that no wire turns beside another card
than its own in a band, and a page that holds that taller figure SHALL take it
when it has no more route defects.

#### Scenario: A turn under another card

- **WHEN** a wire turns 30 px under a card it does not connect
- **THEN** the page's measures count a route defect

#### Scenario: Turns kept clear on a tie

- **WHEN** the self model's overview wires as many route defects with "loads"
  and "writes the page" turning just under LikeC4 importer and Publication as
  with them turning on a label row clear of both
- **THEN** the poster takes the label-row turns

#### Scenario: A turn moved onto a label row

- **WHEN** context-mode's retrieval poster can wire "builds snapshot" without
  turning under Event extractor by taking another track
- **THEN** the poster draws it that way and counts no route defect

### Requirement: Channels routed by their route defects

Each poster channel SHALL take, after the fewest crossings, the routing whose
own wires make the fewest route defects as the page measures them. A wire that
turns on a label row within the span of a card above or below that it does not
connect SHALL turn at least 48 px from that card.

#### Scenario: Two wires into one card from one side

- **WHEN** ETHOS's overview poster wires "selects proof" and "records proof"
  from two cards into Attestation set
- **THEN** the two wires turn on two label rows instead of adjacent tracks of
  one band
- **AND** the page's measures count no route defect

#### Scenario: A turn on a label row over another card

- **WHEN** a wire turns on a channel's only label row within the span of a card
  below that it does not connect
- **THEN** the turn stands at least 48 px above that card

### Requirement: Runs a reader joins across a wire

Two relations' horizontal runs in line, less than 400 px apart, with a third
relation's wire crossing their line between them, SHALL count as a route defect
unless both relations leave one card or both enter one, and so SHALL two
parallel wires of different relations less than 40 px apart that each turn
inside the other's length.

#### Scenario: Two runs on one row across a third wire

- **WHEN** two relations between four cards jog on one label row 150 px apart
  and a third relation's wire crosses the row between them
- **THEN** the page's measures count a route defect

#### Scenario: One card's fan in line

- **WHEN** two relations out of one card jog on one row in line, across a third
  relation's wire
- **THEN** the page's measures count no route defect for them

#### Scenario: Wires that hook past each other

- **WHEN** context-mode's retrieval poster can draw "queries events" and
  "builds snapshot" without one turning inside the other's length 24 px away
- **THEN** it draws them that way

### Requirement: Ports off another card's line

On posters, a card side's one port SHALL stand 40 px from its centre toward
where its wire goes when that centre lines up with the one port on the far side
of the card across the channel that the wire does not connect.

#### Scenario: A wire into the card under another

- **WHEN** ETHOS's intent poster wires "runs CLI" into OpenSpec CLI under Git,
  whose top port "reads refs" enters at the same centre
- **THEN** "runs CLI" enters OpenSpec CLI 40 px from that line

### Requirement: Layout bounds

A row SHALL hold at most six cards, or five when rows carry labels. A layout
with a wider row, or a channel without a clean routing, SHALL be refused with
the row or channel, its relations and a remedy naming more tiers or views;
each medium SHALL wrap a wider tier into consecutive rows before layout.

#### Scenario: A row that is too wide

- **WHEN** the layout is given a row of seven cards
- **THEN** it refuses that layout with the row's members and the six-card limit

#### Scenario: A tier of seven components

- **WHEN** a view declares a tier of seven components
- **THEN** each medium draws it as consecutive rows within its row limit
