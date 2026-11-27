## ADDED Requirements

### Requirement: A view drawn as a matrix

A view drawn as a matrix SHALL set its parts as the rows and the columns of a grid in the order its relations flow,
sources first and the parts of a cycle together. The relations from one part to another SHALL be the cell of its row and the other's
column, holding their label, and the number of files they cite where the edition counts them, tinted in their line's
colour.

#### Scenario: A relation in a matrix

- **WHEN** a view drawn as a matrix has a relation labelled "reads" from the gateway to the store
- **THEN** the cell in the gateway's row and the store's column holds "reads", tinted in the relation's colour

### Requirement: A matrix's heads, boundary and corner

A label that every mark of a matrix's row or column shares, at least two, SHALL be said once, at that row's or
column's head. The boundary SHALL be a bracket over each run of inside rows and of inside columns, the column bracket
naming it. The grid's empty corner SHALL read the direction of its cells in the edition's language.

#### Scenario: One label shared by a column

- **WHEN** every relation into one part is labelled "reads", and there are at least two
- **THEN** "reads" is set once at that column's head and its cells hold no label of their own

#### Scenario: The corner in Chinese

- **WHEN** a simplified Chinese edition (`zh-CN`) draws a matrix
- **THEN** its empty corner reads 「从 ↓ 到 →」

### Requirement: A matrix in its tiers plate's box

A matrix SHALL be drawn in the box the view's tiers plate keeps, at the largest type step that fits, so that its
plate's width, reading and summary are those of tiers. Its plate's record SHALL name the composition and the route
defects of the full-width tiers figure that chose it.

#### Scenario: The reading beside a matrix

- **WHEN** a view is drawn as a matrix
- **THEN** its plate has the width, the reading and the summary its tiers plate would have
- **AND** its record in the manifest names the matrix and the tiers figure's route defects

### Requirement: The matrix chosen by the tiers figure's route defects

A view of at least 8 parts that declares no tiers and names no composition SHALL be drawn as a matrix when its figure
in tiers at the full width has at least two route defects and a matrix fits the box its tiers plate keeps; every
other view SHALL be drawn in tiers. Neither the balance gates nor the number of parts alone SHALL choose the matrix.

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

A view MAY name its composition, `tiers` or `matrix`, and the model's schema SHALL refuse any other value. A view
that names one SHALL be drawn so where it fits. A view that names `matrix` and whose matrix does not fit SHALL be
drawn in tiers, and the build SHALL report a warning that names the view.

#### Scenario: A named matrix

- **WHEN** a view of 6 parts names `matrix` and a matrix fits
- **THEN** its plate is a matrix

#### Scenario: A named matrix that does not fit

- **WHEN** a view names `matrix` and no matrix fits its tiers plate's box
- **THEN** its plate is drawn in tiers and the build reports a warning naming the view

#### Scenario: Named tiers

- **WHEN** a tangled view of 12 parts names `tiers`
- **THEN** its plate is drawn in tiers

#### Scenario: Another value

- **WHEN** a view names `radial`
- **THEN** the publisher refuses the model and names the field and the values it takes

## MODIFIED Requirements

### Requirement: Balance measurement regions

Every balance measure SHALL be taken over the plate's body field from every mark the figure draws, text included,
except a matrix's rules, diagonal and brackets, which the eye reads as the grid's frame: a matrix is measured by its
heads, its filled cells at their tint and its words. A blank band SHALL count wires as blank, the empty rectangle and
the holes SHALL count every mark measured, and the centroid SHALL weight each mark by how dark it prints.

#### Scenario: A wire across a blank band

- **WHEN** only a wire crosses a 304 px band of the body field
- **THEN** the plate measures a 304 px blank band
- **AND** the wire divides the largest blank rectangle

#### Scenario: Dark text weighs more than white cards

- **WHEN** text fills a quarter of the body field at its left and white cards
  the same area at its right
- **THEN** the centroid lies left of centre

#### Scenario: A matrix's empty cells

- **WHEN** a matrix's rules cross a region of the body field that holds no filled cell, head or word
- **THEN** that region measures as blank
