# source-binding Specification

## Purpose

Bind the sources an Architecture Model declares to exact repository content at a
pinned revision without changing or contacting the repository.

## Requirements

### Requirement: Unverified sources are recorded

Without a repository checkout, the publisher SHALL record every claimed path
and every file a relation cites in the manifest as declared and unverified,
with no digest. No poster or page SHALL state whether its files were verified.

#### Scenario: A build without a checkout

- **WHEN** a model with claims is built without a repository
- **THEN** the manifest marks every claimed path and relation file unverified
  with no digest
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
the owned, uncovered and excluded ones, the files relations cite outside the
scope, the declared scope paths that match no file, and the largest
directories that hold no owned file. A glob SHALL match a path
case-sensitively on every platform. The report SHALL be counts and SHALL NOT
refuse or score a model.

#### Scenario: Coverage within a scope

- **WHEN** a model includes `src/`, excludes `src/vendor/` and one component
  claims one of three other files under `src/`
- **THEN** the report counts one owned and two uncovered files, and the
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

`archpub check` SHALL list every component that claims no file and every
relation that cites none, with or without a repository checkout.

#### Scenario: A relation without sources

- **WHEN** a model's relation cites no files
- **THEN** the check result lists that relation as uncited

### Requirement: Currency report

With `--against <revision>`, `archpub check` SHALL report the first-parent
commits from the model's revision to the named revision, whether the model's
revision is an ancestor of it, and whether each cited file is unchanged,
modified, moved, with its new path, or deleted, as Git's rename detection reads
them. `--against` without `--repo` SHALL be a usage error.

#### Scenario: A model behind its repository

- **WHEN** after the model's revision one cited file is modified, one moved and
  one deleted in two commits
- **THEN** the report counts two commits and names each file with its state and
  the moved one's new path

### Requirement: Ownership and digests at a pinned revision

When a build or check receives a repository checkout, the publisher SHALL read
the files of the model's revision from the repository's object store, give each
file in the coverage scope to the component that owns it by the model's claims,
and compute the SHA-256 digest of every owned file and of every file a relation
cites.

#### Scenario: Claims that hold their files

- **WHEN** every claim holds a file in the scope and every file a relation
  cites exists at the revision
- **THEN** the manifest records each cited file as verified with its digest,
  its owner and the relations that cite it

#### Scenario: A nested claim

- **WHEN** one component claims `src/cli/` and another `src/cli/credential/`
- **THEN** the manifest records `src/cli/credential/read.mjs` as owned by the
  second and `src/cli/main.mjs` by the first

### Requirement: Claims and cited files hold at the revision

With a repository checkout, a missing revision, a claim that owns no file in
the scope and a relation file absent at the revision SHALL refuse the build and
name the component or relation and its path.

#### Scenario: A claim that holds nothing

- **WHEN** a component claims `src/old/` and the revision holds no file in the
  scope under it
- **THEN** the build refuses with the component's id and that claim
- **AND** no output directory is created

#### Scenario: A claim the scope leaves out

- **WHEN** a component claims `src/a_test.go` and the scope excludes
  `**/*_test.go`
- **THEN** the build refuses with the component's id and that claim

#### Scenario: A claim deeper claims leave empty

- **WHEN** one component claims `src/net/` and another claims `src/net/c.go`,
  the only file under it
- **THEN** the build refuses with the first component's id and its claim

#### Scenario: A relation file absent at the revision

- **WHEN** a relation cites `src/gone.mjs` and the revision holds no such file
- **THEN** the build refuses with the relation's id and that file

### Requirement: Re-pin worklist

With `--against <revision>`, `archpub check` SHALL report from the model's
claims resolved at both revisions: each component's owned files modified,
moved with the component their new path falls to, or deleted, and the files its
claims take in; each relation's changed files; the claims owning no file and
the relation files absent at the named revision; and the scope's files there
that no claim owns and that were not uncovered at the model's revision. The
worklist SHALL NOT refuse the check.

#### Scenario: A file moves into another component's claim

- **WHEN** one component claims `src/a/` and another `src/b/`, and
  `src/a/x.go` moves to `src/b/x.go` after the model's revision
- **THEN** the worklist lists `src/a/x.go` under the first component as moved
  to `src/b/x.go`, owned by the second
- **AND** lists `src/b/x.go` under the second as taken in

#### Scenario: New files under a claim and under none

- **WHEN** the named revision adds `src/a/new.go` and `tools/new.go`, the scope
  includes `src/` and `tools/`, and one component claims `src/a/`
- **THEN** the worklist lists `src/a/new.go` as taken in by that component and
  `tools/new.go` as newly uncovered

#### Scenario: What the build at the named revision would refuse

- **WHEN** the only file under a claimed directory and a relation's file are
  deleted after the model's revision
- **THEN** the worklist names the claim with its component and the relation
  file with its relation
- **AND** the check passes

#### Scenario: A relation's evidence changes

- **WHEN** a file a relation cites is modified after the model's revision
- **THEN** the worklist names the relation and the file

### Requirement: Guide citations at a later revision

With `--against <revision>` and a model that names a guide, `archpub check`
SHALL classify each line range that the draft's sources and its diagrams' node
sources cite, from Git's diff between the two revisions: the same, shifted with
its range at the named revision, moved with its new path, touched when a change
falls within its lines, or gone when its file is deleted.

#### Scenario: A range below an insertion

- **WHEN** two lines are inserted above a cited range `10:12`
- **THEN** the citation is shifted, with the range `12:14`

#### Scenario: A change within a range

- **WHEN** line 11 of a cited range `10:12` changes
- **THEN** the citation is touched

#### Scenario: A renamed and a deleted file

- **WHEN** one cited file is renamed unchanged and another is deleted
- **THEN** the first citation is moved with its new path and its range
- **AND** the second is gone

#### Scenario: A diagram's node source

- **WHEN** a diagram beside the draft cites lines of a file that two inserted
  lines push down
- **THEN** that citation is shifted like a draft source
