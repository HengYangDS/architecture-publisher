## MODIFIED Requirements

### Requirement: Edition identities remain subordinate

Each Edition SHALL be an Architecture Model with a stable owner and identity
distinct from the product, package, repository, renderer and source project
identities, and SHALL be kept outside the core package.

#### Scenario: ETHOS and Architecture Publisher editions coexist

- **WHEN** both models are built with the same installed core
- **THEN** neither model changes the product identity
- **AND** their source, model and delivery identities remain independently
  selectable

### Requirement: The core distribution is domain-neutral

The `architecture-publisher` package and `archpub` command SHALL depend only on
the generic model, source-binding, reading-plan, poster, page and delivery
contracts. A concrete repository or Edition MAY be developed in the same
monorepo, but SHALL be a model outside the core package and SHALL NOT be
included in or required by it.

#### Scenario: A caller installs only the core package

- **WHEN** no Edition model is present
- **THEN** the installed build, check, import, accept and publish journeys
  remain available offline
- **AND** `archpub --help` contains no ETHOS, AIGW, repository-specific, or
  renderer-vendor command

#### Scenario: A concrete Edition evolves

- **WHEN** the ETHOS, AIGW or Architecture Publisher model changes
- **THEN** it can be rebuilt without changing the core package unless a public
  contract itself changed
- **AND** the dependency direction remains from the model to the core
