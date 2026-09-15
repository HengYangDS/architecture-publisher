# source-intake Specification

## Purpose
Verify explicitly selected source files as a closed, portable, content-bound bundle without executing their contents or requiring a development checkout. Report file integrity separately from semantic acceptance and official source replay.

## Requirements

### Requirement: Explicit content-bound source consumption

The publisher SHALL verify an explicitly selected manifest digest and every
listed member's size and SHA-256 without requiring Git metadata, ETHOS,
OpenSpec, network access or executable source code.

#### Scenario: A source has an opaque revision

- **WHEN** a valid closed bundle identifies a non-Git source revision
- **THEN** the same member bytes and content identity are returned after relocation
- **AND** the result claims only source-file integrity, not semantic acceptance or official replay

#### Scenario: The selected manifest or a member changes

- **WHEN** supplied bytes differ from the caller's selected manifest digest or a listed member identity
- **THEN** verification fails before a successful result is emitted

### Requirement: Closed and portable member paths

The publisher SHALL reject undeclared, missing, duplicate, escaping, ambiguous,
symlinked or non-regular source members, with declared resource limits.

#### Scenario: A member points outside the bundle

- **WHEN** a member uses an absolute, parent, drive-qualified or symlink path
- **THEN** verification fails rather than consuming the external object

#### Scenario: The bundle contains an extra file

- **WHEN** a regular file not declared in the manifest exists under the source root
- **THEN** verification fails with a machine-readable error

### Requirement: Independent installed use

The publisher SHALL expose a packaged source verification command with no
external runtime dependencies beyond its declared Node runtime.

#### Scenario: No development environment is available

- **WHEN** the installed command runs in a relocated directory with a clean HOME, no Git checkout and no ETHOS or Python on PATH
- **THEN** valid file input succeeds and invalid file input still fails
