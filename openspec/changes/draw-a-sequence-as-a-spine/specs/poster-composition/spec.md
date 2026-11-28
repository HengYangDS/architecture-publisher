## MODIFIED Requirements

### Requirement: The matrix chosen by the tiers figure's route defects

A view of at least 8 parts that declares no tiers, names no composition and is drawn neither radial nor as a spine
SHALL be drawn as a matrix when its figure in tiers at the full width, with its band where it has one, has at least
two route defects and a matrix fits the box its tiers plate keeps; every other such view SHALL be drawn in tiers.
Neither the balance gates nor the number of parts alone SHALL choose the matrix.

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

A view MAY name its composition, `tiers`, `matrix`, `radial` or `spine`, and the model's schema SHALL refuse any other
value. A view that names one SHALL be drawn so where it fits. A view that names `matrix`, `radial` or `spine` and whose
figure in it does not fit SHALL be drawn in tiers, and the build SHALL report a warning that names the view.

#### Scenario: A named matrix

- **WHEN** a view of 6 parts names `matrix` and a matrix fits
- **THEN** its plate is a matrix

#### Scenario: A named matrix that does not fit

- **WHEN** a view names `matrix` and no matrix fits its tiers plate's box
- **THEN** its plate is drawn in tiers and the build reports a warning naming the view

#### Scenario: A named radial

- **WHEN** a view of 7 parts names `radial` and its radial figure can be drawn
- **THEN** its plate is drawn radial

#### Scenario: A named spine

- **WHEN** a view of 6 parts names `spine` and its spine can be drawn
- **THEN** its plate is drawn as a spine

#### Scenario: A named spine that cannot be drawn

- **WHEN** a view names `spine` and its spine cannot be drawn at any type step
- **THEN** its plate is drawn in tiers and the build reports a warning naming the view

#### Scenario: Named tiers

- **WHEN** a tangled view of 12 parts names `tiers`
- **THEN** its plate is drawn in tiers

#### Scenario: Another value

- **WHEN** a view names `circle`
- **THEN** the publisher refuses the model and names the field and the values it takes

## ADDED Requirements

### Requirement: A sequence view drawn as a spine

A view that declares no tiers, names no composition and that the radial rule does not take SHALL be drawn as a spine
when a directed path of at least five stations, inside the repository but for its two ends, covers at least 60
percent of its parts, every other part relates to a station, at least half its relations join neighbouring stations,
and no station sends relations to more than three parts. The choice SHALL read the model alone, before the matrix's
rule.

#### Scenario: A pipeline

- **WHEN** a view of 8 parts has a path of 6 stations, 5 of its 9 relations join neighbouring stations, and no station
  sends more than 3
- **THEN** its plate is drawn as a spine in every language of the work

#### Scenario: A fan on the path

- **WHEN** a view's path has a station that sends relations to 4 parts
- **THEN** its plate is not drawn as a spine

#### Scenario: A part off the path

- **WHEN** a view's path leaves a part that relates to no station
- **THEN** its plate is not drawn as a spine

#### Scenario: A short path

- **WHEN** a view's longest admissible path has 4 stations
- **THEN** its plate is not drawn as a spine

### Requirement: A spine

A spine SHALL set its stations in rows of alternate direction across its tiers plate's box, turning down at the
box's side under an arrowhead. Other parts SHALL stand above or below the station they relate to most, or else
beyond the boundary or the rows, on orthogonal lines. The path SHALL be drawn as a relation into the hub is, the key
naming it the main path, and every other line plain. Cards, labels and margin SHALL follow a tiers figure's rules;
no segment SHALL be diagonal.

#### Scenario: A turn

- **WHEN** a spine's path runs to the end of its first row
- **THEN** it turns down at the box's side, under an arrowhead, into the second row, which reads the other way

#### Scenario: A branch

- **WHEN** a part outside the path relates to one station
- **THEN** it hangs above or below that station, joined by a vertical line or one with a single right-angled bend

#### Scenario: The main path

- **WHEN** a plate is drawn as a spine in an edition that draws strips
- **THEN** its path is the heavy line, the key names it the main path, and a relation into the hub is drawn plain

### Requirement: A spine that cannot be drawn

A plate whose view the spine rule takes SHALL be drawn as the matrix's rule or tiers would draw it where its spine
cannot be drawn or would set smaller type than its tiers figure, and its composition SHALL record that the spine was
refused and why.

#### Scenario: Smaller type

- **WHEN** a sequence view's spine fits only at a smaller type step than its tiers figure
- **THEN** its plate is drawn in tiers and its composition records the spine as refused for its type
