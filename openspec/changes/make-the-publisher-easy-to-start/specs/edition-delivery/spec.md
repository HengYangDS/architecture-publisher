## MODIFIED Requirements

### Requirement: Machine-readable results

Every command SHALL accept `--json` and then print exactly one JSON object with
`ok` and either its outputs or its diagnostics. The exit status SHALL be 0 on
success, 1 for a refused input, 2 for a usage error and 3 for any other
failure, whose JSON object SHALL carry the code `internal_error` and a message.
A result MAY carry `warnings`, each with a code and a message, which text output
prints one to a line.

#### Scenario: A refused build with JSON output

- **WHEN** a build with `--json` refuses an invalid model
- **THEN** standard output holds one JSON object with `ok: false` and the
  diagnostics
- **AND** the exit status is 1

#### Scenario: A manifest that cannot be read

- **WHEN** `archpub accept --json` meets a `manifest.json` that is a directory
- **THEN** standard output holds one JSON object with `ok: false` and the code
  `internal_error`
- **AND** the exit status is 3

#### Scenario: The version

- **WHEN** `archpub --version --json` runs
- **THEN** standard output holds one JSON object with `ok: true` and the
  package version

### Requirement: Reading measure

A summary beside a figure SHALL be justified as the edition's prose is, at any
width of its column and in any language, with its last line set short. A
reading beside a figure whose summary and paths are taller than the body SHALL
set its summary alone, without the heading or the paths. A summary alone
taller than the body, or paths taller than the body beside no summary, SHALL be
refused with `edition_reading_too_long` and the view's title, since text is
never shrunk.

#### Scenario: A summary in a narrow column

- **WHEN** a view's figure takes 80 percent of the body and its reading column
  holds about 15 em
- **THEN** every line of the summary but the last ends at the column's edge

#### Scenario: Paths that do not fit beside a summary

- **WHEN** a view's summary fits the body but its summary and paths do not
- **THEN** the plate sets the summary alone
- **AND** it sets neither the heading for where each part lives nor any path

#### Scenario: A reading too long for its column

- **WHEN** a view's summary alone needs more than the body's height
- **THEN** the build refuses with `edition_reading_too_long` naming the view

### Requirement: Edition typography

Prose, the summary beside or above a figure, scope, limits and reading note,
SHALL be justified on optimized lines, hyphenated in the model's language, with
word spaces from 80 to 125 percent and tracking from −0.012 to +0.025 em, at
most 32 em to a line. Titles, questions, labels, paths and figure text SHALL NOT
be justified.

#### Scenario: Notes at a reading measure

- **WHEN** the scope is set on the contents
- **THEN** no line of it is wider than 32 em of its size

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
- **THEN** the plate leaves its reading out, with the figure at the full body

## ADDED Requirements

### Requirement: Command help

`archpub --help` SHALL print the usage, `archpub <command> --help` that
command's usage, what it does and the options it takes, and `archpub --version`
the package version, each with status 0. A usage error SHALL print the usage of
the command it names.

#### Scenario: One command's usage

- **WHEN** `archpub build --help` runs
- **THEN** standard output holds the usage of `archpub build` and its options
- **AND** the exit status is 0
