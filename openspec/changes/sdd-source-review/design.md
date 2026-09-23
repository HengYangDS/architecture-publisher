# Design

## Context

The canonical research record is `docs/research/mechanism-evaluation.md`. The
Publisher, ETHOS, and AIGW contracts already define their authority boundaries;
this change must not restate or amend those contracts.

## Goals / Non-Goals

- Record exact stable revisions, observed source mechanisms, useful principles,
  and limits for three adjacent frameworks.
- Keep the evaluation in one existing research document, not a second ledger.
- Do not change product behavior, dependencies, specifications, or releases.

## Decisions

- Inspect stable tagged source and distinguish an implemented function or test
  from README claims. Source links and revision IDs make each finding revisitable.
- Compare by semantic job: context selection, repository governance, and agent
  guidance. A capability label alone does not imply ETHOS-level authorization.
- Recommend only narrow, demand-led borrowing through existing ETHOS or
  Publisher owners. Reject copied file formats, mutable state, and command planes.

The alternative of integrating any framework wholesale would duplicate accepted
intent, lanes, evidence, or publication authority without a demonstrated consumer
failure. A separate research file would fragment the decision record.

## Risks / Trade-offs

- Source inspection is not a full runtime or security audit. State that limit
  explicitly and avoid global absence claims from a targeted code search.
- Upstream revisions may change. Pin observations to the inspected commits and
  require a fresh comparison before using them as an implementation premise.

## Migration Plan

No runtime migration. Validate the document and OpenSpec Change; land this
research-only update through the existing governed repository lifecycle.
