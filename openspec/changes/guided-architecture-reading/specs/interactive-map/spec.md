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
ended as a sentence. Each view SHALL be one panel, in the plan's order, titled
with the view's question, or with its title when its question is the model's
own, and holding that view's native architecture diagram. The page SHALL NOT
print digests, verification records or complete source lists; they stay in
the manifest.

#### Scenario: Four views

- **WHEN** a model declares four views
- **THEN** the page has four panels in that order, each with its question as
  its title and its diagram
- **AND** no panel lists a SHA-256 digest

#### Scenario: An overview that asks the model's question

- **WHEN** an overview's question is the model's question
- **THEN** its panel is titled with the overview's title and the question
  appears once on the page

### Requirement: Panels beside the conclusion

A page of several views SHALL list beside its conclusion each panel's title,
numbered as the panels are and linked to its panel.

#### Scenario: The panels beside the conclusion

- **WHEN** a model declares three views
- **THEN** the conclusion is followed by the three panels' titles, numbered 1
  to 3, each a link to its panel

### Requirement: View diagrams

Each view's diagram SHALL contain its components with their label and, as
sublabel, the first detail the card holds whole, and its relations as
connections, dashed when planned or retired and labelled once among relations
sharing a source, label, details and status. A card SHALL NOT show a cut
detail. Positions and sizes SHALL come from the grid layout.

#### Scenario: A detail longer than its card

- **WHEN** a component's first detail is longer than its card holds and a
  later one fits
- **THEN** the card shows the later detail whole
- **AND** the component's step lists both details

#### Scenario: Relations that share a label

- **WHEN** two relations from one component share a label, details and status
- **THEN** only the first of their connections carries the label

### Requirement: Kind colors

Kinds SHALL map to Archify's seven native types as color families, with
`person` drawn as `external`, and the legend SHALL name the model's kinds.

#### Scenario: Kinds become color families

- **WHEN** a view shows a `database` kind and a `person` kind
- **THEN** their components use Archify's database and external types
- **AND** the legend names the model's kind labels

### Requirement: Diagram names

A view's diagram and its full viewer SHALL be named by the view's title when
the view has one of its own, otherwise by its question.

#### Scenario: A view without a title of its own

- **WHEN** a view declares a question but no title
- **THEN** its diagram and its full viewer are named by that question

### Requirement: Candidate diagrams

For each view the publisher SHALL lay out a finite set of candidate diagrams,
each a row wrapping and a content width, and obtain every candidate's routes
from Archify's own layout. A view with no candidate that passes Archify's
showcase checks SHALL be refused with Archify's findings.

#### Scenario: Routes from Archify

- **WHEN** a view's candidates are compared
- **THEN** each comparison uses the routes Archify computed for that candidate

### Requirement: Chosen diagram

Among candidates that pass Archify's showcase checks, the publisher SHALL
choose the one with the fewest routes that read as one or run along an edge,
then crossings, then one Archify's reader sets beside its steps at a 1440 px
viewport, then the fewest routes over two bends, crowded labels, crowded route
ends and stretch above 1.35, then the shape closest to the landscape band. The
manifest SHALL record the choice and its metrics.

#### Scenario: A clean view diagram

- **WHEN** the AIGW overview is delivered
- **THEN** its diagram has no route crossing and no route over two bends

#### Scenario: A preview beside its steps

- **WHEN** two candidates of a view are free of crossings, of routes that read
  as one and of routes along an edge, and only the narrower one leaves its steps
  room beside it
- **THEN** the narrower one is chosen
- **AND** the manifest records that its preview stands beside its steps

#### Scenario: Routes past the cards

- **WHEN** Archify routes a relation and its label past the cards of a
  candidate
- **THEN** the room the candidate's preview needs beside its steps counts the
  route and the label

### Requirement: Archify's route measures

A candidate that passes Archify's checks SHALL carry each route measure the
choice ranks by, and a layout with its cards, boundaries, relation labels and
the route of every connection; an answer without one SHALL refuse the view
rather than read the measure as zero.

#### Scenario: A renamed measure

- **WHEN** Archify passes a candidate without its maximum stretch
- **THEN** the view is refused with `page_measures_missing`

#### Scenario: A layout without its labels

- **WHEN** Archify lays out a passing candidate without its relation labels
- **THEN** the view is refused with `page_measures_missing`

### Requirement: Routes that read as one

Two routes SHALL read as one when, on Archify's layout, they run side by side,
closer than 8 px along more than 16 px, or line up within 8 px of one line,
sharing a stretch of it or ending less than 32 px apart with no card between
them and no end in common. A candidate with such routes SHALL NOT be chosen
while a candidate that passes has none.

