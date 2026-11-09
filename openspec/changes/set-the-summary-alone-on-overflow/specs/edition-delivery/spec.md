## MODIFIED Requirements

### Requirement: Plate reading

Where a plate's figure leaves part of the body, the plate SHALL set its view's
reading in the rest, 40 points from the figure: the view's summary, and then,
when they fit, under the publisher's heading for where each part lives, each
shown component's label with its claimed paths as the model declares them, in
reading order. The heading SHALL be in the model's language.

#### Scenario: A summary beside a narrow figure

- **WHEN** a view with a summary is set on a plate whose figure takes 65
  percent of the body
- **THEN** the summary can be extracted as text from that plate's page
- **AND** each shown component that claims files is listed with its paths

### Requirement: Reading measure

A plate's summary SHALL be justified when its column holds at least 24 em of its
size and set flush left otherwise. A reading whose summary and paths are taller
than the body SHALL set its summary alone, without the heading or the paths. A
summary alone taller than the body, or paths taller than the body beside no
summary, SHALL be refused with `edition_reading_too_long` and the view's title,
since text is never shrunk.

#### Scenario: Paths that do not fit beside a summary

- **WHEN** a view's summary fits the body but its summary and paths do not
- **THEN** the plate sets the summary alone
- **AND** it sets neither the heading for where each part lives nor any path

#### Scenario: A reading too long for its column

- **WHEN** a view's summary alone needs more than the body's height
- **THEN** the build refuses with `edition_reading_too_long` naming the view
