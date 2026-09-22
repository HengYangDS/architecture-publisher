# Design

## Context

See [proposal.md](proposal.md). The 0.2 Change is archived and its accepted
requirements now live in canonical specifications and contracts. Two tests
still resolve current assertions through the former active Change path, causing
exact-head behavior proof to fail after correct archive completion.

## Goals / Non-Goals

**Goals:**

- Bind current product assertions only to canonical current owners.
- Keep archived Change material available solely as immutable history.
- Make the absence of the retired active Change an explicit regression.

**Non-Goals:**

- Change runtime behavior or public contracts.
- Reopen or reinterpret the archived 0.2 Change.
- Broaden post-archive write admission.

## Decisions

1. The topology test reads `README.md`, the product and Edition contracts, and
   the canonical `ecosystem-adoption` specification. These are the current
   owners of the asserted behavior.
2. The handoff test excludes archived Change files from its live-reference
   corpus, requires zero live `migration/ethos` references, then checks the
   archived design separately as historical evidence.
3. The repair is spec-free because it changes no product requirement. Existing
   canonical requirements already state source ownership, migration removal,
   portable boundaries, and immutable candidate identity.

Alternatives rejected:

- Redirecting current assertions to archived proposal/design/tasks would make
  inert history a parallel current authority.
- Recreating the 0.2 Change would falsify completed lifecycle state.
- Widening archive-derived write scope would weaken fail-closed governance.

## Risks / Trade-offs

- **Archive path becomes part of a historical regression** -> Keep that path in
  one explicit archival assertion; current product assertions do not depend on
  it.
- **Future wording changes break text assertions** -> Assert narrow semantic
  phrases owned by canonical contracts and update tests with the owning Change.

## Migration Plan

Apply the two test changes, run focused and full repository verification, commit
with the current intent, archive this Change through the native ETHOS lifecycle,
then refresh exact-head proof and land without moving the immutable release tag.
