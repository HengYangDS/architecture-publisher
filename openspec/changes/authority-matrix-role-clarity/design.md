# Design

## Context

The canonical Authority Matrix is in `docs/product-contract.md`. Existing
`ecosystem-adoption` and `edition-provider` specifications already separate
source-owned meaning and Provider output from Publisher's generic Claim Model
contract. The ETHOS source owner reviewed the matrix and identified one row
whose wording obscures that separation.

## Goals / Non-Goals

**Goal:** Make that row assign accepted meaning and source-bound claim content to
the source product, provenance and declared-loss mapping to its adapter, and
generic Claim Model schema validation to Publisher.

**Non-goals:** Change the Claim Model vocabulary, infer source completeness,
alter Provider behavior, change another matrix row, or revise historical
records.

## Decisions

- Replace the ambiguous row in place; keep the matrix as the single current
  authority statement. A second table or machine-readable registry would
  create a competing source of truth for a wording problem.
- Say that Publisher owns and validates the **generic schema**, not accepted
  source meaning. Schema validity cannot prove that an adapter captured every
  source obligation; the existing provenance, coverage, and acceptance checks
  retain their separate scopes.
- Mark this Change `skip_specs: true`: no requirement or executable contract
  changes. The existing specification scenarios remain applicable.

## Risks / Trade-offs

- **A shorter table cell may again conflate validity with truth.** Keep both
  roles explicit and review the surrounding matrix as one sentence per row.
- **Documentation-only edits can still drift from source.** Compare the row
  against current Claim Model validation and first-party Provider ownership,
  then run the repository's documentation and strict OpenSpec gates.

## Migration Plan

No runtime migration. Land the documentation correction through the governed
Work Lane; preserve the signed release and archived matrix unchanged.
