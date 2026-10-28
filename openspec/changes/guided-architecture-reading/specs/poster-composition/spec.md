## Purpose

Compose a model's views as graph-first pages in one fixed landscape format,
with the page, the figures and the text set together on one grid, and with
portable, deterministic SVG and PNG outputs.

## ADDED Requirements

### Requirement: Fixed presentation format

Every poster SHALL be 2400 × 1350 px, a 16:9 landscape page. The format SHALL
NOT depend on the content: a view that cannot be composed in it is refused,
never drawn on a longer, wider or narrower page.

#### Scenario: Every poster has one shape

- **WHEN** a model with a five-card view and a twelve-card view is built
- **THEN** every poster is 2400 × 1350 px

### Requirement: Pages of plates

A page SHALL carry one, two or three consecutive views, each as a plate: the
view's question as its heading, its title too when it differs from the
model's, and its figure in a band of the page.

#### Scenario: Every view is printed once

- **WHEN** an edition is composed
- **THEN** its pages carry every planned view exactly once, in plan order

### Requirement: Bands of plates

A band SHALL hold one plate or several side by side, in reading order,
dividing its width in proportion to the width each figure needs at the densest
step.

#### Scenario: Two short plates beside a wide one

- **WHEN** a page carries three views whose figures do not fit one above another
- **THEN** a composition with two of them side by side in one band and the
  third in the other is among its candidates

### Requirement: Edition grouping

The publisher SHALL choose the grouping for the whole edition rather than page
by page, minimising first the pages that miss a gate, then the page count, then
the total empty share, so that a view too sparse to fill a page alone shares
one with its neighbour.

#### Scenario: A sparse view shares a page

- **WHEN** an edition ends with a view of three components
- **THEN** that view shares a page with the view before it rather than
  printing as a band on a page of its own

### Requirement: Page grid

The page SHALL be set on one grid owned by the design tokens: an 8 px unit,
twelve columns between fixed margins, a baseline and a type scale whose
smallest size is 14 px. Every text block, rule, legend and figure field SHALL
start on a column line and a baseline, and text SHALL keep a measure of at
most 80 characters per line.

#### Scenario: A summary keeps its measure

- **WHEN** a view has a summary of 300 characters
- **THEN** no summary line is longer than 80 characters
- **AND** every line starts at the same column line

### Requirement: Page archetypes

The page SHALL use one of three archetypes: the masthead, with the text above
the plates in bands or side by side; the sidebar, with the text in a rail
beside them; and, for a page of one view, the corner page, with the head,
summary and legend set in the corners the figure leaves free. A narrower rail
gives a figure fewer columns and so a taller figure.

#### Scenario: A tall view

- **WHEN** a view's figure is taller than a masthead band
- **THEN** a sidebar composition is among its candidates

#### Scenario: A tree

- **WHEN** a single view's figure has one card in its top row and four in its
  bottom row
- **THEN** a corner composition is among its candidates

#### Scenario: Two narrow views

- **WHEN** a page carries two views whose figures are narrower than the page
- **THEN** a masthead composition with the two plates side by side is among
  its candidates

### Requirement: Masthead

The masthead SHALL set the title and question, the summary and the legend side
by side across the top, with the plates across all twelve columns below and the
notes along the foot. It SHALL split the twelve columns among them, and divide
the legend into one to three sub-columns, choosing the split whose band is
shallowest and then whose columns end most nearly level.

#### Scenario: A long legend beside a short title

- **WHEN** a masthead page's legend has twelve entries and its title one line
- **THEN** the legend is set in sub-columns so that it is no taller than the
  title and question beside it, or the summary if that is taller

### Requirement: Sidebar

The sidebar SHALL set the title, question, summary, legend and notes down a
rail of three or four left columns, spaced over the full live height, and the
plates over the full height of the remaining columns.

#### Scenario: A rail without an empty middle

- **WHEN** a sidebar page's text is shorter than the live height
- **THEN** its blocks are spaced down the rail rather than stacked at the top

### Requirement: Corner page