#### Scenario: Routes 1 px off one line

- **WHEN** one route ends 14 px before another starts, 1 px off its line
- **THEN** the two read as one

#### Scenario: Routes on one line

- **WHEN** a context-mode sandbox candidate runs "fetches pages" along the line
  on which "checks deny rules" enters Security policy
- **THEN** that candidate is not chosen
- **AND** the chosen diagram has no routes that read as one

### Requirement: Routes along an edge, crowded labels and ends

A route SHALL run along an edge when it keeps parallel to a card's or the
boundary's edge closer than 12 px for more than 16 px, and SHALL count with
routes that read as one. A relation label SHALL crowd when it comes nearer
than 8 px to another relation's route or to a card. Two route ends SHALL crowd
when they meet one side of a card less than 24 px apart. The manifest SHALL
record each count with the chosen diagram's metrics.

#### Scenario: A route under the boundary's edge

- **WHEN** two candidates differ only in that one runs a route 4 px under the
  boundary's edge
- **THEN** the other is chosen

#### Scenario: A label under another card

- **WHEN** two candidates differ only in that one sets a relation's label 4 px
  under a card the relation does not connect
- **THEN** the other is chosen

### Requirement: Sides Archify plans

Every candidate SHALL be measured with the grid's connection sides and again
with all its connection sides left to Archify, and the choice SHALL be made
from both sets; the manifest SHALL record which sides the chosen diagram
keeps.

#### Scenario: Grid sides that cross

- **WHEN** browser-use's action view crosses once on Archify's routes with the
  grid's sides
- **THEN** its diagram is chosen with the sides Archify plans and does not cross

### Requirement: Re-sided connections

When the chosen diagram crosses, has routes that read as one or along an edge,
crowded labels, or stands above its steps, the publisher SHALL change the sides
of the connections involved, one at a time from the three best diagrams and the three
best beside their steps, within 96 measured changes for the view, keeping a
change only when it ranks the diagram higher. The manifest SHALL record the
re-sided connections.

#### Scenario: A crossing cleared by other sides

- **WHEN** the best diagram of context-mode's retrieval view crosses on
  Archify's routes
- **THEN** the connections that cross take other sides
- **AND** the chosen diagram does not cross

### Requirement: Diagram shape

Each view diagram SHALL be at least 0.7 times as wide as high, and among
candidates equal in every measure the choice ranks before shape, the one whose
shape lies nearest 1.0 to 1.8 times as wide as high SHALL be chosen. The
delivered canvas SHALL be at most 1.54 times as wide as high. A view whose
every candidate is narrower than 0.7 times its height SHALL be refused with
`page_shape_refused`.

#### Scenario: A three-card view

- **WHEN** a view of three cards in two rows is delivered
- **THEN** its diagram is between 1.0 and 1.8 times as wide as high

#### Scenario: Every candidate too tall

- **WHEN** every candidate of a view is narrower than 0.7 times its height
- **THEN** the build refuses with `page_shape_refused`

### Requirement: Steps and sources

A panel SHALL list the view's components as steps, in its diagram's reading
order from the top row down and left to right, that light their node in the
diagram, each with every one of its details.

#### Scenario: Stepping through a view

- **WHEN** a reader steps through a panel
- **THEN** each step lights its component in that panel's diagram
- **AND** the steps walk the diagram's rows from the top, left to right

### Requirement: Page sources

When the model declares a repository URL and revision, each component's first
source that the page does not withhold SHALL be a numbered page source pinned
to the revision, listed under the label of the first component that cites it;
a component without details SHALL name that source's file in its step.

#### Scenario: A repository without a URL

- **WHEN** the model declares a repository name and revision but no URL
- **THEN** no step cites a source

#### Scenario: A component without details

- **WHEN** a component declares no details and cites `src/cli/main.mjs`
- **THEN** its step reads that path followed by its source number

### Requirement: Withheld sources

A source that Archify will not cite on a page, such as a file under a
`secrets` directory, SHALL be withheld from the page and recorded as withheld
in the manifest, and a component that cites it SHALL cite its next source. A
page whose Archify findings name no further source to withhold SHALL be refused
with those findings.

#### Scenario: A source in a sensitive file class

- **WHEN** a component's first source lies under `internal/secrets/`
- **THEN** the page cites the component's next source, or none
- **AND** the manifest lists the first source as withheld

#### Scenario: A finding that names no cited source

- **WHEN** Archify's finding names a source position past the sources the page
  cites
- **THEN** no source is withheld and the page is refused with the finding

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
