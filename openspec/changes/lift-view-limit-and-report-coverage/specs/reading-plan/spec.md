## MODIFIED Requirements

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

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Explicit views

**Reason**: Its four-view limit has no basis a reader would accept; Archify's
explainer admits up to 500 panels. Only the page's list of panels, which is its
conclusion's reasons, is capped at four, and the interactive map now bounds that
list alone. Declared views replaces it without the limit.

**Migration**: Models need no change. Consumers that match the refusal
`model_views_exceeded` drop that match.
