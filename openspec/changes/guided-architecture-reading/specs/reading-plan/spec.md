## Purpose

Choose the views a model is read through, explicitly or automatically, and admit
only posters that fit their frame at the reading floor.

## ADDED Requirements

### Requirement: Explicit views

A model SHALL declare at most five views. Each view SHALL name either ordered
tiers, which are group ids or inline groups drawn as rows in that order, or
members, which are component ids whose rows follow their relations. Each view
SHALL produce one poster and one guided view in the map. Groups SHALL be drawn
as rows only when a view names them as tiers.

#### Scenario: A tiered view

- **WHEN** a view names three groups as tiers
- **THEN** its poster draws three rows in that order with their members

#### Scenario: Too many views

- **WHEN** a model declares six views
- **THEN** the build refuses and states the five-view limit

### Requirement: Rows from relations

For a view that names members, and for the map when groups do not cover every
component, the publisher SHALL reverse the relations that close cycles, draw
every relation downward or within one row, and choose deterministically the
rows of least cost.

#### Scenario: A cycle

- **WHEN** members form the cycle a → b → c → a
- **THEN** a is above b and c, which share one row, and the relation c → a
  points upward

#### Scenario: Siblings that call each other

- **WHEN** a customer uses a web application and a single-page application and
  the web application delivers the single-page application
- **THEN** both applications share one row below the customer

### Requirement: Row cost

The cost of rows SHALL be ordered as follows: a row over its limit, or an
outside component left without a free column beside the system boundary,
outweighs every other cost; then each row a relation skips; then a card with
more than two neighbours in its row or relations closing a ring within one row;
then each relation within one row, cheaper between peers that share a caller;
then each further row.

#### Scenario: A row limit

- **WHEN** one component calls seven others in a view whose rows hold six cards
- **THEN** one callee shares its caller's row and the other six share the next
  row

#### Scenario: A free column for an outside component

- **WHEN** a component calls four inside components and one outside component
  in a map whose rows hold five cards
- **THEN** the five callees share one row, leaving the outside component a
  column beside the boundary

### Requirement: Automatic single view

Without declared views, the publisher SHALL derive the plan deterministically
and SHALL use one flow view of all components when that view is admitted.

#### Scenario: A small model

- **WHEN** a model without views has eight components that fit one poster
- **THEN** the plan has one view containing all of them

### Requirement: Automatic overview and group views

When the automatic single view is not admitted and the model has groups, the
plan SHALL be an overview with one node per group and one aggregated relation
per ordered group pair, followed by one view per group containing its members
and their direct neighbors. When the model has no groups, or this plan exceeds
five views, the build SHALL refuse with the measured size, or with the layout's
problems when the full view cannot be laid out, and the remedy.

#### Scenario: A large grouped model

- **WHEN** a model without views has four groups and its full view is not
  admitted
- **THEN** the plan has an overview of four group nodes followed by four group
  views

#### Scenario: A full view that cannot be wired

- **WHEN** a model without views has groups and the grid cannot wire its full
  view
- **THEN** the plan is the overview followed by the group views

#### Scenario: A large model without groups

- **WHEN** a model without views or groups is not admitted as one view
- **THEN** the build refuses, reports the measured poster size and asks for
  groups or views

### Requirement: Poster frame admission

Every poster SHALL be exactly 1800 px wide and at most 1350 px high, and no
text SHALL be smaller than 14 px. Admission SHALL compose each view once with
the grid layout. A view that does not fit SHALL be refused with its id, the
measured width and height of its drawing, and component and relation counts.
The publisher SHALL NOT scale text down, retry other layout parameters or crop.

#### Scenario: An oversized view

- **WHEN** a declared view measures 1800 × 1565 px
- **THEN** the build refuses and reports that view id, 1800 × 1565 and its
  counts
- **AND** no other layout is attempted

#### Scenario: A drawing wider than the frame

- **WHEN** a declared view's drawing is wider than its poster stage
- **THEN** the build refuses and reports a measured width above 1800 px

#### Scenario: A deterministic plan

- **WHEN** the same model is checked twice with the same publisher version
- **THEN** both results report identical views and measured sizes

### Requirement: Named view refusals

A view whose layout is refused SHALL be refused with its id and the layout's
problems under that view's path. Admission SHALL report every view it refuses,
under the code of the first.

#### Scenario: Two refused views

- **WHEN** the grid cannot wire the second of three declared views and the
  third does not fit
- **THEN** the refusal names the second view with its layout code
- **AND** its problems list the second view's layout problems and the third
  view's measured size under their `/views/<id>` paths
