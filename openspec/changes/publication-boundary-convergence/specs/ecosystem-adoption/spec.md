# Spec Delta

## MODIFIED Requirements

### Requirement: Three independent first-party consumers

The current product line SHALL exercise one public Build Request, selected-input
protocol, semantic compilation, Edition, independent media, qualification, and
publication contracts through Publisher self-use, ETHOS, and AIGW. Self-use MAY
select direct inputs; an adopter MAY select declarative or executable Providers.
These routes SHALL converge before the common compiler without inventing a
Provider identity for direct selection. Product-specific meaning SHALL remain
with its named source and editor rather than branches in the generic kernel.

#### Scenario: A generic kernel module is evaluated for product-specific logic

- **WHEN** behavior names ETHOS, AIGW, or Architecture Publisher presentation
  semantics
- **THEN** the behavior is rejected from the generic owner unless it implements
  an explicitly shared public invariant demonstrated by all required consumers

#### Scenario: First-party consumers use different delivery modes

- **WHEN** self-use selects direct inputs, AIGW selects a declarative Provider,
  and ETHOS selects an executable Provider
- **THEN** each route yields one closed selected-input envelope and reaches the
  same downstream Candidate contract with distinct claimant and editor roles
- **AND** the two Provider modes satisfy the same conformance predicates while
  direct selection acquires no fictitious Provider identity

### Requirement: Cross-repository conformance is portable

An adopter SHALL cross the product boundary through one exact Build Request
selecting direct inputs, one or more Edition Providers, or both. Publisher
runtime and release tests SHALL NOT import adjacent checkouts, search sibling
repositories, hardcode workstation user paths, or infer adopter identity from
repository names. Package identity SHALL separately record the selected
release asset's exact archive digest and portable uncompressed-content digest.

#### Scenario: An installed adopter is relocated

- **WHEN** its Build Request, complete selected source and Edition bytes,
  selected Provider package if applicable, and checked toolchain supplies are
  copied into an isolated directory with empty user configuration
- **THEN** the selected-input lock and Candidate artifacts reproduce offline
  without the source repository or an adjacent checkout
- **AND** a missing or changed selected source, Edition, Provider package, or
  checked supply fails before a successful Candidate
- **AND** unresolved upstream dependency closure remains an explicit,
  unqualified limit rather than silently borrowing ambient state

#### Scenario: Package compression differs across platforms

- **WHEN** two supported hosts pack identical provider package content but their
  gzip implementations emit different archive bytes
- **THEN** their archive identities remain distinct and exact
- **AND** their uncompressed tar-content identities compare equal

#### Scenario: Cross-platform package content is compared

- **WHEN** a selected package is reconstructed across supported hosts
- **THEN** conformance compares portable content identity
- **AND** it does not claim gzip-byte equivalence across implementations

### Requirement: AIGW remains a distinct adopter

The AIGW Edition SHALL use the same public Build Request and Edition/semantic
contracts as other adopters while selecting AIGW-owned native architecture
inputs or attributed projections. Publisher SHALL NOT require a duplicate
editable Claim Model or ETHOS-specific renderer or Edition modules. AIGW
retains its own acceptance, release, and custody decisions.

#### Scenario: AIGW adds or changes a routing capability

- **WHEN** selected AIGW source-supported meaning changes at an exact revision
- **THEN** affected reader views and media are rebuilt and requalified
- **AND** unrelated ETHOS and self Editions remain unchanged

## REMOVED Requirements

### Requirement: Live Editions are source-owned

**Reason:** Mandatory physical co-location conflates source authority with
Provider transport and Edition editing; the already-admitted independent-editor
contract cannot satisfy it without unwanted source-repository changes.

**Migration:** Use the named-owner placement rule below. Existing in-repository
adopter integrations remain live only by their product owners' choice until an
exact, accepted replacement satisfies the selected consumer journeys. Retain
historical receipts under selected custody.

## ADDED Requirements

### Requirement: Adopter placement follows named authority

Each selected Provider SHALL retain its declared identity, and each Edition
SHALL name one editor. The adopter's own policy designates accountable
maintainers and the canonical mutable Edition; Publisher SHALL NOT infer these
roles from physical placement. Each selected source retains authority over its
native assertions and any claim of official endorsement.
The Edition editor owns its authored choices, while a Provider only transports
or prepares exact selected inputs. Their roots MAY be source-co-located or
maintained separately. Publisher SHALL NOT require source-repository changes or
an ordinary source-product CI dependency for independent, attributed analysis
of exact read-only source inputs. Placement, Provider conformance, and a passing
build SHALL NOT grant source endorsement, Edition acceptance, or publication
authority. Publisher MAY retain its own self-Edition and compact immutable
adopter fixtures and receipts, but SHALL NOT retain a second mutable adopter
Edition after its designated owner accepts a successor.

#### Scenario: An independent editor reads a source without adoption

- **WHEN** an editor selects exact source bytes in an external Edition without
  changing the source repository or its ordinary CI
- **THEN** Publisher may build an editor-attributed Candidate through the public
  Build Request
- **AND** no source endorsement of the Edition's selection or interpretation
  is inferred from those source bytes
- **AND** the named editorial accepter may accept the explicitly independent
  Candidate under its own policy without claiming source endorsement

#### Scenario: An official Edition is maintained outside the source repository

- **WHEN** a source owner explicitly endorses an exact selected source scope
  and authorizes an external Edition editor and acceptance policy
- **THEN** physical separation does not prevent an official first-party
  publication after its designated accepter approves the exact Candidate
- **AND** Publisher records only exact invoker-supplied external decision
  evidence; it neither authenticates the issuer nor grants that authority

#### Scenario: A source product elects a co-located integration

- **WHEN** AIGW selects its declarative Provider or ETHOS selects an executable
  semantic adapter and the respective product owner elects source co-location
- **THEN** both use the same public Build Request and downstream Publisher
  contracts without making that placement a protocol requirement
- **AND** neither integration makes Publisher an ordinary core CI prerequisite
  unless its product owner separately chooses that gate

#### Scenario: One Edition selects two source products

- **WHEN** an independent Edition selects assertions from two source products
  and only one source owner endorses its exact selected scope
- **THEN** the other source's assertions remain attributed but unendorsed
- **AND** the editor, accepter, and custodian do not inherit either source's
  authority by co-location or Provider selection

#### Scenario: A first-party integration is replaced

- **WHEN** a replacement passes common conformance and every selected consumer
  journey yields either identical Candidate digests or an explicitly reviewed
  semantic successor
- **AND** the designated accepter accepts the exact installed static and
  interactive outputs
- **AND** the designated owner approves retirement with a rollback and custody
  plan
- **THEN** the displaced mutable integration is retired without retaining a
  parallel live authority in Publisher
- **AND** historical receipts remain immutable under selected custody
- **AND** Publisher imposes no ordinary source-product CI gate on the
  replacement unless that product's owner separately selects one
