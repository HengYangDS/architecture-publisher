## Purpose

Lay out every view on one grid of equal cards with orthogonal wires and labels
in the channels between rows, deterministically and measurably neat, for each
medium's own metrics.

## ADDED Requirements

### Requirement: Equal cards on one lattice

Every card of a view SHALL have the same width and height. The width SHALL be
the one the composition chose within the medium's bounds, and the height SHALL
fit the tallest card content at that width. Card positions SHALL be whole or half columns of one pitch, and every
card of a row SHALL share one top edge.

#### Scenario: Cards with different amounts of text

- **WHEN** one component has one detail line and another has three
- **THEN** both cards have the height of the three-line card
- **AND** both cards in a row share their top and bottom edges

#### Scenario: A centered parent

- **WHEN** one component calls two components placed in adjacent columns
- **THEN** it may sit on the half column between them

### Requirement: Deterministic optimal placement

Rows SHALL be placed by an exact search over row orders and lattice positions
that minimizes one fixed cost: crossings between adjacent rows weigh most,
then bends, off-center bus hubs, room for same-row arrows, row centering,
half-column use and departures from model order. The same model and medium
SHALL always produce the same positions.

#### Scenario: Straight wires are preferred

- **WHEN** a component's only caller sits in the row above
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
named after the repository.

#### Scenario: External clients below the system

- **WHEN** a view has three internal rows and a final row of external clients
- **THEN** one rectangle encloses the three internal rows
- **AND** no external card lies inside it

### Requirement: Unplaceable boundary

When no column interval can keep every outside component outside the
boundary, the view SHALL be refused with the rows that mix inside and outside
components and the remedy of giving outside components their own tier.

#### Scenario: No column beside the boundary

- **WHEN** a tier holds three people and one service above a tier of four
  services
- **THEN** the view is refused with `layout_boundary_unplaced` and the first
  tier's members

### Requirement: Channel routing

Wires and relation labels SHALL lie in the channels between rows, except
straight arrows between neighbors of one row and corridor segments of
relations that skip rows. A relation between adjacent rows SHALL leave its
source vertically, make at most one horizontal jog and enter its target
vertically. Ports on one card side SHALL be spread symmetrically in the order
of their far ends.

#### Scenario: A single jog

- **WHEN** a relation connects cards in adjacent rows and different columns
- **THEN** its wire has two bends inside the channel between those rows

### Requirement: Buses and corridors

Relations sharing a source, label, details and target row SHALL form one bus
with one label, as SHALL relations sharing a target, label, details and
source row. A relation that skips rows SHALL pass every intermediate row
through a column gap or an empty cell.

#### Scenario: A fan-out bus

- **WHEN** one component realizes four clients in the next row with the same
  label
- **THEN** one vertical leaves the component, one horizontal spans the four
  clients and one label names the relation once

#### Scenario: A relation skipping a row

- **WHEN** a relation connects the first and third rows
- **THEN** its wire passes the second row outside every card

### Requirement: Measured neatness

Each laid-out view SHALL be measured for non-orthogonal segments, segments
shared by different relations, wires through cards, label boxes intersecting
cards, other labels or other relations' wires, text below the medium's floor
and content outside the frame. Any of these SHALL refuse the layout with the
offending relation, card or label. Crossings SHALL be minimized, reported and
drawn only as perpendicular crossings away from bends, ports and labels.

#### Scenario: A clean view

- **WHEN** the AIGW overview is laid out
- **THEN** its measurements report no shared segment, no wire through a card,
  no label collision and no crossing

#### Scenario: An unavoidable crossing

- **WHEN** three components in one row each call the same three components in
  the next row
- **THEN** the view is laid out with nine crossings, the minimum for two rows
- **AND** the measurements report that number without refusing

### Requirement: Route limits

A relation SHALL have at most two bends, or four when it skips rows, and no
segment shorter than 16 px; these are Archify's suggested limits, so both
media are judged alike. A layout outside them SHALL be refused with the
relation and its measure.

#### Scenario: A relation between adjacent rows

- **WHEN** a relation connects two adjacent rows
- **THEN** its wire has at most two bends

### Requirement: Layout bounds

A row SHALL hold at most six cards, or five when rows carry labels. A view
with a wider row, or a channel without a clean routing, SHALL be refused with
the row or channel, its relations and a remedy naming more tiers or views.

#### Scenario: A row that is too wide

- **WHEN** a view declares a tier of seven components
- **THEN** the view is refused with that row's members and the six-card limit
