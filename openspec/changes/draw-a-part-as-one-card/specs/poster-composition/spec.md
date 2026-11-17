## ADDED Requirements

### Requirement: One part

Every part SHALL be drawn as one card of regions, from its top: its name; the
strip of the files it owns; a caption of its kind's icon before the kind's
label, with the number and size of its files; and, where its plate has the
room, its details. Its outline SHALL tell its status and its ground whether it
lies inside the repository. A region SHALL be drawn only where the part has the
fact: a part that owns no file has no strip and no count.

#### Scenario: A part that owns files

- **WHEN** a part owns one file of 21 KB and states one detail
- **THEN** its card holds its name, its strip, its kind's icon and label with `1 file, 21 KB`, and, on a plate with
  the room, the detail, in that order from the top

#### Scenario: A part that owns no file

- **WHEN** a part owns no file
- **THEN** its card holds its name, its kind's icon and label and its details, and no strip, no count and no words
  that say it owns nothing

### Requirement: Details where a plate has the room

A plate SHALL be composed for its parts' compact cards, which set no details.
Its cards SHALL set every detail their parts state exactly when the view can be
laid out with them in the same width and height at the same type step with no
more crossings and, at equal crossings, no more route defects. A plate's record
SHALL say whether its cards set their details.

#### Scenario: A plate with room

- **WHEN** a view of six parts is composed at the largest type step and holds its parts' details there with the
  same wiring
- **THEN** every card sets its part's details, and the plate's record says so

#### Scenario: Details that would cost type or wiring

- **WHEN** a view's parts each state four long details that the composition chosen cannot hold at its type step
- **THEN** no card sets a detail, and the plate has the crossings, the route defects and the type step it has when
  its parts state nothing

### Requirement: A caption that breaks

A part's caption SHALL stand on one line, the kind at the left and the count
ending at the card's right padding, two ems apart at least. On a plate with a
card too narrow for that line every count SHALL stand on a line of its own
under its kind, and no card SHALL be widened for the one line, so the captions
of one plate have one form. A card narrower than the kind with its icon, or
than the count, SHALL NOT be a candidate.

#### Scenario: A narrow card

- **WHEN** a card of a plate is narrower than its kind and its count on one line and wider than either
- **THEN** every count of that plate stands under its kind, and the layout is a candidate

#### Scenario: A composition too wide with captions on one line

- **WHEN** a composition whose cards are as wide as their captions on one line is wider than its field
- **THEN** it is laid out with every count under its kind, and is a candidate where it then fits

### Requirement: The boundary's name on its cards' text edge

The boundary's name SHALL start on the text edge of a card that stands at the
boundary's left edge, so the name and the names of the cards under it share one
left edge at every type step. A wire that crosses the boundary's top edge where
the name would stand SHALL move the name to the right, clear of it.

#### Scenario: A boundary over a column of cards

- **WHEN** a plate with a boundary is drawn at any type step and no wire crosses the top edge near the name
- **THEN** the boundary's name and the names of the leftmost cards inside it start at one x

### Requirement: Runs of a part's text without word spaces

In an edition whose language is written without spaces between words, the run
of each line of a part's details SHALL report the width Typst sets the line in,
and the run of a line to be spread SHALL also name its measure. A part's count
SHALL report that width too and, on its kind's line, SHALL end at its card's
right padding.

#### Scenario: A line to be spread

- **WHEN** a plate of a language written without spaces between words holds a
  detail line, not its detail's last, whose slack is no more than a tenth of an
  em for each place it opens
- **THEN** that line's run names the measure, and the part's text block is
  measured at it

#### Scenario: A detail's last line

- **WHEN** a plate of a language written without spaces between words holds a
  detail's last line of Han and letters
- **THEN** its run names no measure and reports the width Typst sets it in,
  narrower than the CJK face alone measures it

#### Scenario: A part's count

- **WHEN** a Chinese plate sets a part's count on its kind's line
- **THEN** it ends at the card's right padding, and its run reports the width
  Typst sets it in

## MODIFIED Requirements

### Requirement: Cards as large as their text

A card SHALL be as wide as its label, its strip, its caption and its longest
detail need on one line, within card measures of 16 ems for a label and 24 ems
for a detail, and as wide as the widest card in its lattice column, and no
wider; a field too narrow for that width narrows the cards and their text
wraps. On a plate that sets its counts under their kinds a caption needs the
wider of its kind with its icon and its count.

