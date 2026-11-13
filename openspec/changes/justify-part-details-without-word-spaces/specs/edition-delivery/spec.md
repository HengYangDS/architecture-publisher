## ADDED Requirements

### Requirement: Part details without word spaces

In an edition whose language is written without spaces between words, each line
of a part's details except a detail's last SHALL be spread to the measure the
part's details were wrapped to, when the line fills at least nine tenths of that
measure; any other line stays flush left. A run Typst measures wider than its
measure SHALL be refused with `edition_text_wider`.

#### Scenario: A Chinese part with a two-line detail

- **WHEN** a Chinese edition sets a part whose detail takes two lines and whose
  first line fills its measure
- **THEN** the first line ends at the measure's right edge and the second line
  is flush left

#### Scenario: A line broken early

- **WHEN** a line of a detail fills less than nine tenths of its measure, as
  before a long Latin word
- **THEN** that line is flush left

#### Scenario: An English part

- **WHEN** an English edition sets a part whose detail takes two lines
- **THEN** both lines are flush left

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
