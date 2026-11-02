## ADDED Requirements

### Requirement: Coverage report

With a repository checkout, `archpub check` SHALL report from the repository's
object store at the model's revision the files and bytes in the declared scope,
the cited, uncovered and excluded ones, the cited files outside the scope, the
declared scope paths that match no file, and the largest directories that hold
no cited file. The report SHALL be counts and SHALL NOT refuse or score a
model.

#### Scenario: Coverage within a scope

- **WHEN** a model includes `src/`, excludes `src/vendor/` and cites one of
  three other files under `src/`
- **THEN** the report counts one cited and two uncovered files, and the
  vendored files as excluded with their reason

#### Scenario: A repeated check

- **WHEN** the same model is checked twice against the same checkout
- **THEN** both reports are identical

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

## MODIFIED Requirements

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
