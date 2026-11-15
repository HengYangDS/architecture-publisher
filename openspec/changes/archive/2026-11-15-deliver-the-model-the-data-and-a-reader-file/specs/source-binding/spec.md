## MODIFIED Requirements

### Requirement: Unverified sources are recorded

Without a repository checkout, the publisher SHALL record every claimed path and every file a relation cites in
the evidence table of the delivery's data as unverified, with no digest. No poster or page SHALL state whether its
files were verified.

#### Scenario: A build without a checkout

- **WHEN** a model with claims is built without a repository
- **THEN** the data's evidence table marks every claimed path and relation file unverified with no digest
- **AND** no poster note or page text states a verification state

### Requirement: Ownership and digests at a pinned revision

When a build or check receives a repository checkout, the publisher SHALL read the files of the model's revision
from the repository's object store, give each file in the coverage scope to the component that owns it by the
model's claims, and compute the SHA-256 digest of every owned file and of every file a relation cites.

#### Scenario: Claims that hold their files

- **WHEN** every claim holds a file in the scope and every file a relation cites exists at the revision
- **THEN** the data's evidence table records each cited file as verified with its digest, its owner and the
  relations that cite it

#### Scenario: A nested claim

- **WHEN** one component claims `src/cli/` and another `src/cli/credential/`
- **THEN** the data's evidence table records `src/cli/credential/read.mjs` as owned by the second and
  `src/cli/main.mjs` by the first

## ADDED Requirements

### Requirement: A file is verified only when its own bytes were read

With a repository checkout, the publisher SHALL record a file as verified only when it read that file's own bytes
at the model's revision. A build or a check SHALL refuse with `source_read_failed`, naming the file, a file in a
component's scope or cited by a relation whose object the checkout does not hold or whose read Git does not
finish, and a tracked file in a component's scope whose path holds a line break.

#### Scenario: An object the checkout does not hold

- **WHEN** a component's claim holds a file at the revision and the checkout does not hold that file's object, as
  in a partial clone
- **THEN** a build and a check are refused with `source_read_failed`, naming the file
- **AND** the file is not recorded, as verified or otherwise

#### Scenario: A path that holds a line break

- **WHEN** a tracked file whose name holds a line break lies in a component's scope
- **THEN** a build and a check are refused with `source_read_failed` before any file is read, naming the path with
  its line break written as `\n`