A corner page SHALL give its one plate the full width, above the notes or down
to the foot of the live area, and set the summary and the legend after the
figure is drawn, and the notes too when it sets no footer. The head SHALL start
at the top-left corner of the live area, carrying the view's title and question
beneath the model's, either set beside the drawn figure or in a strip reserved
above it. A figure that leaves no room beside it SHALL NOT be a candidate for
the first form.

#### Scenario: Text beside a narrow root

- **WHEN** a tree's root row holds one card in the middle of the page
- **THEN** the title is set at the top-left beside it

### Requirement: Corner placement

The summary and the legend of a corner page SHALL each take the corner,
nearest the page edge, and the width, from two columns up, that leave the page
passing its gates and then with the smallest largest empty rectangle and the
smallest centroid offset.

#### Scenario: A strip beside a compact figure

- **WHEN** a compact figure leaves a strip two columns wide beside it
- **THEN** a summary or legend set in that strip is among the placements

### Requirement: Floating notes

A corner page that sets no footer SHALL set its notes as one block, stacked or
side by side, in one of the page's bottom corners or along its foot, never above
the figure.

#### Scenario: Notes under a compact figure

- **WHEN** a corner page's figure leaves its lower left corner free
- **THEN** placing the notes there is among its candidates

### Requirement: Text clearance

Every floating block SHALL keep 40 px of paper from every card, wire, label and
other block and 24 px from the boundary frame, and none SHALL be set between a
figure's first and last tier label.

#### Scenario: No text over the figure

- **WHEN** a corner page is composed
- **THEN** no text block lies within 40 px of a card, wire or label

### Requirement: Tier-label column

The column that holds a figure's tier labels SHALL be as wide as its widest
label at the largest tier size plus the marker before it, and never wider than
280 px.

#### Scenario: Short tier labels

- **WHEN** every tier label of a view is one short word
- **THEN** the label column is narrower than 280 px

### Requirement: Graph-first content

Cards SHALL show their category color, kind icon, label and details;
relations SHALL show their label and details on their own wire. Posters SHALL
NOT print claim records, digest lists, status tables or reading indexes.

#### Scenario: A component with details

- **WHEN** a component declares `owns: account tokens`
- **THEN** its card shows its icon, its label and that detail

### Requirement: Header, legend and notes

Each poster SHALL show the title, the view question, an optional summary and
the repository, revision and view number; one legend of the kinds, the system
boundary and the statuses present; and notes with the scope, limits,
attribution, repository revision and source verification state.

#### Scenario: Evidence stays off the poster

- **WHEN** a model declares source digests for every component
- **THEN** the poster shows the revision and verification state in its notes
  and no digest

### Requirement: One summary per page

A page of one view SHALL set that view's summary, or the model's when the view
has none; a page of several views SHALL set the model's summary and each
plate's own under its heading. The scope note SHALL carry the model's scope
only, so that no text is set twice on one page.

#### Scenario: The overview's summary is set once

- **WHEN** a page shows an overview whose summary is the model's
- **THEN** the summary appears once on the page and not again in its notes

### Requirement: Uncut text

No title, question, summary, legend entry or plate heading SHALL be cut to fit:
a width at which one does not fit is not used, and a model whose title,
question or summary no composition can set is refused with
`poster_title_too_long` or `poster_summary_too_long`.

#### Scenario: A summary too long for any column

- **WHEN** a model's summary needs more lines than a poster allows across the
  widest summary column
- **THEN** the build refuses with `poster_summary_too_long` and the line count

### Requirement: Candidate compositions

The publisher SHALL derive for each page a finite, ordered set of candidates:
an archetype with its rail and band arrangement, and for each plate a row
wrapping that splits a wide row into consecutive rows of one band, for rows
derived from relations also the flatter rows that draw a chain along one row, a
figure type step, and, when a page holds outside components, whether a row's
centre is taken over all its cards or only those inside the boundary.

#### Scenario: A wide tier wraps

- **WHEN** a view's only tier holds six cards
- **THEN** a candidate draws them as two rows of three in one band

#### Scenario: A chain runs along a row

- **WHEN** a view's derived rows put three single cards in three rows above a
  row of three
- **THEN** a candidate draws the three single cards along one row

### Requirement: Uncentred rows

