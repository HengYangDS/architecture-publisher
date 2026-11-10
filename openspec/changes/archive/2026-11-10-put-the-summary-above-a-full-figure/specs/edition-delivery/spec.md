## MODIFIED Requirements

### Requirement: Plate reading

Where a plate's figure leaves part of the body's width, the plate SHALL set
its view's reading beside the figure, 40 points from it: the view's summary,
and then, when they fit, under the publisher's heading for where each part
lives, each shown component's label with its claimed paths as the model
declares them, in reading order. The heading SHALL be in the model's language.

#### Scenario: A summary beside a narrow figure

- **WHEN** a view with a summary is set on a plate whose figure takes 65
  percent of the body
- **THEN** the summary can be extracted as text from that plate's page
- **AND** each shown component that claims files is listed with its paths

### Requirement: Plate fit in check

`archpub check` SHALL report, for each plate, its figure's share of the body,
the balance gates it misses and whether its view's reading is set beside the
figure, set above it or left out.

#### Scenario: A plate that left its reading out

- **WHEN** a view with a summary cannot give up width or height without more
  crossings or route defects
- **THEN** `archpub check` names that plate as leaving its reading out

#### Scenario: A plate with its reading above the figure

- **WHEN** a view's summary is set above its figure
- **THEN** `archpub check` names that plate as setting its reading above the
  figure

### Requirement: Reading measure

A summary beside a figure SHALL be justified when its column holds at least 24
em of its size and set flush left otherwise. A reading beside a figure whose
summary and paths are taller than the body SHALL set its summary alone, without
the heading or the paths. A summary alone taller than the body, or paths taller
than the body beside no summary, SHALL be refused with
`edition_reading_too_long` and the view's title, since text is never shrunk.

#### Scenario: Paths that do not fit beside a summary

- **WHEN** a view's summary fits the body but its summary and paths do not
- **THEN** the plate sets the summary alone
- **AND** it sets neither the heading for where each part lives nor any path

#### Scenario: A reading too long for its column

- **WHEN** a view's summary alone needs more than the body's height
- **THEN** the build refuses with `edition_reading_too_long` naming the view

### Requirement: Edition typography

Prose, the summary beside a figure, scope, limits and reading note, SHALL be
justified on optimized lines, hyphenated in the model's language, with word
spaces from 80 to 125 percent and tracking from −0.012 to +0.025 em, at most 32
em to a line. A summary above a figure, titles, questions, labels and figure
text SHALL NOT be justified.

#### Scenario: Notes at a reading measure

- **WHEN** the scope is set on the contents
- **THEN** no line of it is wider than 32 em of its size

## ADDED Requirements

### Requirement: A summary above the figure

A view with a summary whose figure wires worse at 80 percent of the body's
width SHALL keep the full width and set its summary above the figure, under
the plate's question, when the figure wires no worse at the height left below
it than at the full body. The summary SHALL be set at 17 points in the
summary's face, on the lines the publisher breaks within 32 em, flush left,
without the heading for where each part lives or the paths.

#### Scenario: A figure that cannot narrow but can shorten

- **WHEN** a view's figure crosses more wires at 80 percent of the width than at
  the full width, but no more at the full width below its summary
- **THEN** the plate sets the summary above the full-width figure
- **AND** every line of the summary is at most 32 em of its size

#### Scenario: A figure that can neither narrow nor shorten

- **WHEN** a view's figure wires worse both at 80 percent of the width and below
  its summary
- **THEN** the plate leaves its reading out, with the figure at the full body
