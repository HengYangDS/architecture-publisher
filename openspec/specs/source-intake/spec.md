# source-intake Specification

## Purpose

Verify explicitly selected source files as a closed, portable, content-bound bundle without executing their contents or requiring a development checkout. Report file integrity separately from semantic acceptance and official source replay.

## Requirements

### Requirement: Explicit content-bound source consumption

The existing v1 bundle verifier SHALL continue to validate exact selected
manifest and member bytes without Git, ETHOS, network, or executing source
content. A successor Build Request MAY begin with an authoring locator or an
already pinned input. Before compilation, Publisher SHALL materialize selected
native and authored inputs into a closed, content-addressed lock that identifies
the exact bytes actually consumed.

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

### Requirement: Explicit installed file packaging

The publisher SHALL expose file packaging through its installed CLI, consuming
a caller-selected plan digest, opaque source identity and explicit input files
with selected sizes, SHA-256 values and portable destination paths. It SHALL
reuse the bounded file reader and source-bundle writer, resolve paths relative
to the plan and create only an absent output directory. It SHALL NOT execute
input content or imply semantic, visual or publication acceptance.

#### Scenario: Independent author packages input and rendered output

- **WHEN** an installed consumer without ETHOS, a Git checkout or agent credentials supplies a matching explicit file plan
- **THEN** the command creates a closed source bundle and returns its manifest identity through the public CLI
- **AND** relocating the bundle preserves its content identity and verification behavior

#### Scenario: Unsafe or changed selected content

- **WHEN** the plan or file identity differs, a path is unsafe or symlinked, a declared limit is exceeded, or output already exists
- **THEN** packaging fails without overwriting prior content or publishing a successful manifest

#### Scenario: Packaging does not grant installation authority

- **WHEN** valid rendered files are packaged successfully
- **THEN** the result reports selected-file packaging only
- **AND** installing or replacing an accepted edition still requires its independent qualification and authorization

### Requirement: Source revision evidence is typed and scoped

Each successor materialized source item SHALL identify a namespace, native
format and version, claimant, selected time or revision basis, and a revision
kind with its verification method. `content` revisions SHALL name the
canonicalization and algorithm and be recomputed from their declared inputs.
`vcs` revisions SHALL name the selected repository identity and
reference/object check.

#### Scenario: A content-derived revision resembles a Git object

- **WHEN** a Provider reports a SHA-256 revision derived from Publisher-canonical
  semantic JSON
- **THEN** Publisher verifies the declared canonical JSON and algorithm
- **AND** it does not query Git or report a missing commit for that value

#### Scenario: A required VCS selector is unresolved

- **WHEN** a Build Request must resolve a selected VCS reference to obtain its
  source bytes but that reference cannot be resolved
- **THEN** materialization fails rather than falling back to current HEAD

### Requirement: One mode-independent selected-input lock

One canonical successor lock SHALL represent the same normalized selected
meaning for direct, declarative, and executable preparation. It SHALL NOT
include delivery mode, Provider identity, manifest locator or digest, package
root, process supervision, or a merely declared or unresolved read set in the
selected-content digest.

#### Scenario: Transport changes but selected meaning does not

- **WHEN** direct, declarative, or executable preparation yields the same
  normalized selected bytes, resource references, revision evidence and media
- **THEN** the generated lock digest is identical
- **AND** the distinct preparation methods remain visible in invocation evidence

### Requirement: Materialized dependency evidence is not overstated

The lock SHALL bind selected native, derived and Edition bytes, includes,
resources, adapter identity, media and toolchain profile, not later
consumption. Candidate SHALL bind checked, selected parser, backend, font,
renderer and Publisher implementation file sets. Package identity is execution
evidence, not Candidate input. Evidence SHALL
distinguish observed, checked-declared, declared-only, unresolved and ambient
facts; none proves hermetic Provider preparation or original-builder provenance.

#### Scenario: A native model imports another file

- **WHEN** the selected format's semantics depend on an included native file
- **THEN** the adapter resolves and binds that exact file or reports the
  unresolved dependency before a qualified Candidate
- **AND** the visible model is not called replayable from only its top-level
  file digest

### Requirement: Mutable locators and exact pins have distinct outcomes

A locator is mutable selection, not an immutable pin. A pin mismatch SHALL
fail; changed bytes at an unpinned locator SHALL create a new lock and
Candidate obligations rather than inherit approval. Content integrity SHALL
NOT be reported as semantic truth or source endorsement.

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

### Requirement: Opaque revisions and byte digests do not endorse behavior

An opaque native revision SHALL remain an attributed label unless its adapter
can verify it. An exact byte digest SHALL be recorded separately from every
revision claim. Neither byte match, revision resolution, nor
source-maintainer identity alone proves implemented behavior or source
endorsement.

#### Scenario: Pinned bytes carry an unverified VCS claim

- **WHEN** exact source bytes are independently supplied but an accompanying
  VCS-provenance claim cannot be verified
- **THEN** compilation may continue only with that VCS claim explicitly limited
- **AND** the applicable acceptance policy determines whether the limit blocks
  qualification or publication

### Requirement: Historical v1 revision meaning is preserved

Existing Source Bundle v1 and Provider v1 manifests SHALL retain their original
bytes and untyped revision meaning. A successor adapter MAY annotate their
revision as verified content, verified VCS, or attributed opaque only from an
explicit format-specific rule, never from a hash-shaped string.

#### Scenario: A historical revision resembles a digest

- **WHEN** a historical v1 revision label has the shape of a content digest
- **THEN** its bytes and untyped revision meaning remain unchanged
- **AND** a successor adapter does not infer verified provenance from spelling

### Requirement: Source selector IDs are request-local handles

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

### Requirement: Selected-input lock binds native and derived meaning

The lock SHALL include selected Edition resource logical references and exact
bytes, unique native namespaces, and each derived item's claimant, format,
adapter identity and digest, method, output bytes, and ancestors resolved to
selected native namespace and content identity. Duplicate native namespaces
and duplicate complete derived semantic tuples SHALL fail, including when
their bytes match.

#### Scenario: A selected namespace is repeated

- **WHEN** direct input and a Provider, or two Providers, select the same native
  namespace even with identical bytes
- **THEN** the global join rejects the ambiguous source authority

### Requirement: Local handles and order do not alter lock identity

A Provider-local ID SHALL be a local handle only. Set-valued items SHALL be
canonically sorted, independently of input order and object-key spelling.

#### Scenario: Two Providers reuse a local item ID

- **WHEN** selected Providers use the same local ID for native items in
  different source namespaces
- **THEN** the global join preserves both selected meanings without a flat ID
  collision
- **AND** renaming either local ID alone does not change the lock digest

### Requirement: Compiler closure does not inherit declared dependencies

Selected upstream dependencies SHALL enter the lock with exact identities;
read methods remain evidence. Selected downstream compiler and renderer
supplies enter the Candidate only after consumer checks. Unobserved
dependencies remain limits. Unresolved or ambient compiler inputs SHALL fail
or make replay explicitly unqualified. Provider declarations alone do not
prove a complete read set or hermetic preparation. The generated lock is not
source-author-maintained truth.

#### Scenario: A Provider declares dependencies without observation

- **WHEN** an executable Provider returns a list that Publisher does not
  independently observe or confine
- **THEN** the receipt states that limitation
- **AND** reproducibility from the checked materialized output is not conflated
  with hermetic reproducibility of Provider preparation
