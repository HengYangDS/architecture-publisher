## ADDED Requirements

### Requirement: An outside card drawn as a band

A lone card of a tiers figure's first or last row SHALL be drawn as a band across the whole figure when its kind's
category is one of the things outside the code that parts use (`external`, `database`, `cloud` or `messagebus`) and
at least half the cards of its neighbouring row relate to it. Each wire from its neighbouring row SHALL enter the
band straight, at its other end's column. Every other card SHALL be drawn as a card.

#### Scenario: A store the row above reads

- **WHEN** a figure's last row holds one `database` card, and three of the four cards of the row above relate to it
- **THEN** it is drawn as a band across the whole figure, and each of the three wires enters it straight at its
  source's column

#### Scenario: A store few cards use

- **WHEN** a figure's last row holds one `external` card, and one of the four cards of the row above relates to it
- **THEN** it is drawn as a card

#### Scenario: A lone part of the code

- **WHEN** a figure's last row holds one `backend` card that every card of the row above relates to
- **THEN** it is drawn as a card

### Requirement: A fill no worse than the plain figure

A tiers figure with a band SHALL be kept only when it has no more crossings and no more route defects than the same
figure drawn with every card as a card; otherwise the plate SHALL draw that plain figure.

#### Scenario: A band that crosses more wires

- **WHEN** a figure with an eligible card has two crossings drawn with its band and one drawn plain
- **THEN** the plate draws the plain figure and records the band it took back

### Requirement: A justified figure beside the chosen one

Beside a tiers plate's chosen figure the publisher SHALL draw the same figure, with its rows, order of cards,
wrapping, type step, centring and tier labels, each row of two or more cards of one side of the boundary spread
across the width from inset to inset with equal gaps between; a row that mixes outside and inside cards keeps its
places. The plate SHALL take it only when it passes a balance gate the chosen figure misses, misses none it passes,
and has no more crossings or route defects.

#### Scenario: A justified figure that clears the blank

- **WHEN** a plate's chosen figure misses the blank-rectangle gate, and the justified figure passes every gate with
  no more crossings or route defects
- **THEN** the plate draws the justified figure, its rows' cards in the same order

#### Scenario: A row of a person and a system card

- **WHEN** a row holds a person card and a card inside the boundary
- **THEN** the justified figure leaves that row's cards in their places

#### Scenario: A justified figure that crosses more wires

- **WHEN** the justified figure would pass the blank-rectangle gate with one crossing more
- **THEN** the plate draws its chosen figure

### Requirement: No fill encloses an outside card

A band or a justified figure SHALL NOT bring an outside card inside the system's boundary: a figure whose band
would is drawn with that card as a card, and a justified figure that would is not drawn, so the plate keeps its
chosen figure.

#### Scenario: A band that would enclose a person

- **WHEN** a figure's last row holds one `database` card that its neighbouring row reads, and a person card stands
  beside the system's cards in another row
- **THEN** the store is drawn as a card, and the person stays outside the boundary

#### Scenario: A justified figure that would enclose a person

- **WHEN** spreading a row of the system's cards across the width would widen the boundary over a person card
  in another row
- **THEN** the plate draws its chosen figure, and the person stays outside the boundary

## MODIFIED Requirements

### Requirement: Cards as large as their text

A card SHALL be as wide as its label, its strip, its caption and its longest
detail need on one line, within card measures of 16 ems for a label and 24 ems
for a detail, and as wide as the widest card in its lattice column, and no
wider; a field too narrow for that width narrows the cards and their text
wraps. On a plate that sets its counts under their kinds a caption needs the
wider of its kind with its icon and its count. A band spans the figure;
its text keeps its lattice column's width.

#### Scenario: A short card in a row of tall ones

- **WHEN** a row holds a card with one detail line beside a card with five
- **THEN** both cards share the row's height and the short card's spare height
  lies below its text

#### Scenario: Cards of one column

- **WHEN** one lattice column holds a card with a short label above a card
  with a long one
- **THEN** both cards take the longer card's width

#### Scenario: A band's text

- **WHEN** a store at the figure's foot is drawn as a band
- **THEN** its label, caption and details are set in its lattice column's width at the band's left

### Requirement: No stretched cards

Every card of a row SHALL be as tall as the row's tallest text, with its label
first and its details directly beneath. A card SHALL NOT grow to fill its band:
a figure shorter than its band deepens its channels within their token bound
and is centred in the rest. A card drawn as a band across the figure is wider
than its text, as its requirement states, and is no taller than its text needs.

#### Scenario: A sparse view keeps compact cards

- **WHEN** a view of two rows of three cards is composed on a page of its own
- **THEN** no card is taller than its row's tallest text needs

### Requirement: Recorded plates

The manifest SHALL record each plate's number, view, figure width, whether its
reading was set beside it, above it or in its head (the value `omitted`), type
step, wrapping, row shape and centring; the card it draws as a band, whether it
draws the justified figure, and a band it took back; its measures: crossings,
route defects, bends, empty share and rectangle, blank band, hole share and
centroid; and each balance gate it misses.

#### Scenario: A plate in the manifest

- **WHEN** an edition is built
- **THEN** its manifest records every plate's composition and measures

#### Scenario: A plate with a band

- **WHEN** a plate draws its last row's store as a band
- **THEN** its record names that card as its band

### Requirement: The matrix chosen by the tiers figure's route defects

A view of at least 8 parts that declares no tiers and names no composition SHALL be drawn as a matrix when its
figure in tiers at the full width, with its band where it has one, has at least two route defects and a matrix fits
the box its tiers plate keeps; every other view SHALL be drawn in tiers. Neither the balance gates nor the number of
parts alone SHALL choose the matrix.

#### Scenario: A tangled view

- **WHEN** a view of 10 parts with no declared tiers has two route defects in tiers at the full width, and a matrix
  fits
- **THEN** its plate is a matrix

#### Scenario: A view with one route defect

- **WHEN** a view of 10 parts with no declared tiers has one route defect in tiers at the full width
- **THEN** its plate is drawn in tiers

#### Scenario: A view with declared tiers

- **WHEN** a view that declares its tiers has three route defects
- **THEN** its plate is drawn in tiers
