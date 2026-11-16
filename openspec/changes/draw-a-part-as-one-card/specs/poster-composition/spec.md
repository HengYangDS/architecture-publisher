## ADDED Requirements

### Requirement: One part

Every part SHALL be drawn as one card of regions, from its top: its name; the
strip of the files it owns; a caption of its kind's icon before the kind's
label, with the number and size of its files; and its details. Its outline
SHALL tell its status and its ground whether it lies inside the repository. A
region SHALL be drawn only where the part has the fact: a part that owns no
file has no strip and no count.

#### Scenario: A part that owns files

- **WHEN** a part owns one file of 21 KB and states one detail
- **THEN** its card holds its name, its strip, its kind's icon and label with `1 file, 21 KB`, and the detail, in
  that order from the top

#### Scenario: A part that owns no file

- **WHEN** a part owns no file
- **THEN** its card holds its name, its kind's icon and label and its details, and no strip, no count and no words
  that say it owns nothing

### Requirement: A caption that breaks

A part's caption SHALL stand on one line, the kind at the left and the count
ending at the card's right padding, two ems apart at least. In a card too
narrow for that line the count SHALL stand on a line of its own under the kind.
A card narrower than the kind with its icon, or than the count, SHALL NOT be a
candidate.

#### Scenario: A narrow card

- **WHEN** a card is narrower than its kind and its count on one line and wider than either
- **THEN** the count stands under the kind, and the layout is a candidate

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
wraps.

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
hold the edition's strips, the edition SHALL draw every strip shorter, 360 px
and then 240 px for its largest part, on one scale still, and plan its views
again.

#### Scenario: A strip keeps to its box

- **WHEN** a view's columns would be narrower than its longest strip
- **THEN** that layout is refused and the plate tries another wrapping, so no
  strip runs past its card or the boundary

#### Scenario: A shorter scale for the edition

- **WHEN** a view cannot be laid out with strips of 360 px for the largest part
- **THEN** every plate of the edition draws its strips at 240 px for the largest
  part, and each key's sample strip shows that scale

## REMOVED Requirements

### Requirement: Marks keep the gates

**Reason**: There is one way of drawing a part, so no plate is drawn with one of two marks.

**Migration**: None. Every plate passes the same containment, balance, type floor, whole-word text and routing
gates as before, and a view no layout draws is refused.

### Requirement: Runs of details without word spaces

**Reason**: It spoke of a strip part's counts ending at their box's edge; a part's count now ends at its card's
padding. The requirement "Runs of a part's text without word spaces" replaces it.

**Migration**: None; the runs of a part's details report what they reported.
