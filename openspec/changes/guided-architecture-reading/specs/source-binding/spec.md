## Purpose

Bind the sources an Architecture Model declares to exact repository content at a
pinned revision without changing or contacting the repository.

## ADDED Requirements

### Requirement: Content-digest binding at a pinned revision

When a build or check receives a repository checkout, the publisher SHALL
read every declared source path at the model's repository revision from the
repository's object store and SHALL compute its SHA-256 digest. A declared
digest SHALL equal the computed digest. A missing revision, a missing path or
a different digest SHALL refuse the build and name the source id, the path and
both digests.

#### Scenario: Matching sources

- **WHEN** every declared path exists at the revision with its declared digest
- **THEN** the manifest records each source as verified with its digest

#### Scenario: A changed source

- **WHEN** one source's bytes at the revision differ from its declared digest
- **THEN** the build refuses with that source id, path, declared digest and
  computed digest
- **AND** no output directory is created

#### Scenario: A source without a declared digest

- **WHEN** a source declares a path but no digest
- **THEN** the manifest records the computed digest and marks it verified at
  the revision

### Requirement: Unverified sources are disclosed

Without a repository checkout, the publisher SHALL record every source as
declared and unverified, and every poster footnote SHALL state that sources
were not verified.

#### Scenario: A build without a checkout

- **WHEN** a model with sources is built without a repository
- **THEN** the manifest marks every source unverified
- **AND** each poster footnote says the sources were not verified

### Requirement: Source repositories are read-only

Source binding SHALL NOT change the checkout, index, references, configuration
or remotes of the repository, and SHALL NOT contact a remote or fetch missing
objects.

#### Scenario: Binding leaves the repository unchanged

- **WHEN** a build binds sources from a checkout
- **THEN** the repository's references, index, configuration and working tree
  are byte-identical before and after
- **AND** no network connection is attempted
