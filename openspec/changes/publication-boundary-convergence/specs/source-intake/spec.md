# Spec Delta

## MODIFIED Requirements

### Requirement: Explicit content-bound source consumption

The existing v1 bundle verifier SHALL continue to validate exact selected
manifest and member bytes without Git, ETHOS, network, or executing source
content. A successor Build Request MAY begin with an authoring locator or an
already pinned input. Before compilation, Publisher SHALL materialize selected
native and authored inputs into a closed, content-addressed lock that identifies
the exact bytes actually consumed. A locator is mutable selection, not an
immutable pin. A pin mismatch SHALL fail; changed bytes at an unpinned locator
SHALL create a new lock and Candidate obligations rather than inherit approval.
Content integrity SHALL NOT be reported as semantic truth or source endorsement.

#### Scenario: An authoring locator changes

- **WHEN** selected source bytes change at an unpinned authoring locator
- **THEN** materialization produces a new input identity and applicable
  verification obligations
- **AND** it does not reuse the prior Candidate or acceptance merely because
  the locator string is unchanged

#### Scenario: A pinned source is moved

- **WHEN** an exact pinned native source and Edition project move together to an
  offline machine
- **THEN** the same selected bytes and content identity can be checked without
  their original repository or Provider
- **AND** a changed pin fails before compilation

#### Scenario: A source has an opaque revision

- **WHEN** a valid closed bundle identifies a non-Git source revision
- **THEN** the same member bytes and content identity are returned after relocation
- **AND** the result claims only source-file integrity, not semantic acceptance or official replay

#### Scenario: The selected manifest or a member changes

- **WHEN** supplied bytes differ from the caller's selected manifest digest or a listed member identity
- **THEN** verification fails before a successful result is emitted

## ADDED Requirements

### Requirement: Source revision evidence is typed and scoped

Each successor materialized source item SHALL identify a namespace, native
format and version, claimant, selected time or revision basis, and a revision
kind with its verification method. `content` revisions SHALL name the
canonicalization and algorithm and be recomputed from their declared inputs.
`vcs` revisions SHALL name the selected repository identity and
reference/object check. An opaque
native revision SHALL remain an attributed label unless its adapter can verify
it. An exact byte digest SHALL be recorded separately from every revision
claim. Neither byte match, revision resolution, nor source-maintainer identity
alone proves implemented behavior or source endorsement.

Existing Source Bundle v1 and Provider v1 manifests SHALL retain their original
bytes and untyped revision meaning. A successor adapter MAY annotate their
revision as verified content, verified VCS, or attributed opaque only from an
explicit format-specific rule, never from a hash-shaped string.

A Build Request's source selector ID SHALL remain a request-local read handle,
not part of the generated source-content identity. The materialized lock SHALL
use the selected namespace, native format, claimant, revision evidence, and
exact bytes; changing only a local selector name SHALL NOT create a new
semantic source identity.

#### Scenario: A local source selector is renamed

- **WHEN** a Build Request changes only one source selector ID while keeping
  its selected namespace, format, claimant, revision, and bytes unchanged
- **THEN** its materialized input lock retains the same digest
- **AND** the caller's read handle follows the new local ID

#### Scenario: A content-derived revision resembles a Git object

- **WHEN** a Provider reports a SHA-256 revision derived from Publisher-canonical
  semantic JSON
- **THEN** Publisher verifies the declared canonical JSON and algorithm
- **AND** it does not query Git or report a missing commit for that value

#### Scenario: A required VCS selector is unresolved

- **WHEN** a Build Request must resolve a selected VCS reference to obtain its
  source bytes but that reference cannot be resolved
- **THEN** materialization fails rather than falling back to current HEAD

#### Scenario: Pinned bytes carry an unverified VCS claim

- **WHEN** exact source bytes are independently supplied but an accompanying
  VCS-provenance claim cannot be verified
- **THEN** compilation may continue only with that VCS claim explicitly limited
- **AND** the applicable acceptance policy determines whether the limit blocks
  qualification or publication

### Requirement: Materialized dependency evidence is not overstated

A successor input lock SHALL bind the exact selected native and Edition bytes,
resolved includes and resources, adapter and backend identities, checked font
and rendering supplies, and selected toolchain configuration needed for the
claimed compilation closure. Each dependency SHALL identify whether it was
observed, checked from a declaration, or merely declared. An unresolved or
ambient compiler input SHALL fail or make reproducibility explicitly
unqualified; a Provider declaration alone SHALL NOT establish a complete read
set or hermetic preparation. The lock is a generated replay record, not a
source-author-maintained truth store.

#### Scenario: A native model imports another file

- **WHEN** the selected format's semantics depend on an included native file
- **THEN** the adapter resolves and binds that exact file or reports the
  unresolved dependency before a qualified Candidate
- **AND** the visible model is not called replayable from only its top-level
  file digest

#### Scenario: A Provider declares dependencies without observation

- **WHEN** an executable Provider returns a list that Publisher does not
  independently observe or confine
- **THEN** the receipt states that limitation
- **AND** reproducibility from the checked materialized output is not conflated
  with hermetic reproducibility of Provider preparation
