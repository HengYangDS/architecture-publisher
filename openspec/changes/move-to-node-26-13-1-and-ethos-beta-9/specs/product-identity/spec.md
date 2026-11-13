## MODIFIED Requirements

### Requirement: A release delivers a self-contained command

Each release SHALL deliver one archive for every platform its CI verifies,
holding the `archpub` command, the Node.js and Typst releases the repository's
lock pins, the package and their licenses, and a mise declaration naming each
archive with its SHA-256. The platforms SHALL be Linux and Windows on ARM64 and
x86-64, x86-64 verified by GitHub's CI, and macOS on ARM64. Unpacked anywhere,
the command SHALL run with only Git on the path and build the same bytes as the
package on that platform.

#### Scenario: A machine without Node.js builds a work

- **WHEN** the archive for the machine's platform is unpacked and its
  `archpub build` runs with no Node.js or Typst on the path
- **THEN** it delivers the print edition, its images and the page
- **AND** every delivered file is byte-identical to the build from the package on
  that platform

#### Scenario: The archive runs the locked Node.js

- **WHEN** a release is assembled
- **THEN** each archive holds the Node.js release the lock pins for its platform,
  read from the lock's URL and checked against the lock's SHA-256

#### Scenario: A project pins the command

- **WHEN** a project reads the release's mise declaration
- **THEN** it names each archive's URL, its SHA-256 and the archive directory that
  holds the command

#### Scenario: An x86-64 Linux machine

- **WHEN** a release is assembled
- **THEN** it holds a `linux-x64` and a `windows-x64` archive beside the three
  ARM64 archives, and the declaration names all five

#### Scenario: A platform the CI does not verify

- **WHEN** a release is assembled for a platform that the CI does not verify or
  that the lock does not pin
- **THEN** no archive is produced for it, and the declaration does not name it
