## ADDED Requirements

### Requirement: An overview stated in the model

A model MAY state its overview in `overview` as blocks without positions: a
claim and a lead; one course of steps; and, in the order the page sets them,
further courses, headed lists, tables and groups of lists, each with an
optional text that belongs to it. The publisher SHALL draw the overview from
that statement and from nothing else the author gives.

#### Scenario: Every kind of block

- **WHEN** a model states a claim, a lead, a course with a step of three stations on two tracks and a line, a
  further course with an outcome, a list, a table and a group
- **THEN** the build draws one overview page that sets every text of the statement

#### Scenario: No overview stated

- **WHEN** a model states no overview
- **THEN** the edition has no overview page, as today

### Requirement: A course and its steps

A course SHALL be an ordered list of steps, each a label with an optional note
and text, and MAY carry a text of its own. A step MAY hold stations, among them
forks of two or more branches with no order among them. A further course SHALL
be a title and ordered stations, with an optional labelled step, one optional
outcome that leaves a station, and an optional text.

#### Scenario: A fork that ends the course

- **WHEN** the last step holds a fork of two branches and nothing after it
- **THEN** the step takes two cells, the course's line runs on thinner over them, and each branch hangs from it on a stem of its own, its ring beside its name

### Requirement: A fork the course goes on from

A fork that another point follows SHALL split the course into a path for each
branch, one under another from the course's line, each with the branch's ring,
its name beside the ring and its note under the name, and the paths SHALL join
the course again before the next point. The course's line SHALL not run across
the fork.

#### Scenario: Two outputs joined again

- **WHEN** a fork of two branches stands before the station Delivery
- **THEN** the course splits into two paths, one under the other, which join it again before Delivery

### Requirement: Labels on a course's stretches

A course MAY label the stretch after one of its points, a station or a step
without stations that another point follows; the label SHALL stand over the
stretch, under the stations' names. A label after the last point, a fork, a
branch or a spur SHALL be refused.

#### Scenario: Two labelled stretches

- **WHEN** a course labels the stretch after Provider "serves" and the one after Model "selected by"
- **THEN** each label stands centred over its stretch, between the two points' rings

### Requirement: Stretches on parallel tracks

A stretch of a course, from one station or step without stations to a later
one, across steps and around no fork, MAY run on two to four tracks, counted or
named. A stretch that runs backward, holds a fork or shares a point with another
SHALL be refused with `model_overview_invalid`.

#### Scenario: A stretch across steps

- **WHEN** a stretch runs from the second station of one step to the last station of the next on two tracks named zh and en
- **THEN** the course draws those stations on each of two tracks, split before the first and joined after the last
- **AND** it names the two tracks once, where they begin

### Requirement: Spurs beside a course

A course MAY carry spurs: stations beside it, each leaving one point of the
course (a station or a step without stations), such as an input that joins it
or a store it reads. A spur SHALL hang under the notes at its point, and a line
MAY start or end at it. A spur at a step holding stations or at a branch SHALL
be refused with `model_overview_invalid`.

#### Scenario: An import beside the first station

- **WHEN** a spur named LikeC4 leaves the station model.json, and no line names it
- **THEN** LikeC4 stands under model.json's note on a smaller ring joined to model.json's ring, and the course still begins at model.json

### Requirement: Lines between points of a course

A course MAY carry lines from one point to others, each with a sentence. A
point SHALL be a station, a branch or a step without stations; a line that
names a step holding stations SHALL be refused with `model_overview_invalid`.

#### Scenario: A line that names a run

- **WHEN** a line starts at a step that holds three stations
- **THEN** the model is refused with `model_overview_invalid` at the line's `from`

### Requirement: The overview laid out by the publisher

The publisher SHALL set the masthead with the count of files the build read,
the course across the first band, its steps as wide as their stations need,
and the other blocks in the order stated: a course, a table or a group in a
half; a run of lists and headed texts in the rows of thirds and halves that
take the least height, measured. Headed texts stated one after another SHALL
share a cell, and a list of six items or more, each one line in half its width,
SHALL stand in two columns.

#### Scenario: A course and a table side by side

- **WHEN** a statement holds a further course followed by a table
- **THEN** the two stand in one row, each in a half

#### Scenario: Rows chosen by height

- **WHEN** a run of four lists holds one list that sets far fewer lines in a half than in a third
- **THEN** the four stand in two rows of halves, if those take less height than a row of thirds and a half

