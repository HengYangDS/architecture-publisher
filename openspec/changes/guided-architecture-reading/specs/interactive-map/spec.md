## Purpose

Deliver each model as one native Archify explainer page that answers the
model's question view by view, with native architecture diagrams that open
the full interactive viewer.

## ADDED Requirements

### Requirement: Native Archify explainer

The interactive delivery SHALL be one standalone HTML page produced by the
vendored, unmodified Archify from an explainer draft and one architecture
document per view, written by the publisher. The publisher SHALL NOT patch
Archify, replace its fonts, routing or reader, or post-process its output.

#### Scenario: An unmodified renderer

- **WHEN** a page is delivered
- **THEN** the Archify supply's digest matches its recorded release archive

### Requirement: Question-led page

The page SHALL be titled with the model's question and open with its summary
as the conclusion and its scope, limits and attribution as the page scope.
Each view SHALL be one panel, in the plan's order, titled with the view's
question and holding that view's native architecture diagram. The page SHALL
NOT print digests, verification records or complete source lists; they stay
in the manifest.

#### Scenario: Four views

- **WHEN** a model declares four views
- **THEN** the page has four panels in that order, each with its question as
  its title and its diagram
- **AND** no panel lists a SHA-256 digest

### Requirement: View diagrams

Each view's diagram SHALL contain the view's components with their label,
kind as tag and a first detail as sublabel, and its relations as labeled
connections, dashed when planned or retired. Kinds SHALL map to Archify's
seven native types as color families, with `person` drawn as `external`, and
the legend SHALL name the model's kinds. Positions and sizes SHALL come from
the grid layout with Archify's text metrics.

#### Scenario: Kinds become color families

- **WHEN** a view shows a `database` kind and a `person` kind
- **THEN** their components use Archify's database and external types
- **AND** the legend names the model's kind labels

### Requirement: Candidate diagrams

For each view the publisher SHALL lay out a finite set of candidate diagrams,
each a row wrapping and a content width, and obtain every candidate's routes
from Archify's own layout.

#### Scenario: Routes from Archify

- **WHEN** a view's candidates are compared
- **THEN** each comparison uses the routes Archify computed for that candidate

### Requirement: Chosen diagram

The publisher SHALL choose the candidate with the fewest route crossings, then
the fewest routes over two bends, then the smallest stretch above 1.35, then
the shape closest to the landscape band. The chosen diagram SHALL pass
Archify's showcase checks; a view with no passing candidate SHALL be refused
with Archify's findings. The manifest SHALL record the choice and its metrics.

#### Scenario: A clean view diagram

- **WHEN** the AIGW overview is delivered
- **THEN** its diagram has no route crossing and no route over two bends

### Requirement: Diagram shape

Each view diagram SHALL be between 1.0 and 1.8 times as wide as high when a
candidate allows it, and never wider than 1.8 or narrower than 0.7 times its
height. A view whose every candidate is outside that range SHALL be refused
with its measured shapes.

#### Scenario: A three-card view

- **WHEN** a view of three cards in two rows is delivered
- **THEN** its diagram is between 1.0 and 1.8 times as wide as high

### Requirement: Steps and sources

A panel SHALL list the view's components as steps that light their node in
the diagram, each with its first detail. When the model declares a repository,
each component's first source SHALL be a numbered page source pinned to the
revision.

#### Scenario: Stepping through a view

- **WHEN** a reader steps through a panel
- **THEN** each step lights its component in that panel's diagram

### Requirement: Desktop reading floor

In Chromium with a 1440 × 900 viewport, primary component labels SHALL render
at no less than 13.75 CSS px in the page's diagram previews and no less than
14 CSS px in each diagram's full interactive view; relation labels keep
Archify's native size.

#### Scenario: Measured label size

- **WHEN** the delivered page is opened at 1440 × 900 in Chromium
- **THEN** every primary component label in its previews is at least 13.75 px
