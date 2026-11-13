## ADDED Requirements

### Requirement: Part details without word spaces

In an edition whose language is written without spaces between words, a part's
details SHALL wrap as a paragraph, each line filled by the width Typst sets it
in. Each line but a detail's last SHALL be spread to the details' measure,
unless its slack is more than a tenth of an em for each place it opens; any
other line stays flush left. A run Typst measures over half a point wider than
its measure SHALL be refused with `edition_text_wider`.

#### Scenario: A Chinese part with a two-line detail

- **WHEN** a Chinese edition sets a part whose detail takes two lines and whose
  first line fills its measure
- **THEN** the first line ends at the measure's right edge and the second line
  is flush left

#### Scenario: A line broken early

- **WHEN** a line of a detail has more slack than a tenth of an em for each
  place it opens, as a line broken before a long Latin word
- **THEN** that line is flush left

#### Scenario: A line of Han and letters

- **WHEN** a line of a detail holds Han and Latin letters
- **THEN** it holds as much as its measure takes at the width Typst sets it in,
  though the CJK face alone would measure it wider than the measure

#### Scenario: A list of Han items

- **WHEN** a detail lists items of Han text and the next item does not fit the
  line
- **THEN** the line ends inside that item, within a character of its measure

#### Scenario: An English part

- **WHEN** an English edition sets a part whose detail takes two lines
- **THEN** both lines are flush left, and a list's items are kept whole

### Requirement: Detail orphans

In an edition whose language is written without spaces between words, a
detail's last line SHALL NOT hold one character alone, with or without the
marks beside it: it SHALL take the unit before it from the line above, where
the two fit the measure.

#### Scenario: A detail that runs one character over

- **WHEN** a detail's text runs one Han character past the end of a line
- **THEN** its last line holds that character and the one before it, and the
  line above ends a character short

#### Scenario: A last line of two characters

- **WHEN** a detail's last line holds two Han characters, or a word of letters
- **THEN** its lines stay as they wrapped

## MODIFIED Requirements

### Requirement: Edition typography

Prose, the summary beside or above a figure, scope, limits and reading note,
SHALL be justified on optimized lines, hyphenated in the model's language, with
word spaces from 80 to 125 percent and tracking from −0.012 to +0.025 em, at
most 32 em to a line. Titles, questions, labels, paths and figure text SHALL NOT
be justified, except the details of parts in a language written without spaces
between words.

#### Scenario: Notes at a reading measure

- **WHEN** the scope is set on the contents
- **THEN** no line of it is wider than 32 em of its size
