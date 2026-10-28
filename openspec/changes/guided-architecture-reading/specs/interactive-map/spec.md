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
as the conclusion and its scope, limits and attribution as the page scope, each
ended as a sentence.
Each view SHALL be one panel, in the plan's order, titled with the view's
question, or with its title when its question is the model's own, and holding
that view's native architecture diagram. The page SHALL
NOT print digests, verification records or complete source lists; they stay
in the manifest.

#### Scenario: Four views

- **WHEN** a model declares four views
- **THEN** the page has four panels in that order, each with its question as
  its title and its diagram
- **AND** no panel lists a SHA-256 digest

#### Scenario: An overview that asks the model's question

- **WHEN** an overview's question is the model's question
- **THEN** its panel is titled with the overview's title and the question
  appears once on the page

### Requirement: View diagrams

Each view's diagram SHALL contain the view's components with their label and
a first detail as sublabel, and its relations as labeled connections, dashed
when planned or retired. Kinds SHALL map to Archify's
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

### Requirement: Sides Archify plans

Candidates SHALL keep the grid's connection sides. When no candidate that
passes is free of crossings and of routes over two bends, every candidate SHALL
also be measured with all its connection sides left to Archify, and the choice
SHALL be made from both sets; the manifest SHALL record which sides the chosen
diagram keeps.

#### Scenario: Grid sides that cross

- **WHEN** Big Bank's tiered view crosses eight times with the grid's sides
- **THEN** its diagram is chosen with the sides Archify plans and crosses at
  most once

### Requirement: Diagram shape

Each view diagram SHALL be between 1.0 and 1.8 times as wide as high when a
candidate allows it, and never wider than 1.8 or narrower than 0.7 times its
height. A view whose every candidate is outside that range SHALL be refused
with its measured shapes.

#### Scenario: A three-card view

- **WHEN** a view of three cards in two rows is delivered
- **THEN** its diagram is between 1.0 and 1.8 times as wide as high

### Requirement: Steps and sources

A panel SHALL list the view's components as steps, in its diagram's reading
order from the top row down and left to right, that light their node in the
diagram, each with its first detail. When the model declares a repository,
each component's first source SHALL be a numbered page source pinned to the
revision.

#### Scenario: Stepping through a view

- **WHEN** a reader steps through a panel
- **THEN** each step lights its component in that panel's diagram
- **AND** the steps walk the diagram's rows from the top, left to right

### Requirement: Withheld sources

A source that Archify will not cite on a page, such as a file under a
`secrets` directory, SHALL be withheld from the page and recorded as withheld
in the manifest, and a component that cites it SHALL cite its next source.

#### Scenario: A source in a sensitive file class

- **WHEN** a component's first source lies under `internal/secrets/`
- **THEN** the page cites the component's next source, or none
- **AND** the manifest lists the first source as withheld

### Requirement: Desktop reading floor

In Chromium with a 1440 × 900 viewport, no preview SHALL show Archify's notice
that it cannot fit the page with readable text, and primary component labels
SHALL render at no less than 13.25 CSS px in the page's diagram previews and no
less than 14 CSS px in each diagram's full interactive view; relation labels
keep Archify's native size.

#### Scenario: Measured label size

- **WHEN** the delivered page is opened at 1440 × 900 in Chromium
- **THEN** every preview fits its panel
- **AND** every primary component label in its previews is at least 13.25 px
- **AND** every primary component label in each full viewer is at least 14 px
