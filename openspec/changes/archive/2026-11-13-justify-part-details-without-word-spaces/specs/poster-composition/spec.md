## ADDED Requirements

### Requirement: Runs of details without word spaces

In an edition whose language is written without spaces between words, the run
of each line of a part's details SHALL report the width Typst sets the line in,
and the run of a line to be spread SHALL also name its measure. A strip part's
counts SHALL report that width too and SHALL end at their box's edge.

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

#### Scenario: A strip part's counts

- **WHEN** a Chinese strip plate sets a part's counts
- **THEN** they end at the box's edge, and their run reports the width Typst
  sets them in

## MODIFIED Requirements

### Requirement: Faces of figure text

Figure text SHALL be measured in the house faces, each run in the first face of
its weight's chain that draws it whole: Source Sans 3, then Noto Sans CJK SC.
Each house face SHALL be measured with the pair kerning of its own `kern`
feature, so a run of letters is as wide as Typst sets it. A text in a
right-to-left or shaped script, or with a character no face draws, SHALL be
refused.

#### Scenario: Letters the CJK face lacks

- **WHEN** a component label is `Łódź`
- **THEN** the label is measured in Source Sans 3 and the build is not refused

#### Scenario: An Arabic title

- **WHEN** a model's title is written in Arabic
- **THEN** the build refuses with `glyphs_missing` and the problem
  `script_unsupported` at `/title`

#### Scenario: Pairs kerned apart

- **WHEN** a part's detail reads `format: (json)`
- **THEN** its run is measured as wide as Typst sets it, with the bracket and
  the j apart, and the build is not refused
