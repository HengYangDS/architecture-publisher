# Spec Delta

## MODIFIED Requirements

### Requirement: Provider identity and delivery mode are explicit

A successor Provider manifest SHALL bind a provider identity and revision,
protocol version, declared source namespace(s) or editorial contributor, exact
selection, and exactly one `declarative` or `executable` delivery mode. A
Provider's location or package name SHALL NOT imply source endorsement,
Edition ownership, or publication authority. Direct input selection SHALL use
the same materialized-input protocol without inventing a Provider identity.

#### Scenario: A multi-source Edition selects two Providers

- **WHEN** two Providers contribute distinct source namespaces to one Build
  Request
- **THEN** their items retain separate claimant, revision, and provenance
  identities
- **AND** neither Provider becomes the Edition editor or accepter by co-location

#### Scenario: Provider mode is ambiguous

- **WHEN** a Provider selects both modes, neither mode, or an unknown mode
- **THEN** input preparation fails before reading payloads or executing code

#### Scenario: Two products use the same delivery mode

- **WHEN** two provider manifests both select `declarative` or both select
  `executable`
- **THEN** their behavior is selected by exact manifest identity rather than a
  product-name branch in the generic kernel

### Requirement: Both modes materialize the same semantic contract

Each successor Provider SHALL return one closed selected-input envelope
containing native source items, optional derived projections with exact
`derivedFrom` references, optional Edition project material, and optional
attributed lineage. Every item SHALL identify its kind, claimant, native
format and version where applicable, revision evidence, and exact selected
bytes. A Publisher Claim Model is an admitted input, not a mandatory second
editable model. Direct, declarative, and executable inputs SHALL converge
before one `archpub edition build` path. The envelope SHALL reject Candidate,
qualification, acceptance, publication, and repository-transition claims.

#### Scenario: Executable output is a projection

- **WHEN** an executable Provider transforms native source into a semantic
  projection
- **THEN** the projection binds exact native ancestors and its named adapter,
  method, and claimant
- **AND** it does not masquerade as unchanged native bytes or endorsed fact

#### Scenario: Equivalent provider deliveries are compared

- **WHEN** paired declarative and executable deliveries materialize identical
  normalized selected inputs under one logical source selection
- **THEN** Publisher derives the same materialized input and Edition identities
- **AND** delivery-mode metadata remains in its invocation receipt rather than
  changing selected meaning

#### Scenario: Executable provider returns a later-stage value

- **WHEN** executable provider output claims a Candidate, qualification,
  acceptance, publication, or repository transition
- **THEN** provider materialization rejects the output rather than importing the
  claimed state

### Requirement: Provider dependency direction is one-way and narrow

A Provider MAY select portable native source files or execute one exact,
explicitly selected installed entry point for attributed input preparation.
Executable adaptation MAY use admitted public input and semantic contracts,
but SHALL NOT import Publisher renderers, browser runtime, qualification
admission, local publication effects, or source-product governance through the
Provider boundary. Publisher core SHALL NOT statically import or ambiently
discover adopter code, branch on adopter identity, or operate a second Provider
command tree. A Provider MAY materialize exact Edition authoring bytes; it SHALL
NOT compose scenes or mint editor acceptance.

#### Scenario: A Provider creates editorial choices

- **WHEN** an executable Provider infers an audience, omission, or aggregation
  not selected in exact Edition authoring
- **THEN** it marks the choice as an attributed proposal for editor review
- **AND** the compiler does not silently treat it as accepted source intent

#### Scenario: Provider package imports a forbidden layer

- **WHEN** a provider package imports an Architecture Publisher renderer,
  browser, qualification, or publication implementation
- **THEN** provider conformance fails with the exact forbidden dependency

#### Scenario: Generic code names an adopter

- **WHEN** a generic module branches on ETHOS, AIGW, a repository path, or a
  provider package name
- **THEN** module-boundary validation rejects the dependency

#### Scenario: Executable provider entry point is selected

- **WHEN** a valid executable provider manifest binds one installed package,
  entry point, package-manifest digest, complete package-content digest, and
  output expectation
- **THEN** the generic materializer executes that entry point through its bounded
  provider protocol
- **AND** no other package export, sibling checkout, or product-specific loader
  participates

#### Scenario: Executable provider package content changes

- **WHEN** any regular file below the selected provider package root changes,
  appears, or disappears without a new selected content digest
- **THEN** materialization fails before provider code runs

### Requirement: Provider execution is portable and fail-closed

Declarative mode SHALL select exact portable files without executing adopter
code. Executable mode SHALL run offline from an installed package with sanitized
inherited configuration and the existing bounded process-tree supervision. It
SHALL remain an explicit code-execution trust decision, not an OS, filesystem,
network, or credential sandbox. The materializer SHALL validate selected output
bytes and declared dependency references; it SHALL distinguish checked input
closure from Provider-declared or unobserved reads. Missing, changed, escaping,
ambiguous, unselected, or oversized selected input SHALL fail before a
successful envelope. No receipt SHALL claim hermetic Provider execution solely
from declared dependencies or process-tree cleanup.

#### Scenario: A selected native include is unresolved

- **WHEN** a selected adapter cannot resolve a required native include or
  external resource during materialization
- **THEN** the input fails or carries an explicit unqualified dependency limit
  according to the selected build policy
- **AND** it does not claim closed-input reproducibility

#### Scenario: An executable Provider reports a complete dependency list

