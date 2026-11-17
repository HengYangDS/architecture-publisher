## ADDED Requirements

### Requirement: An overview stated in the model

A model MAY state its overview in `overview` as blocks without positions: a
claim and a lead; one course of steps; further courses; and facts, which are
headed lists, tables and groups of lists, in order. The publisher SHALL draw
the overview from that statement and from nothing else the author gives.

#### Scenario: Every kind of block

- **WHEN** a model states a claim, a lead, a course with a step of three stations on two tracks and a line, a
  further course with an outcome, a list, a table and a group
- **THEN** the build draws one overview page that sets every text of the statement

#### Scenario: No overview stated

- **WHEN** a model states no overview
- **THEN** the edition has no overview page, as today

### Requirement: A course and its steps

A course SHALL be an ordered list of steps, each a label with an optional note
and text. A step MAY hold stations and run them on parallel tracks. A course
MAY carry lines from one step or station to others, each with a sentence. A
further course SHALL be a title and ordered stations, with an optional
labelled step, one optional outcome that leaves a station, and an optional
text.

#### Scenario: A step on parallel tracks

- **WHEN** a step holds three stations and runs them on two tracks
- **THEN** the course draws that step's three stations on each of two tracks between the steps before and after it

### Requirement: The overview laid out by the publisher

The publisher SHALL set the masthead with the count of files the build read,
the course across the first band at the content width, its steps as wide as
their stations need, and the other blocks in order in rows of two halves or
three thirds: a course or a table takes a half, a list or a group a third, and
two lists in a row take halves. A page whose blocks are taller than the live
area SHALL be refused with `overview_too_tall`, naming the first block that
does not fit.

#### Scenario: A course and a table side by side

- **WHEN** a statement holds a further course followed by a table
- **THEN** the two stand in one row, each in a half

#### Scenario: Too much for one page

- **WHEN** a statement holds more lists than the page can hold below its course
- **THEN** the build refuses with `overview_too_tall` and names the first list that does not fit

### Requirement: The overview's marks

A station SHALL be drawn as a ring on its course's line, the first and the last
station of a course as larger rings, a stretch on parallel tracks as thinner
lines beside the course, a line between steps over the course with its
sentence, and the outcome that leaves a course in the accent with its sentence.
No other mark SHALL be drawn on a course.

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
