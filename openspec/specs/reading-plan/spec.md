# reading-plan Specification

## Purpose

Choose the views a model is read through, explicitly or automatically, and
admit only views a poster page can lay out at the reading floor.

## Requirements

### Requirement: Rows from relations

For a view that names members, the publisher SHALL reverse the relations that
close cycles, draw every relation downward or within one row, and choose
deterministically the rows of least cost.

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
  in a view whose rows hold five cards
- **THEN** the five callees share one row, leaving the outside component a
  column beside the boundary

### Requirement: Automatic single view

Without declared views, the publisher SHALL derive the plan deterministically
and SHALL use one flow view of all components when that view is admitted.

#### Scenario: A small model

- **WHEN** a model without views has eight components that fit one plate
- **THEN** the plan has one view containing all of them

### Requirement: Automatic overview and group views

When the automatic single view is not admitted and the model has groups, the
plan SHALL be an overview with one node per group and one aggregated relation
per ordered group pair, followed by one view per group containing its members
and their direct neighbors, however many groups there are. When the model has
no groups, the build SHALL refuse with the full view's component and relation
counts, the page size or the refusal that ruled it out, and the remedy.

#### Scenario: A large grouped model

- **WHEN** a model without views has three groups and its full view is not
  admitted
- **THEN** the plan has an overview of three group nodes followed by three
  group views

#### Scenario: A full view that cannot be wired

- **WHEN** a model without views has groups and the grid cannot wire its full
  view
- **THEN** the plan is the overview followed by the group views

#### Scenario: Many groups

- **WHEN** a model without views has five groups and its full view is not
  admitted
- **THEN** the plan has an overview of five group nodes followed by five group
  views

### Requirement: Overview id

Each group's view SHALL take the group's id, and the overview SHALL take
`overview`, or the first of `overview-2`, `overview-3` and so on that no group
takes.

#### Scenario: A group named overview

- **WHEN** a model's groups are named `overview` and `overview-2`
- **THEN** the overview's id is `overview-3` and each group view keeps its
  group's id

#### Scenario: A large model without groups

- **WHEN** a model without views or groups is not admitted as one view
- **THEN** the build refuses with the view's component and relation counts and
  the 2400 × 1350 px page size, and asks for groups or views

### Requirement: Named view refusals

A view whose admission is refused SHALL be refused with its id, and the
refusal's problems SHALL be listed under that view's path. Admission SHALL
report every view it refuses, under the code of the first.

#### Scenario: Two refused views

- **WHEN** the second and third of three declared views cannot be laid out in
  the edition's body
- **THEN** the refusal has the code `plate_unfittable` and names the second
  view
- **AND** its problems list each view's `plate_unfittable` problem once, under
  `/views/<id>`

### Requirement: Declared views

The publisher SHALL accept any number of declared views. Each view SHALL name
either ordered tiers, which are group ids or inline groups drawn as rows in
that order, or members, which are component ids whose rows follow their
relations. Each view SHALL be printed as one plate on one poster page and SHALL
be one panel of the explainer page. Groups SHALL be drawn as rows only when a
view names them as tiers.

#### Scenario: A tiered view

- **WHEN** a view names three groups as tiers
- **THEN** its plate draws them in that order, each as one row or, when wider
  than a row, as consecutive rows

#### Scenario: Many views

- **WHEN** a model declares five views
- **THEN** the build plans all five in their declared order, each as one plate
  and one panel

### Requirement: Undrawn statements are reported

`archpub check` SHALL list every component that no planned view draws as
itself and every relation that no planned view draws, alone or within an
aggregated overview relation.

#### Scenario: A component outside every declared view

- **WHEN** a model declares views and one component belongs to none of them
- **THEN** the check result lists that component and its relations as undrawn

### Requirement: Plate admission

A view SHALL be admitted when some candidate composition lays it out alone in
the print edition's body field with no text smaller than 14 px. Admission SHALL
try the finite candidate compositions and no other parameters. A view no
candidate lays out SHALL be refused with `plate_unfittable` and its id. The
publisher SHALL NOT shrink text, crop or change the format.

#### Scenario: An oversized view

- **WHEN** a declared view's cards cannot be laid out at 14 px in any candidate
  composition
- **THEN** the build refuses with `plate_unfittable` and that view's id

#### Scenario: A deterministic plan

- **WHEN** the same model is checked twice with the same publisher version
- **THEN** both results report identical views and compositions