When a page's chosen candidate crosses wires, the publisher SHALL also lay the
page's plates out with uncentred rows and choose the page again from both.

#### Scenario: Centring would cross a skipping relation

- **WHEN** centring the rows makes a relation that skips a row turn across the
  wires of the row above its target
- **THEN** the page also measures the uncentred rows and draws the one that
  does not cross

### Requirement: Widest fitting wrapping

At each type step a plate SHALL keep, of its layered rows and of its flatter
rows, only the widest wrapping that fits its field with the fewest crossings: a
row that fits is never split to fill a band.

#### Scenario: A row that fits is not split

- **WHEN** a view's rows of two, three and two cards fit their field at a step
- **THEN** no candidate at that step splits the row of three

### Requirement: Whole-word card text

A wrapping whose card width would break a card label inside a word, or a
detail between two letters, SHALL NOT be a candidate. A detail MAY break a long
path or identifier after a slash, hyphen, underscore, dot or colon.

#### Scenario: A long word in a narrow column

- **WHEN** a six-column wrapping leaves a card too narrow for the word
  `TransitionPlan`
- **THEN** that wrapping is not a candidate

#### Scenario: A long path in a detail

- **WHEN** a card's detail `refs/ethos/attestations-set` is wider than its line
- **THEN** it breaks after `refs/ethos/` and not between two letters

### Requirement: Natural-height bands

Each plate's band SHALL be at least its figure's natural height at the densest
step, with the page's surplus shared in proportion to those heights. A
grouping whose figures need more height than the page has SHALL NOT be a
candidate.

#### Scenario: A twelve-card plate beside a five-card plate

- **WHEN** a page carries a tall plate and a short one
- **THEN** each plate's band is at least its figure's natural height

### Requirement: Cards as large as their text

A card SHALL be as wide as the longest label and the longest detail of any card
in its view need on one line, within card measures of 16 ems for a label and
24 ems for a detail, and no wider; a field too narrow for that width narrows
the cards and their text wraps.

#### Scenario: A short card in a row of tall ones

- **WHEN** a row holds a card with one detail line beside a card with five
- **THEN** both cards share the row's height and the short card's spare height
  lies below its text

### Requirement: No stretched cards

Every card of a row SHALL be as tall as the row's tallest text, with its label
first and its details directly beneath. A card SHALL NOT grow to fill its band:
a figure shorter than its band deepens its channels within their token bound
and is centred in the rest.

#### Scenario: A sparse view keeps compact cards

- **WHEN** a view of two rows of three cards is composed on a page of its own
- **THEN** no card is taller than its row's tallest text needs

### Requirement: Ink-centred figure

A drawn figure SHALL move across its field, without leaving it, until its ink
centroid lies within 2.5 percent of the field's width from the field's centre
line; a figure already within that distance keeps its outline centred.

#### Scenario: Single cards off the middle of a wide row

- **WHEN** a figure's one-card rows sit half a column right of its two-card
  rows
- **THEN** the figure moves left until its ink is near the centre line

### Requirement: Figure containment

No card, wire or label SHALL be drawn outside its plate's field, and no tier
label outside the plate's label column. A long relation SHALL run in a
corridor inside the figure's content width; a view whose long relation has no
such corridor in a candidate is not composed in that candidate.

#### Scenario: A corridor past the last column

- **WHEN** the only free gap for a long relation lies past the figure's last
  used column, outside its field
- **THEN** that candidate is rejected and the relation never runs off the page

### Requirement: Figure type steps

The figure SHALL be set in one of five steps of card label, detail and
relation-label sizes: 18/14/14, 20/16/16, 24/18/18, 28/20/20 and 32/24/24 px. A
step SHALL scale the cards' padding, icons, gaps and wires with its text. No
size SHALL exceed 1.8 times its size at the densest step, and every card label
SHALL be smaller than the view heading.

#### Scenario: A sparse view is set large

- **WHEN** a view of seven components has a page of its own
- **THEN** its figure uses the 28 or 32 px step that fits its field

### Requirement: One step per page

Every plate of one page SHALL use one type step: the largest every plate can
draw at among those with the fewest crossings across the page.

#### Scenario: Two plates share a size

