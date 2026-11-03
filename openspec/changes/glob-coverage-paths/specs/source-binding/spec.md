## MODIFIED Requirements

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
