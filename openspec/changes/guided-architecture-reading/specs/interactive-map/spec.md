## Purpose

Deliver each model as a native Archify exploration document with guided views
and complete evidence.

## ADDED Requirements

### Requirement: Native Archify document

The map SHALL be one standalone HTML document produced by the vendored,
unmodified Archify `deliver` command at the showcase quality profile from an
architecture document written by the publisher. The publisher SHALL NOT patch
Archify, replace its fonts or routing, or post-process its output. An Archify
error, warning or failed showcase check SHALL refuse the build.

#### Scenario: A map is delivered

- **WHEN** a valid model is built
- **THEN** `index.html` is the document Archify delivered at showcase quality
- **AND** the manifest records Archify's supply digest and delivery result

#### Scenario: Archify refuses

- **WHEN** Archify reports a failed showcase check
- **THEN** the build refuses with Archify's diagnostic and writes no delivery

### Requirement: Independent composition

The publisher SHALL compute map positions, sizes and connection sides with the
grid layout and Archify's text metrics, and SHALL leave routing, port spreading
and label placement to Archify. Map geometry SHALL NOT be derived from poster
coordinates, poster images or screenshots.

#### Scenario: Different metrics, same structure

- **WHEN** a view is laid out for both media
- **THEN** each medium's positions come from its own layout run with its own
  metrics

#### Scenario: Native routes

- **WHEN** a relation connects a component to one in the next row
- **THEN** the Archify connection leaves the bottom side, enters the top side
  and carries no waypoints

### Requirement: Exploration content

The map SHALL contain every component of the model with its label, its kind as
tag and a short first detail as sublabel; tiers and the system boundary as
regions when every label still fits at 14 px; every relation as a labeled
connection, dashed when planned or retired; and the seven native component
types as color families mapped from
the kind categories, with `person` drawn as `external`, whose legend labels
name the model kinds.

#### Scenario: Kinds become color families

- **WHEN** a model declares a `database` kind and a `person` kind
- **THEN** their components use Archify's database and external types
- **AND** the legend names the model's kind labels

### Requirement: Guided views and evidence cards

The map SHALL offer one guided view per model view and cards for the question
and summary, the scope, limits and attribution, and the complete evidence of
every component and relation.

#### Scenario: Evidence is inspectable

- **WHEN** a reader opens the evidence card
- **THEN** it lists each component and relation with its details, status,
  source paths, digests and verification state

#### Scenario: Guided views

- **WHEN** a model declares three views
- **THEN** the map offers three guided views that focus their members

### Requirement: Desktop reading floor

In Chromium with a 1440 × 900 viewport, primary component labels in the map
SHALL render at no less than 14 CSS px; relation labels keep Archify's native
size.

#### Scenario: Measured label size

- **WHEN** the delivered map is opened at 1440 × 900 in Chromium
- **THEN** every primary component label's computed size is at least 14 px

### Requirement: Native source references

When the supplied repository's `origin` remote equals the model's repository
URL, components SHALL carry up to three native source references that Archify
verifies at the revision. Otherwise the map SHALL carry none, and the
evidence card SHALL remain the source of evidence. The publisher SHALL NOT
create or change a remote to enable them.

#### Scenario: A repository without a matching origin

- **WHEN** the repository has no `origin` remote
- **THEN** the map has no native source references
- **AND** its evidence card lists every source
