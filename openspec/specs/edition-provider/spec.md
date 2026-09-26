# edition-provider Specification

## Purpose

Define one source-owned, product-neutral boundary that materializes exact
Architecture Publisher inputs without transferring semantic, lifecycle,
acceptance, or publication authority.

## Requirements

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
editable model.

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

#### Scenario: Derived ancestry is local before global joining

- **WHEN** different Providers reuse a local native ID in their `derivedFrom`
  lists
- **THEN** each ancestor resolves within its own Provider to the selected
  native namespace and exact content identity
- **AND** the global lock contains no ambiguous Provider-local ancestor ID

#### Scenario: Two derived projections have identical selected meaning

- **WHEN** two selected Providers return the same claimant, format, adapter
  identity and digest, method, output bytes, and normalized native ancestors
- **THEN** the join rejects the duplicate rather than overwriting one item
- **AND** different adapter identities remain distinct even if output bytes match

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
Provider boundary.

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
network, or credential sandbox.

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
declared.

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
repository. Feedback is a non-authorizing proposal.

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

### Requirement: Executable Provider execution reclaims its owned process tree

Publisher SHALL supervise the selected executable Provider worker and ordinary
descendants during bounded materialization, reclaiming their native group or
tree before admitting a reply or receipt. Timeout, rejected reply,
process failure, output-limit violation, or unavailable or unobserved cleanup
SHALL fail. Cleanup SHALL target only that invocation. "Ordinary" excludes
deliberate detachment or reparenting; this is not an adversarial OS sandbox or a
claim to contain escaped processes.

#### Scenario: A valid reply leaves an ordinary descendant running

- **WHEN** a selected executable Provider emits a valid standard-value reply
  while an ordinary worker descendant remains alive
- **THEN** materialization reclaims the worker and descendant before returning
  a passing receipt
- **AND** the Claim Model, Edition, and Candidate identities are unchanged

#### Scenario: A Provider times out with a running descendant

- **WHEN** the selected worker exceeds its reply deadline after starting an
  ordinary descendant
- **THEN** the supervisor reclaims both before returning a timeout failure
- **AND** no passing materialization receipt or Candidate is emitted

#### Scenario: Output is rejected after a descendant starts

- **WHEN** the worker emits an error, malformed reply, stderr, or output beyond
  the selected limit while an ordinary descendant is running
- **THEN** the supervisor reclaims the owned tree before returning failure
- **AND** the original output or reply defect remains distinguishable from a
  cleanup defect

#### Scenario: Native containment or cleanup is unavailable

- **WHEN** the selected host cannot establish or confirm bounded cleanup for
  the executable worker
- **THEN** materialization blocks with an explicit cleanup diagnostic
- **AND** it does not silently degrade to direct-child-only termination or
  report a passing Provider result

#### Scenario: An unrelated process is present

- **WHEN** an unrelated process runs beside the selected Provider invocation
- **THEN** cleanup leaves that process unchanged while reclaiming only the
  selected worker tree

#### Scenario: The supervisor disappears

- **WHEN** the owner of a selected executable Provider worker is lost before
  reclaiming the worker tree
- **THEN** the worker's own bounded deadline ends its lifetime
- **AND** no passing Provider result is asserted from that attempt
- **AND** descendant cleanup after supervisor loss remains unproved

### Requirement: Derived projections have source-distinct semantic addresses

Each selected derived projection SHALL have a globally unique `namespace`
distinct from native namespaces and Provider-local item IDs. The materialized
lock SHALL bind that address to claimant, format, exact output bytes, adapter
identity, method, and resolved native ancestry. Equal bytes SHALL NOT equate a
derived projection with an authored native source or source endorsement.

#### Scenario: Two Providers reuse a derived address

- **WHEN** two selected Providers declare the same derived namespace, even with
  different local IDs or output bytes
- **THEN** the global join rejects the ambiguous address before compilation

#### Scenario: Delivery mode changes without semantic change

- **WHEN** declarative and executable deliveries select the same derived
  namespace, content, claimant, adapter, and exact native ancestry
- **THEN** the semantic lock agrees while invocation receipts remain distinct

### Requirement: Provider selection is not a second lifecycle

The Build Request SHALL select zero or more exact Providers and exactly one
Edition project root. A Provider manifest SHALL not register itself globally,
select a publication target, own task state, or create a separate build or
approval command plane. Conflicting or ambiguous Edition roots SHALL fail
before compilation. An Edition stored independently of all source repositories
SHALL be selectable without changing source authority.

#### Scenario: Two Providers supply Edition roots