- **WHEN** a page carries a plate that fits at 24 px and one that fits only at
  18 px
- **THEN** both plates are drawn at 18 px

### Requirement: Chosen plate

The publisher SHALL judge each plate as a figure: among its candidates with the
fewest wire crossings, the one at the largest type step, then with layered rows
before flatter ones, then the nearest the band's centre.

#### Scenario: The same choice every time

- **WHEN** the same view is composed twice
- **THEN** both posters are byte-identical

### Requirement: Chosen page

The publisher SHALL choose for each page, among the candidates that pass every
gate, or among all when none passes, the one with the fewest crossings, then
the smallest empty-rectangle share, then the smallest centroid offset; a corner
page SHALL set its text around its plate's candidates best first and keep the
first that passes.

#### Scenario: The same page every time

- **WHEN** the same edition is composed twice
- **THEN** both runs choose the same pages

### Requirement: Recorded composition

The manifest SHALL record each page's views, archetype, rail, band
arrangement, notes placement and centring, each plate's wrapping and type step,
and the page's measures with every gate it misses.

#### Scenario: A page in the manifest

- **WHEN** an edition is built
- **THEN** its manifest records every page's composition and measures

### Requirement: Recorded balance misses

Any repository's model SHALL be drawable: an edition whose chosen grouping
leaves a page without a passing candidate SHALL print the page the search
chose and record, in that page's measures, every gate it misses with the
measured value and the limit. A view that no page can lay out at any step or
wrapping SHALL be refused with `poster_unfittable` and its id.

#### Scenario: A model too sparse for a balanced page

- **WHEN** a model of two components and one relation is built
- **THEN** its page is printed and its manifest entry records the empty share
  and the limit it misses

### Requirement: Balance gate

A page SHALL pass when the largest empty rectangle in the live area covers at
most 12 percent of it, ink reaches at least 90 percent of the live area's
width and height, and the ink centroid lies within 6 percent of the centre of
the rectangle the plates' fields cover.

#### Scenario: A strip in the middle of the page

- **WHEN** a figure of one row is centered in an otherwise empty field
- **THEN** the balance gate fails with the measured empty share

### Requirement: Balance measurement regions

The empty rectangle and the reach SHALL be measured over the whole page, text
included, and the centroid over the figures' own fields, so that a sidebar of
text beside a centred figure is not read as an off-centre figure.

#### Scenario: A rail beside a figure

- **WHEN** a sidebar page sets its text in the rail and a figure fills the
  remaining columns evenly
- **THEN** the reach counts the rail and the centroid reads the figure as
  centred

### Requirement: Type gate

A composition SHALL pass when every text uses a size of the type scale, none
is smaller than 14 px, every text block keeps its measure and no card label
breaks inside a word.

#### Scenario: Text floor

- **WHEN** any poster is built
- **THEN** every text run in its SVG is at least 14 px

### Requirement: Line gate

A composition SHALL pass when every relation has at most two bends, or four
when it skips rows, no segment is shorter than 16 px and no wire crosses a
card or a label.

#### Scenario: A route with three bends

- **WHEN** a relation between adjacent rows needs three bends
- **THEN** the line gate fails with that relation and its bends

### Requirement: Status styles

Relations and components with status `planned` SHALL be drawn dashed, and
those with status `retired` SHALL be drawn dotted and muted. The legend SHALL
explain each style present.

#### Scenario: A planned relation

- **WHEN** a relation has status `planned`
- **THEN** its wire is dashed and the legend explains the dashed style

### Requirement: Portable deterministic output

Each poster SHALL be written as SVG whose text is converted to glyph outlines
and whose icons are inline paths, and as PNG at 2400 and 6000 px wide rendered
from that SVG by the vendored renderer. The publisher SHALL NOT discover host
fonts. Building the same model with the same publisher version SHALL reproduce
identical bytes.

#### Scenario: Rendering without fonts

- **WHEN** a poster SVG is opened on a machine without the bundled fonts
- **THEN** it renders the same glyphs because it contains no font references

#### Scenario: Rebuild

- **WHEN** a model is built twice into two directories
- **THEN** every SVG and PNG in one equals the corresponding file in the other
