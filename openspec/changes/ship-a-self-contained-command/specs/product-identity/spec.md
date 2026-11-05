## ADDED Requirements

### Requirement: A release delivers a self-contained command

Each release SHALL deliver, for every platform its CI verifies, one archive that
holds the `archpub` command, the Node.js runtime and Typst it runs, the package
and their licenses. It SHALL also deliver a mise declaration that names each
archive with its SHA-256. Unpacked anywhere, the command SHALL run with only Git
on the path and build the same bytes as the package on that platform. No other
platform SHALL be offered.

#### Scenario: A machine without Node.js builds a work

- **WHEN** the archive for the machine's platform is unpacked and its
  `archpub build` runs with no Node.js or Typst on the path
- **THEN** it delivers the posters, the page and the overview
- **AND** every delivered file is byte-identical to the build from the package on
  that platform

#### Scenario: A project pins the command

- **WHEN** a project reads the release's mise declaration
- **THEN** it names each archive's URL, its SHA-256 and the archive directory that
  holds the command

#### Scenario: A platform the CI does not verify

- **WHEN** a release is assembled for a platform that the CI does not verify or
  that the lock does not pin
- **THEN** no archive is produced for it, and the declaration does not name it