- **WHEN** a Build Request cannot select exactly one intended Edition root
- **THEN** input preparation rejects the ambiguous selection
- **AND** it does not merge audience, scope, or omissions implicitly

### Requirement: Provider modes converge before one build path

Direct, declarative, and executable inputs SHALL converge before one
`archpub edition build` path. The envelope SHALL reject Candidate,
qualification, acceptance, publication, and repository-transition claims.

#### Scenario: A direct Edition uses the shared build path

- **WHEN** a Build Request selects a direct Edition and no Provider
- **THEN** the same selected-input contract reaches `archpub edition build`
- **AND** no Provider identity or second build command is invented

#### Scenario: Declarative material claims acceptance

- **WHEN** a declarative Provider envelope contains an acceptance or publication
  claim beside selected input
- **THEN** materialization rejects the later-stage value

### Requirement: Generic core cannot acquire adopter logic

Publisher core SHALL NOT statically import or ambiently discover adopter code,
branch on adopter identity, or operate a second Provider command tree.

#### Scenario: An adopter package is present beside Publisher

- **WHEN** a local checkout or installed package is not selected by the Build
  Request
- **THEN** generic core does not discover or import it ambiently

### Requirement: Provider preparation does not author editorial decisions

A Provider MAY materialize exact Edition authoring bytes; it SHALL NOT compose
scenes or mint editor acceptance.

#### Scenario: A Provider creates editorial choices

- **WHEN** an executable Provider infers an audience, omission, or aggregation
  not selected in exact Edition authoring
- **THEN** it marks the choice as an attributed proposal for editor review
- **AND** the compiler does not silently treat it as accepted source intent

### Requirement: Provider input validation and closure claims are bounded

The materializer SHALL validate selected output bytes and declared dependency
references; it SHALL distinguish checked input closure from Provider-declared
or unobserved reads. Missing, changed, escaping, ambiguous, unselected, or
oversized selected input SHALL fail before a successful envelope. No receipt
SHALL claim hermetic Provider execution solely from declared dependencies or
process-tree cleanup.

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

### Requirement: Conformance does not grant other authority

Passing conformance SHALL NOT establish native-format truth, source
endorsement, editorial adequacy, product acceptance, or hosted publication.

#### Scenario: Conformance is offered as release approval

- **WHEN** a passing Provider conformance report is supplied without product
  acceptance or hosted-publication authority
- **THEN** the report remains non-authorizing evidence

### Requirement: Provider retirement follows parity and selected custody

A superseded Provider form SHALL be removed only after its replacement
satisfies common conformance, selected consumer journeys, and any reviewed
semantic successor. Mutable parallel Providers SHALL not remain merely for
compatibility; immutable historical receipts stay with their designated
custodian.

#### Scenario: A compatibility Provider remains selectable after retirement

- **WHEN** the incumbent form has been superseded and its owner has approved
  retirement
- **THEN** the mutable compatibility form is removed from live selection
- **AND** immutable historical receipts remain with their designated custodian

### Requirement: Edition selectors are mode-specific

For a direct Edition, the Build Request's `edition` selector SHALL name its
authoring root and manifest. For a Provider-supplied Edition, that selector
SHALL name only the selected Provider ID; the corresponding exact Provider
manifest still has its own path and digest in the Build Request's `providers`
selection. The `edition` selector SHALL NOT repeat a delivery-specific root or
file path for Provider mode.

#### Scenario: Provider delivery mode changes without editorial change

- **WHEN** the selected Provider supplies the same exact Edition and selected
  editorial resource bytes through declarative or executable delivery
- **THEN** the Build Request selects that Provider without changing an Edition
  filesystem locator or the selected Edition identity
- **AND** the delivery path remains invocation evidence only

### Requirement: Only the selected Provider supplies Edition material

The selected Provider's single Edition item SHALL supply the exact authored
bytes. A selected Provider lacking Edition material, or another selected
Provider contributing Edition material even with identical bytes, SHALL fail
before compilation.

#### Scenario: The selected Provider lacks Edition material

- **WHEN** a Build Request selects a Provider for the Edition and that Provider
  supplies no Edition item
- **THEN** input preparation fails before compilation
- **AND** it does not borrow an Edition item from another selected Provider

### Requirement: Authored Edition resources are exact selected input

Any authored Edition resource not bound as exact selected input SHALL fail
rather than be read from an ambient Provider directory or omitted from identity.

#### Scenario: Provider Edition references an unselected resource

- **WHEN** the selected Edition references a visual override or other external
  editorial resource that the Provider envelope does not bind by exact bytes
- **THEN** the join rejects the Edition before compilation
- **AND** it neither reads the resource ambiently nor omits it from identity
