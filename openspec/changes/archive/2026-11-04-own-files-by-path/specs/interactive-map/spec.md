## MODIFIED Requirements

### Requirement: Page sources

When the model declares a repository URL and revision, each component's first
file that the page does not withhold SHALL be a numbered page source pinned to
the revision, listed under the label of that component; a component without
details SHALL name that file in its step. A component's first file SHALL be the
first file of its first claim, in path order within a directory; without a
checkout, a component is cited only when its first claim names one file.

#### Scenario: A repository without a URL

- **WHEN** the model declares a repository name and revision but no URL
- **THEN** no step cites a source

#### Scenario: A component without details

- **WHEN** a component declares no details and first claims `src/cli/main.mjs`
- **THEN** its step reads that path followed by its source number

#### Scenario: A first claim of a directory

- **WHEN** a component first claims `src/cli/` and the revision holds
  `src/cli/args.mjs` and `src/cli/main.mjs` in the scope
- **THEN** the page cites `src/cli/args.mjs` for that component

### Requirement: Withheld sources

A file that Archify will not cite on a page, such as a file under a `secrets`
directory, SHALL be withheld from the page and recorded as withheld in the
manifest, and the component it belongs to SHALL cite its next file. A page
whose Archify findings name no further file to withhold SHALL be refused with
those findings.

#### Scenario: A source in a sensitive file class

- **WHEN** a component's first file lies under `internal/secrets/`
- **THEN** the page cites the component's next file, or none
- **AND** the manifest lists the first file as withheld

#### Scenario: A finding that names no cited source

- **WHEN** Archify's finding names a source position past the sources the page
  cites
- **THEN** no file is withheld and the page is refused with the finding
