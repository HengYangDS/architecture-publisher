## ADDED Requirements

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
