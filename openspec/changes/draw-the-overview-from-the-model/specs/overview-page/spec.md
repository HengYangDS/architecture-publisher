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
forks of two or more branches that stand side by side with no order. A further
course SHALL be a title and ordered stations, with an optional labelled step,
one optional outcome that leaves a station, and an optional text.

#### Scenario: A fork of siblings

- **WHEN** a step holds a fork of two branches and then one station
- **THEN** the step takes three cells, and the two branches stand side by side under the course, each in a cell

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

### Requirement: The overview's marks

A station SHALL be drawn as a ring on its course's line, the first and the last
station of a course as larger rings, a fork's branches as smaller rings on a
bar under the course, a spur as a smaller ring under its point, a stretch on
parallel tracks as thinner lines beside the course, a line between points over
the course, or under it when an end is a spur, with its sentence, and the
outcome that leaves a course in the accent with its sentence. No other mark
SHALL be drawn on a course.

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
