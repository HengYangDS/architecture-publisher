# source-binding Specification

## Purpose

Bind the sources an Architecture Model declares to exact repository content at a
pinned revision without changing or contacting the repository.

## Requirements

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

### Requirement: Unverified sources are recorded

Without a repository checkout, the publisher SHALL record every source in the
manifest as declared and unverified, with its declared digest and no computed
one. No poster or page SHALL state whether its sources were verified.

#### Scenario: A build without a checkout

- **WHEN** a model with sources is built without a repository
- **THEN** the manifest marks every source unverified with no computed digest
- **AND** no poster note or page text states a verification state

### Requirement: Source repositories are read-only

Source binding and coverage measurement SHALL NOT change the checkout, index,
references, configuration or remotes of the repository, and SHALL NOT contact
a remote or fetch missing objects.

#### Scenario: Binding leaves the repository unchanged

- **WHEN** a build binds sources from a checkout
- **THEN** the repository's references, index, configuration and working tree
  are byte-identical before and after
- **AND** no network connection is attempted

#### Scenario: Measuring leaves the repository unchanged

- **WHEN** a check measures coverage and currency from a checkout
- **THEN** the repository's references, index, configuration and working tree
  are byte-identical before and after

### Requirement: Coverage report

With a repository checkout, `archpub check` SHALL report from the repository's
object store at the model's revision the files and bytes in the declared scope,
the cited, uncovered and excluded ones, the cited files outside the scope, the
declared scope paths that match no file, and the largest directories that hold
no cited file. A glob SHALL match a path case-sensitively on every platform.
The report SHALL be counts and SHALL NOT refuse or score a model.

#### Scenario: Coverage within a scope

- **WHEN** a model includes `src/`, excludes `src/vendor/` and cites one of
  three other files under `src/`
- **THEN** the report counts one cited and two uncovered files, and the
  vendored files as excluded with their reason

#### Scenario: A repeated check

- **WHEN** the same model is checked twice against the same checkout
- **THEN** both reports are identical

#### Scenario: Tests beside the code

- **WHEN** a model includes `src/` and excludes `**/*_test.go` and the
  revision holds `src/a.go`, `src/a_test.go` and `src/A_TEST.GO`
- **THEN** the report counts `src/a_test.go` as excluded and `src/a.go` and
  `src/A_TEST.GO` in the scope, on every platform

### Requirement: Uncited statements are reported

`archpub check` SHALL list every component and relation that cites no source,
with or without a repository checkout.

#### Scenario: A relation without sources

- **WHEN** a model's relation declares no sources
- **THEN** the check result lists that relation as uncited

### Requirement: Currency report

With `--against <revision>`, `archpub check` SHALL report the first-parent
commits from the model's revision to the named revision, whether the model's
revision is an ancestor of it, and whether each cited source is unchanged,
modified, moved, with its new path, or deleted, as Git's rename detection reads
them. `--against` without `--repo` SHALL be a usage error.

#### Scenario: A model behind its repository

- **WHEN** after the model's revision one cited source is modified, one moved
  and one deleted in two commits
- **THEN** the report counts two commits and names each source with its state
  and the moved one's new path
