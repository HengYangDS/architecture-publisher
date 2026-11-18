## ADDED Requirements

### Requirement: A note without spaces justified to its own measure

In a column narrower than twenty ems, the measure of a text written without
spaces between words SHALL be its own longest line, the last included. Every
shorter line but the last SHALL be spread to that measure where it opens a
tenth of an em or less at each place; a line that would open more, or has no
place to open, SHALL be set as it is, flush left. No check SHALL ask an author
to reword the text so that its lines fill.

#### Scenario: A first line before a word that does not fit

- **WHEN** a Chinese note in a column of seven ems sets six characters on its first line before a Latin word that takes the second
- **THEN** the six characters stand as close as in a note on one line, and the note ends short of the column's edge

#### Scenario: Two lines of nearly one length

- **WHEN** the first two lines of a Chinese note of three differ by half an em, and the shorter holds eight characters
- **THEN** both end at one edge, the longer line's

#### Scenario: A line far short of the longest

- **WHEN** a line of a note would open a quarter of an em at each place to reach the note's longest line
- **THEN** it is set as it is, flush left, and the build's warnings name no line of the note

## MODIFIED Requirements

### Requirement: Running text justified

A note or a text of the overview that takes more than one line SHALL be
justified, its last line set short. In a language written without spaces
between words it SHALL be set line by line on the fewest lines that hold it:
first with no line before the last of one character, then with its loosest
line opening least to the column. In a measure of twenty ems or more every
line but the last SHALL be spread to it. A name, a heading, a term and a text
on one line SHALL be set as they are.

#### Scenario: A line of Han before a word that does not fit

- **WHEN** a Chinese text in a measure of twenty-four ems breaks before a Latin word that does not fit on the line
- **THEN** the lines around it give that line a character, and every line but the last ends at the column's edge

#### Scenario: One character before a long word

- **WHEN** two characters stand before a word that takes the next line alone, and the note takes three lines either way
- **THEN** the two characters share the first line, and no line before the last holds one character alone

### Requirement: A line that cannot be spread is named

In a measure of twenty ems or more, a line of a text set line by line that
would open more than three tenths of an em at each place, or that has no place
to open, SHALL stay as it is set, and a check SHALL report it with
`overview_line_loose`, naming the line and the text it belongs to. In a
narrower column no line SHALL be reported.

#### Scenario: Two characters before a long word

- **WHEN** two characters of a Chinese text in a measure of twenty-four ems stand on a line before a word that takes the next line alone
- **THEN** both lines stay as they are set, and the check's warnings name each with `overview_line_loose`

#### Scenario: A short line in a narrow column

- **WHEN** a line of a Chinese note in a column of eight ems ends two ems short of the note's longest line
- **THEN** the check's warnings name no line of the note

### Requirement: Texts on one module and one grid of baselines

Every name, note, term, cell and text of the overview SHALL begin a whole
number of 8 point modules from the left margin, and a text justified to its
column SHALL end at one. Under a block's top and under a course's names, every
step down to a baseline SHALL be a whole number of half lines of the page's
spacing, and a name on two lines SHALL keep the pitch of the notes beside it.

#### Scenario: Two left edges that nearly meet

- **WHEN** a list's text and a station's name in another row would begin within three points of each other by their measured widths
- **THEN** both begin on the module: at one edge, or eight points apart or more

#### Scenario: Two headed texts beside a list

- **WHEN** two headed texts stand one under another beside a list of four items
- **THEN** each text's baseline is a baseline of the list's rows, or stands half a line or more off them