- **WHEN** Publisher checks only the Provider's declared list and output bytes
- **THEN** the receipt labels the list as declared rather than observed complete
- **AND** neither bounded execution nor offline replay is called hermetic proof

#### Scenario: Installed executable provider is relocated

- **WHEN** an exact executable provider package and selected inputs are installed
  in an isolated directory without source repositories or user configuration
- **THEN** it materializes the same selected-input bytes offline

#### Scenario: Relocated provider uses an allowed Publisher contract

- **WHEN** an executable Provider declares and imports an allowed public
  Architecture Publisher contract
- **THEN** the isolated relocation supplies the exact Publisher package that is
  executing the conformance profile
- **AND** the Provider produces the same materialized identity without resolving
  an ambient checkout or network dependency

#### Scenario: Ambient source checkout is available

- **WHEN** a valid selected provider input is executed beside a similarly named
  source checkout
- **THEN** the checkout does not affect provider identity, output, or diagnostics

### Requirement: Provider conformance is common and non-authorizing

Publisher SHALL apply one mode-aware, Provider-neutral conformance profile to
self and unrelated adopters. The profile SHALL test exact input and output
identity, protocol shape, provenance, resource bounds, dependency direction,
relocation, later-stage claim rejection, and applicable determinism. It SHALL
record which dependency reads and execution effects were observed versus merely
declared. Passing conformance SHALL NOT establish native-format truth, source
endorsement, editorial adequacy, product acceptance, or hosted publication.

#### Scenario: Different adopters select different modes

- **WHEN** AIGW uses declarative input and ETHOS uses executable preparation
- **THEN** both reach the same public build boundary and common semantic checks
- **AND** the profile does not demand equal domain models or identical trust
  observations from the two adopters

#### Scenario: A provider passes the common profile

- **WHEN** every declared provider predicate passes for one exact manifest and
  materialized output
- **THEN** the result states provider conformance for those bytes
- **AND** it leaves product acceptance and publication to their declared owners

### Requirement: Provider feedback and retirement preserve role authority

Publisher MAY emit exact input, coverage, ambiguity, or rejected-output
findings. A finding SHALL be routed to the owner of the affected assertion,
editorial choice, adapter, or protocol, not automatically to the source
repository. Feedback is a non-authorizing proposal. A superseded Provider form
SHALL be removed only after its replacement satisfies common conformance,
selected consumer journeys, and any reviewed semantic successor. Mutable
parallel Providers SHALL not remain merely for compatibility; immutable
historical receipts stay with their designated custodian.

#### Scenario: Publisher finds an uncovered claim

- **WHEN** input preparation or Edition validation finds missing or ambiguous
  source-bound meaning
- **THEN** the finding names the exact source assertion and predicate and is
  sent to its claimant or responsible adapter owner
- **AND** Publisher does not edit or accept a replacement on that owner's behalf

#### Scenario: Provider migration reaches parity

- **WHEN** a replacement Provider satisfies common conformance and every
  selected consumer journey
- **THEN** the incumbent mutable form is retired after its owner approves the
  migration
- **AND** historical receipts remain immutable under selected custody rather
  than becoming a second live input authority

#### Scenario: An Edition has no source-repository editor

- **WHEN** an independent editor selects valid source claims but an omission or
  visual choice is ambiguous
- **THEN** the finding is addressed to that editor for the editorial decision
- **AND** the source owner is not made responsible for the editor's Edition

## ADDED Requirements

### Requirement: Provider selection is not a second lifecycle

The Build Request SHALL select zero or more exact Providers and exactly one
Edition project root. A Provider manifest SHALL not register itself globally,
select a publication target, own task state, or create a separate build or
approval command plane. Conflicting or ambiguous Edition roots SHALL fail
before compilation. An Edition stored independently of all source repositories
SHALL be selectable without changing source authority.

For a direct Edition, the Build Request's `edition` selector SHALL name its
authoring root and manifest. For a Provider-supplied Edition, that selector
SHALL name only the selected Provider ID; the corresponding exact Provider
manifest still has its own path and digest in the Build Request's `providers`
selection. The selected Provider's single Edition item SHALL supply the exact
authored bytes. The `edition` selector SHALL NOT repeat a delivery-specific
root or file path for Provider mode. A selected Provider lacking Edition
material, or another selected Provider contributing Edition material even
with identical bytes, SHALL fail before compilation. Any authored Edition
resource not bound as exact selected input SHALL fail rather than be read from
an ambient Provider directory or omitted from identity.

#### Scenario: Two Providers supply Edition roots

- **WHEN** a Build Request cannot select exactly one intended Edition root
- **THEN** input preparation rejects the ambiguous selection
- **AND** it does not merge audience, scope, or omissions implicitly

#### Scenario: Provider delivery mode changes without editorial change

- **WHEN** the selected Provider supplies the same exact Edition and selected
  editorial resource bytes through declarative or executable delivery
- **THEN** the Build Request selects that Provider without changing an Edition
  filesystem locator or the selected Edition identity
- **AND** the delivery path remains invocation evidence only

#### Scenario: Provider Edition references an unselected resource

- **WHEN** the selected Edition references a visual override or other external
  editorial resource that the Provider envelope does not bind by exact bytes
- **THEN** the join rejects the Edition before compilation
- **AND** it neither reads the resource ambiently nor omits it from identity

## RENAMED Requirements

- FROM: `### Requirement: Provider feedback and retirement preserve source authority`
- TO: `### Requirement: Provider feedback and retirement preserve role authority`