#### Scenario: A long list of short items

- **WHEN** a list holds ten items, each one line in half its width
- **THEN** it stands in two columns, the first five down the first and the rest down the second

### Requirement: An overview too tall for its page

The page SHALL be laid out at the house's spacing, and at a closer one, with
notes and texts a size smaller, when the first reaches below the foot. A page
that fits at neither SHALL be refused with `overview_too_tall`, naming the
first block that does not fit.

#### Scenario: Too much for one page

- **WHEN** a statement holds more lists than the page can hold below its course at the closer spacing
- **THEN** the build refuses with `overview_too_tall` and names the first list that does not fit

#### Scenario: A page that fits only closer

- **WHEN** a statement's blocks reach below the foot at the house's spacing and not at the closer one
- **THEN** the page is set at the closer spacing, its notes and texts a size smaller

### Requirement: Text clear of the page's lines

The publisher SHALL read back every line, rule and arrowhead it draws with its
width, and every ring, and SHALL refuse with `overview_text_over_line` a page
on which a text's glyph box lies under one of them, naming the text and the
line. The text under the last point before a fork SHALL end a module or more
before the fork's first line or ring.

#### Scenario: A fork's bar through a branch's name

- **WHEN** a drawing would run a fork's bar through the name of one of its branches
- **THEN** the build refuses with `overview_text_over_line`, naming the branch's name and the bar's ends

#### Scenario: A note that fills the cell before a fork

- **WHEN** a note fills its cell under the station before a fork
- **THEN** each of its lines ends eight points or more before the bar that splits the course, or before the first branch's ring

### Requirement: Plates named on the overview

A step, a station, a branch, a spur or a block of the statement MAY name, in
`view`, the view that enlarges it; a view the model does not declare SHALL be
refused with `model_reference_unknown` at its path. The page SHALL set that
view's plate number after the name, and in the edition as a link to the
plate's page. A check SHALL report with `overview_view_unreached`, at the
view's path, every view that nothing on the overview names.

#### Scenario: A block names its view

- **WHEN** a block names a view that the edition sets on plate 05
- **THEN** `05` follows the block's title, and in the edition links to that page

#### Scenario: A view the overview does not reach

- **WHEN** a model declares a view that no point or block of its overview names
- **THEN** the check's warnings name it with `overview_view_unreached`

### Requirement: Every overview page full

The height that a page's rows leave above the foot SHALL be shared between the
rows, so that the last row ends at the foot and no band of paper stands above
it; the rows keep their content and their order.

#### Scenario: A statement shorter than its page

- **WHEN** a statement's rows end 120 points above the foot at the house's spacing
- **THEN** the rows stand further apart and the last ends at the foot

### Requirement: Running text justified

A note or a text of the overview that takes more than one line SHALL be
justified, its last line set short. In a language written without spaces
between words it SHALL be set line by line, on the fewest lines that hold it
and broken where its loosest line opens least, every line but the last spread
between its characters to the measure. A name, a heading, a term and a text on
one line SHALL be set as they are.

#### Scenario: A line of Han before a word that does not fit

- **WHEN** a Chinese note breaks before a Latin word that does not fit on the line
- **THEN** the lines around it give that line a character, and every line but the last ends at one edge

### Requirement: Text written with spaces justified where its measure allows

In a language written with spaces between words, a text of more than one line
SHALL be justified as the edition's prose is where its measure is twenty ems
or more. In a narrower column it SHALL be set as a caption: on the fewest
lines that hold it, broken so that its widest line is narrowest, by preference
where a phrase ends, and with no line before the last left to one word where
another setting leaves none.

#### Scenario: A step's text in a wide measure

- **WHEN** a step's English text takes three lines in a measure of thirty-eight ems
- **THEN** its first two lines end at one edge and its last line ends short

#### Scenario: A caption filled as far as it goes

- **WHEN** an English note of five words would leave its last word alone on a second line
- **THEN** it breaks at its comma, and its second line is no shorter than its first

### Requirement: A caption justified to its own width

A caption's measure SHALL be its widest line. Where every other line but the
last reaches that measure within the limits of the edition's justified prose,
its spaces opened by a quarter at most and its letters tracked by hundredths
of an em, the caption SHALL be justified to it; otherwise it SHALL stay flush
left as set. No line of a caption SHALL be closed up or opened further.

