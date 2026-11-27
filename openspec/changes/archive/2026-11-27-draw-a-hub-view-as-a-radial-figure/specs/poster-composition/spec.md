## MODIFIED Requirements

### Requirement: The matrix chosen by the tiers figure's route defects

A view of at least 8 parts that declares no tiers, names no composition and is not drawn radial SHALL be drawn as a
matrix when its figure in tiers at the full width, with its band where it has one, has at least two route defects and
a matrix fits the box its tiers plate keeps; every other view not drawn radial SHALL be drawn in tiers. Neither the
balance gates nor the number of parts alone SHALL choose the matrix.

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

### Requirement: A composition named by the view's author

A view MAY name its composition, `tiers`, `matrix` or `radial`, and the model's schema SHALL refuse any other value. A
view that names one SHALL be drawn so where it fits. A view that names `matrix` or `radial` and whose figure in it
does not fit SHALL be drawn in tiers, and the build SHALL report a warning that names the view.

#### Scenario: A named matrix

- **WHEN** a view of 6 parts names `matrix` and a matrix fits
- **THEN** its plate is a matrix

#### Scenario: A named matrix that does not fit

- **WHEN** a view names `matrix` and no matrix fits its tiers plate's box
- **THEN** its plate is drawn in tiers and the build reports a warning naming the view

#### Scenario: A named radial

- **WHEN** a view of 7 parts names `radial` and its radial figure can be drawn
- **THEN** its plate is drawn radial

#### Scenario: Named tiers

- **WHEN** a tangled view of 12 parts names `tiers`
- **THEN** its plate is drawn in tiers

#### Scenario: Another value

- **WHEN** a view names `spine`
- **THEN** the publisher refuses the model and names the field and the values it takes

## ADDED Requirements

### Requirement: A hub view drawn as a radial figure

A view of at least 4 parts that declares no tiers and names no composition SHALL be drawn radial when the part with
the most distinct neighbours relates to at least 75 percent of its other parts, no other part relates to more than
half of them, and at least twice as many of that part's relations go out from it as come into it. The choice SHALL
read the model alone, before the matrix's rule, so that a view is drawn alike in every language.

#### Scenario: A hub that drives

- **WHEN** a view of 7 parts has one part related to 5 of the other 6, every relation going out from it, and no other
  part related to more than 3
- **THEN** its plate is drawn radial, its centre that part, in every language of the work

#### Scenario: A second hub

- **WHEN** the part with the most neighbours relates to 7 of 9 others and a second part relates to 5 of them
- **THEN** its plate is drawn in tiers

#### Scenario: A fan of two

- **WHEN** a view of 3 parts has one part with a relation to each of the other two
- **THEN** its plate is drawn in tiers

#### Scenario: A tangled hub

- **WHEN** a view of 9 parts whose shape is a hub's has three route defects in tiers at the full width
- **THEN** its plate is drawn radial, not as a matrix

#### Scenario: A centre that does not drive

- **WHEN** the part with the most neighbours relates to 5 of 6 others, three relations going out from it and two
  coming in
- **THEN** its plate is drawn in tiers

### Requirement: A radial figure

A radial figure SHALL set its centre in the middle of the box its tiers plate keeps and the other parts on an ellipse
that fills the box, each part the centre relates to joined to it by a straight line. A relation between two outer
parts SHALL run as a straight chord, bent once outward where it would touch a card or the centre. Its cards, labels,
boundary and the clearance of its labels from other lines SHALL follow the rules of a tiers figure, an outside part
standing outside the boundary.

#### Scenario: An outside part on the ring

- **WHEN** a radial view's centre relates to an outside system among its other parts
- **THEN** the outside system's card stands outside the boundary, which encloses the view's own parts

#### Scenario: Spokes and a chord

- **WHEN** a radial view's centre relates to five parts and two of them relate to each other
- **THEN** five straight lines join the centre to those parts and one chord joins the two, touching no card

### Requirement: A radial figure that cannot be drawn

A plate whose view the radial rule takes SHALL be drawn as the matrix's rule or tiers would draw it where its radial
figure cannot be drawn or would set smaller type than its tiers figure, and its composition SHALL record that radial
was refused and why.

#### Scenario: Smaller type

- **WHEN** a hub view's radial figure fits only at a smaller type step than its tiers figure
- **THEN** its plate is drawn in tiers and its composition records radial as refused for its type

#### Scenario: An outside centre

- **WHEN** a hub view's centre is an outside part and other parts stand inside the boundary
- **THEN** its radial figure is refused for its boundary and the plate is drawn as the matrix's rule or tiers would

#### Scenario: A refused hub that tangles

- **WHEN** a hub view of 9 parts whose radial figure cannot be drawn has two route defects in tiers and a matrix fits
- **THEN** its plate is a matrix and its composition records radial as refused