#### Scenario: A short card in a row of tall ones

- **WHEN** a row holds a card with one detail line beside a card with five
- **THEN** both cards share the row's height and the short card's spare height
  lies below its text

#### Scenario: Cards of one column

- **WHEN** one lattice column holds a card with a short label above a card
  with a long one
- **THEN** both cards take the longer card's width

### Requirement: Strips keep to their boxes

A strip SHALL never be shortened to fit a column: no column of a view is
narrower than its longest strip within its card's padding. When a view cannot
hold the edition's strips, the edition SHALL draw every strip shorter, 320 px
and then 208 px for its largest part, on one scale still, and plan its views
again.

#### Scenario: A strip keeps to its box

- **WHEN** a view's columns would be narrower than its longest strip
- **THEN** that layout is refused and the plate tries another wrapping, so no
  strip runs past its card or the boundary

#### Scenario: A shorter scale for the edition

- **WHEN** a view cannot be laid out with strips of 320 px for the largest part
- **THEN** every plate of the edition draws its strips at 208 px for the largest
  part, and each key's sample strip shows that scale

### Requirement: Citation counts and the hub

In an edition with file facts, a relation that cites files SHALL carry their number once near its source, in the
smallest figure type and its line's colour, and no tick. The part with the most incoming relations of a view, when
it has at least three and more than any other, SHALL be the hub. A relation into the hub, unless retired, SHALL be
drawn with the value table's emphasis, in the oldest dye, ending inside its arrowhead. A count with no clear place
SHALL raise `citation_count_touches`. In an edition without file facts every line SHALL be drawn alike and carry no
number.

#### Scenario: A hub and its citations

- **WHEN** four relations of a view end at the supplies and one of them cites two files
- **THEN** those four lines are drawn at twice the weight of the view's other lines, in the oldest dye, each ending
  inside an arrowhead 1.45 times as large as the other lines'
- **AND** that line carries the number 2 near its source and no tick
- **AND** the key names the supplies

#### Scenario: A relation that cites one file

- **WHEN** a relation cites one file
- **THEN** its line carries the number 1

#### Scenario: A relation that cites no file

- **WHEN** a relation cites no file
- **THEN** its line carries no number

#### Scenario: A planned relation into the hub

- **WHEN** a planned relation ends at the hub
- **THEN** it is drawn at twice the weight, in the oldest dye and in the pattern of a planned relation

#### Scenario: A retired relation into the hub

- **WHEN** a retired relation ends at the hub
- **THEN** it is drawn at the weight, in the colour and in the pattern of a retired relation

#### Scenario: A count with no clear place

- **WHEN** no place along a relation's own line holds its figures clear of every part, relation label, line, the
  boundary and every other count
- **THEN** the count stands at the first place from the source end and the plate is still built
- **AND** the result carries the warning `citation_count_touches` with the plate's number and the relation's id

#### Scenario: An edition without file facts

- **WHEN** a model is built without a checkout
- **THEN** no line of its plates is heavier than another for a hub, and none carries a number

### Requirement: Plate drawing

The engine SHALL draw a plate as an SVG of its shapes, with any icons as inline
paths and no text, paper, head, key or notes, and SHALL report its text as runs:
each run's text, position, size, weight, colour and the width it measured, and
the component whose title it is. Its colours SHALL come from the edition's
resolved palette only, and relation labels SHALL be set in the regular weight,
so they read under the parts they join.

#### Scenario: Shapes without text

- **WHEN** a plate is drawn
- **THEN** its SVG holds no text and no glyph outlines
- **AND** every card label, detail and relation label is one of its runs

## REMOVED Requirements

### Requirement: Marks keep the gates

**Reason**: There is one way of drawing a part, so no plate is drawn with one of two marks.

**Migration**: None. Every plate passes the same containment, balance, type floor, whole-word text and routing
gates as before, and a view no layout draws is refused.

### Requirement: Runs of details without word spaces

**Reason**: It spoke of a strip part's counts ending at their box's edge; a part's count now ends at its card's
padding. The requirement "Runs of a part's text without word spaces" replaces it.

**Migration**: None; the runs of a part's details report what they reported.
