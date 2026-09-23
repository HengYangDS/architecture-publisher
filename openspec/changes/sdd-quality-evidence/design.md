# Design

## Context

`docs/research/mechanism-evaluation.md` is the one current decision record for
adjacent SDD and assurance mechanisms. It already pins COMET `0.4.1` and an
ETHOS source baseline, but it does not compare their implemented quality gates
or state the limits of such a comparison. The research is not a product policy.

## Goals / Non-Goals

**Goal:** Add source-backed, revision-bound evidence on type and lint scope,
coverage floors, native/package journeys, and selected trust properties. Make
the transfer decision explicit without a global quality score.

**Non-goals:** Execute or certify either complete upstream suite, equate a CI
workflow declaration with a successful hosted run, change ETHOS or COMET, or
infer semantic density from line counts.

## Decisions

- Extend the existing research document rather than create a second scorecard.
  Source URLs and object IDs identify what was inspected; limits accompany each
  conclusion.
- Compare like-for-like predicates, not project size. A broader user-facing
  runtime and a stricter repository trust boundary answer different questions.
- Keep the adoption decision demand-led: borrow COMET's implemented recovery and
  evaluation concepts through existing ETHOS owners; do not import `.comet`
  state or promote another agent runtime into repository authority.

## Risks / Trade-offs

- **Source-declared checks may not have run successfully.** State that hosted
  outcomes and full-suite pass rates were not audited in this update.
- **Quality thresholds have different scopes.** Name exclusions and selected
  source sets before comparing numeric floors.
- **Internal ETHOS source may evolve.** Pin the observed commit and recheck
  before using the comparison as an implementation premise.

## Migration Plan

No runtime migration. Validate the research text and strict OpenSpec Change,
run the existing repository quality graph, and land through the owned Work Lane.
