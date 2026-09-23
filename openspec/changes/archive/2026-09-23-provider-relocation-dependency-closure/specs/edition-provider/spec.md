# Spec Delta

## MODIFIED Requirements

### Requirement: Provider execution is portable and fail-closed

Provider materialization SHALL consume only explicitly selected manifest,
package, file, Source Bundle, and output identities. It SHALL run offline with
empty user configuration, SHALL NOT require Git or adjacent checkouts, and SHALL
reject changed, missing, extra, symlinked, escaping, ambiguous, oversized, or
unselected input before emitting standard values. When an executable Provider
uses a permitted public Architecture Publisher contract, relocation conformance
SHALL provide the exact Publisher package used to execute that conformance run
through ordinary package resolution; it SHALL NOT depend on an ambient source
checkout, undeclared package, or network installation.

#### Scenario: Installed executable provider is relocated

- **WHEN** an exact executable provider package and selected inputs are installed
  in an isolated directory without source repositories or user configuration
- **THEN** it materializes the same standard-value bytes offline

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
