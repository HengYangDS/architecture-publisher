## ADDED Requirements

### Requirement: The package bundles what its command line is built on

The package SHALL declare the libraries its command line is built on as dependencies and bundle them, so the
packed package and each release archive hold them with their licences. Only modules of the command line SHALL
import them, and a test SHALL refuse an import of them elsewhere in the shipped source.

#### Scenario: A layout module imports a bundled library

- **WHEN** a module outside the command line's directory imports a bundled dependency
- **THEN** the import test fails and names the module

#### Scenario: The archive on a machine without a network

- **WHEN** a release archive is unpacked and `archpub --help` runs with no network
- **THEN** the help is printed from the libraries the archive holds
