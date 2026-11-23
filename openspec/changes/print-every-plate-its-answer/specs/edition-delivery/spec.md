## ADDED Requirements

### Requirement: An answer in the head band

Where a plate's figure keeps the full body and sets no summary above it, the
plate's head SHALL set its view's summary right of the title and of the
question's line with its line back, 48 points clear of the wider, from the
title's baseline at 17 points on a 24-point pitch, in three lines at most above
the body. A longer one SHALL be refused with `edition_reading_too_long`.

#### Scenario: A silent plate's answer

- **WHEN** a view's figure can neither narrow nor shorten below its summary
- **THEN** the summary begins on the title's baseline, clear of the question, and ends above the body

#### Scenario: An answer too long for the head

- **WHEN** the summary would take more than three lines there
- **THEN** the build refuses with `edition_reading_too_long`

## MODIFIED Requirements

### Requirement: A summary above the figure

A view with a summary whose figure wires worse at 80 percent of the body's
width SHALL keep the full width and set its summary above the figure, under
the plate's question, when the figure wires no worse at the height left below
it than at the full body. The summary SHALL be set at 17 points within 32 em,
justified when that takes no more lines than the publisher reserved and
otherwise on the publisher's lines, flush left, without the heading for where
each part lives or the paths.

#### Scenario: A figure that cannot narrow but can shorten

- **WHEN** a view's figure crosses more wires at 80 percent of the width than at
  the full width, but no more at the full width below its summary
- **THEN** the plate sets the summary above the full-width figure, justified
- **AND** every line of the summary is at most 32 em of its size

#### Scenario: A justified summary that would need more lines

- **WHEN** the justified summary would take more lines than the publisher
  reserved above the figure
- **THEN** the plate sets the publisher's own lines, flush left

#### Scenario: A figure that can neither narrow nor shorten

- **WHEN** a view's figure wires worse both at 80 percent of the width and below
  its summary
- **THEN** the figure keeps the full body, and the summary stands in the plate's head
