## MODIFIED Requirements

### Requirement: Unverified sources are recorded

Without a repository checkout, the publisher SHALL record every claimed path
and every file a relation cites in the manifest as declared and unverified,
with no digest. No poster or page SHALL state whether its files were verified.

#### Scenario: A build without a checkout

- **WHEN** a model with claims is built without a repository
- **THEN** the manifest marks every claimed path and relation file unverified
  with no digest
- **AND** no poster note or page text states a verification state

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

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Content-digest binding at a pinned revision

**Reason**: A version 2 model declares no source digests; the publisher
derives every cited file from the model's claims and computes its digest.

**Migration**: Run `archpub migrate` on a version 1 model; ownership and digests
at a pinned revision replace this requirement.