#### Scenario: Lines of nearly one width

- **WHEN** a caption's first two lines differ by a third of an em in a column of twelve ems
- **THEN** both end at one edge, short of the column's, and the last line ends short of them

#### Scenario: Words that do not let a caption be justified

- **WHEN** no width holds every line of a caption but the last within those limits
- **THEN** its lines stay flush left, and no space between two of its words is opened

### Requirement: A line that cannot be spread is named

A line of a text set line by line that would open more than three tenths of an
em at each place, or that has no place to open, SHALL stay as it is set, and a
check SHALL report it with `overview_line_loose`, naming the line and the text
it belongs to.

#### Scenario: Two characters before a long word

- **WHEN** two characters of a Chinese note stand on a line before a word that takes the next line alone
- **THEN** both lines stay as they are set, and the check's warnings name each with `overview_line_loose`

### Requirement: Texts on one module and one grid of baselines

Every name, note, term, cell and text of the overview SHALL begin a whole
number of 8 point modules from the left margin, and a text set to a measure
SHALL end at one. Under a block's top and under a course's names, every step
down to a baseline SHALL be a whole number of half lines of the page's
spacing, and a name on two lines SHALL keep the pitch of the notes beside it.

#### Scenario: Two left edges that nearly meet

- **WHEN** a list's text and a station's name in another row would begin within three points of each other by their measured widths
- **THEN** both begin on the module: at one edge, or eight points apart or more

#### Scenario: Two headed texts beside a list

- **WHEN** two headed texts stand one under another beside a list of four items
- **THEN** each text's baseline is a baseline of the list's rows, or stands half a line or more off them

### Requirement: The overview's marks

A station SHALL be a ring on its course's line, a course's first and last
stations larger rings, a fork's branches and a spur smaller rings, parallel
tracks thinner lines beside the course, a line between points a line over the
course, or under it from a spur, with its sentence, and the outcome that leaves
a course a line in the accent with its sentence. No other mark SHALL be drawn on
a course.

#### Scenario: Stations of one kind

- **WHEN** a course of five stations is drawn
- **THEN** it draws five rings, the first and the last larger, and no tick or disc

### Requirement: Parts named on the overview

A step or a station that names a part of the model SHALL print the model's
label for it. A name the model lacks SHALL be refused at its path in the model
with `model_reference_unknown`.

#### Scenario: A station that is a part

- **WHEN** a station names the component `kernel`, whose label is TransitionPlan
- **THEN** the station is labelled TransitionPlan

## MODIFIED Requirements

### Requirement: Overview files

The overview SHALL be set in place in the print edition and delivered as one PNG of its page per `--png` width in `images/`, `00-overview.png` at 2400 px and
`00-overview-<width>.png` at any other. Equal statements, models, classes, fonts
and Typst versions SHALL give equal bytes.

#### Scenario: Two builds

- **WHEN** a model with an overview statement is built twice with `--png 2400,6000`
- **THEN** both deliveries hold byte-identical `images/00-overview.png` and `images/00-overview-6000.png`

### Requirement: Overview in the print edition

In the print edition the overview SHALL be drawn from the model's statement in
place, so its text is text, its imprint SHALL be the edition's foot, and its
masthead SHALL set the edition's build line in the model's language.

#### Scenario: Searchable overview text

- **WHEN** the print edition of a model with an overview statement is built
- **THEN** the overview's masthead claim can be extracted as text from its page

#### Scenario: A Chinese model's masthead

- **WHEN** the print edition of a zh-CN model with an overview statement is built
- **THEN** the overview's masthead sets 构建于 and the revision
- **AND** it sets no English build line

## REMOVED Requirements

### Requirement: Overview composition

**Reason**: A composition places every word and line by coordinates, which no input does.

**Migration**: State the overview in the model's `overview` as blocks.

### Requirement: What a composition leaves to the class

**Reason**: There is no composition to refuse imports or styles in.

**Migration**: None; the publisher sets every style.

### Requirement: Model references

**Reason**: Replaced by "Parts named on the overview", which refuses an unknown part at its path in the model.

**Migration**: Name the part's id in a step or a station.

### Requirement: Missing composition

**Reason**: The statement is part of the model; no file is looked for.

**Migration**: Move the composition's content into the model's `overview`.
