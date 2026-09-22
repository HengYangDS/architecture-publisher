# edition-provider Specification

## Purpose

Define one source-owned, product-neutral boundary that materializes exact
Architecture Publisher inputs without transferring semantic, lifecycle,
acceptance, or publication authority.

## Requirements

### Requirement: Provider identity and delivery mode are explicit

An Edition Provider SHALL be selected by an exact provider manifest that binds
one subject product, provider identity, provider revision, contract version, and
exactly one delivery mode: `declarative` or `executable`. Repository names,
directory names, package scopes, environment discovery, and product labels SHALL
NOT select provider behavior implicitly.

#### Scenario: Provider mode is ambiguous

- **WHEN** a manifest declares both delivery modes, neither mode, or an unknown
  mode
- **THEN** provider admission fails before reading provider payloads or executing
  provider code

#### Scenario: Two products use the same delivery mode

- **WHEN** two provider manifests both select `declarative` or both select
  `executable`
- **THEN** their behavior is selected by exact manifest identity rather than a
  product-name branch in the generic kernel

### Requirement: Both modes materialize the same semantic contract

A provider SHALL materialize an exact Source Bundle, Claim Model, Edition, and
optional evolution input conforming to the existing public contracts. A
`declarative` provider SHALL select portable standard-value files; an
`executable` provider SHALL select an independently installed package and public
entry point that emits only those standard values. Delivery mode SHALL NOT alter
the meaning, validation, identity, qualification, or publication semantics of
the materialized values.

#### Scenario: Equivalent provider deliveries are compared

- **WHEN** declarative and executable deliveries materialize byte-identical
  standard values under the same provider identity and source revision
- **THEN** Architecture Publisher derives the same semantic and Edition
  identities
- **AND** delivery-mode metadata does not enter the Claim Model or Edition digest

#### Scenario: Executable provider returns a later-stage value

- **WHEN** executable provider output claims a Candidate, qualification,
  acceptance, publication, or repository transition
- **THEN** provider materialization rejects the output rather than importing the
  claimed state

### Requirement: Provider dependency direction is one-way and narrow

A source-owned provider MAY consume public Architecture Publisher source,
semantic, Edition, and renderer-neutral Scene contracts. It SHALL NOT import
generic renderer implementations, browser runtime, qualification admission,
publication effects, or source-product governance through the provider boundary.
The generic materializer MAY execute only the exact package entry point selected
by the provider manifest; Architecture Publisher core SHALL NOT statically import,
ambiently discover, dispatch on product identity, or mutate a source product or
provider implementation.

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

Provider materialization SHALL consume only explicitly selected manifest,
package, file, Source Bundle, and output identities. It SHALL run offline with
empty user configuration, SHALL NOT require Git or adjacent checkouts, and SHALL
reject changed, missing, extra, symlinked, escaping, ambiguous, oversized, or
unselected input before emitting standard values.

#### Scenario: Installed executable provider is relocated

- **WHEN** an exact executable provider package and selected inputs are installed
  in an isolated directory without source repositories or user configuration
- **THEN** it materializes the same standard-value bytes offline

#### Scenario: Ambient source checkout is available

- **WHEN** a valid selected provider input is executed beside a similarly named
  source checkout
- **THEN** the checkout does not affect provider identity, output, or diagnostics

### Requirement: Provider conformance is common and non-authorizing

Architecture Publisher SHALL apply one provider-neutral conformance profile to
self, ETHOS, AIGW, and future providers. Conformance SHALL verify manifest
closure, exact input identity, output schema, determinism, portability,
dependency direction, resource bounds, and later-stage claim rejection. Passing
provider conformance SHALL NOT establish source-product acceptance, hosted
publication, or independent verification.

#### Scenario: A provider passes the common profile

- **WHEN** every declared provider predicate passes for one exact manifest and
  materialized output
- **THEN** the result states provider conformance for those bytes
- **AND** it leaves product acceptance and publication to their declared owners

### Requirement: Provider feedback and retirement preserve source authority

Architecture Publisher MAY emit source-bound findings about provider input,
coverage, ambiguity, or rejected output. Feedback SHALL be a non-authorizing
proposal addressed to the source owner. A superseded provider form SHALL be
removed only after the source-owned replacement reproduces the selected
identities or an explicitly reviewed semantic successor and every current
consumer has moved.

#### Scenario: Publisher finds an uncovered claim

- **WHEN** provider materialization or Edition validation finds missing or
  ambiguous source-bound meaning
- **THEN** the result identifies the exact source and predicate without editing
  the source product or accepting a replacement

#### Scenario: Provider migration reaches parity

- **WHEN** the replacement provider satisfies common conformance and all selected
  consumer journeys
- **THEN** the incumbent mutable provider is removed
- **AND** only immutable historical receipts remain outside the source owner
