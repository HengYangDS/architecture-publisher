## Purpose

Choose the views a model is read through, explicitly or automatically, and admit
only posters that fit their frame at the reading floor.

## ADDED Requirements

### Requirement: Explicit views

A model SHALL declare at most five views. Each view SHALL name either ordered
tiers, which are group ids drawn as bands in that order, or members, which are
component ids laid out by their relations. Each view SHALL produce one poster
and one guided view in the map. Groups SHALL be drawn as bands only when a
view names them as tiers.

#### Scenario: A tiered view

- **WHEN** a view names three groups as tiers
- **THEN** its poster draws three bands in that order with their members inside

#### Scenario: Too many views

- **WHEN** a model declares six views
- **THEN** the build refuses and states the five-view limit

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
five views, the build SHALL refuse with the measured size and the remedy.

#### Scenario: A large grouped model

- **WHEN** a model without views has four groups and its full view is not
  admitted
- **THEN** the plan has an overview of four group nodes followed by four group
  views

#### Scenario: A large model without groups

- **WHEN** a model without views or groups is not admitted as one view
- **THEN** the build refuses, reports the measured poster size and asks for
  groups or views

### Requirement: Poster frame admission

Every poster SHALL be exactly 1800 px wide and at most 1350 px high, and no
text SHALL be smaller than 14 px. Admission SHALL compose each view once with
the fixed layout configuration. A view that does not fit SHALL be refused with
its id, measured width and height, and component and relation counts. The
publisher SHALL NOT scale text down, retry other layout parameters or crop.

#### Scenario: An oversized view

- **WHEN** a declared view measures 1800 × 1565 px
- **THEN** the build refuses and reports that view id, 1800 × 1565 and its
  counts
- **AND** no other layout is attempted

#### Scenario: A deterministic plan

- **WHEN** the same model is checked twice with the same publisher version
- **THEN** both results report identical views and measured sizes
