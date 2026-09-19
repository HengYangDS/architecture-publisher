## Demonstrated common kernel

ETHOS and AIGW have now both exercised the same narrow chain:

1. selected source bytes and digests;
2. a validated semantic document with explicit loss and provenance;
3. authored view selection and composition constraints;
4. the pinned offline renderer;
5. scoped verification whose result is not authority;
6. exact, recoverable file publication after a separately supplied decision.

The reusable owners already exist under `src/source`, `src/semantics`,
`src/composition`, `src/interactive`, `src/geometry` and `src/publication`.
P3 therefore does not create a facade, registry or second manifest. It removes
only the duplicated exact-field and plan-bound authorization predicates in the
two current publication adapters. ETHOS-specific review, browser obligations,
semantic passport, static evidence and owner acceptance remain under
`editions/ethos`; AIGW's curated source mapping remains under `examples/aigw`.

## Skill boundary

`skills/architecture-publication/SKILL.md` is a thin operational guide. It tells
an agent to select explicit digests, call the installed public CLI, inspect its
JSON result, run applicable external observation, and keep authorization with
the source product. It owns no lifecycle state and does not rewrite OpenSpec,
Git, ETHOS policy or generated artifacts.

## CI boundary

`.gitlab-ci.yml` is a projection of existing package gates in the repository's
locked Node 26.9.0 environment: `npm ci`, `npm run check`, and `npm test`. The
tests already exercise the public CLI from a packed, relocated, offline consumer
for both AIGW revisions. CI adds no new acceptance semantics, caches no
authoritative state and does not publish.

## Research boundary

The mechanism review records observed implementation evidence and explicit
adopt/reject/defer decisions. It is design input, not runtime truth. Mechanisms
are accepted only when a named consumer and lower total ownership cost exist.

## Rejected alternatives

- A universal plugin or adapter framework before a third adopter demonstrates
  another stable seam.
- A code graph or semantic database as an authority over explicit product
  meaning.
- A workflow state machine parallel to ETHOS and OpenSpec.
- A CI-only result that silently upgrades local proof into hosted or human
  acceptance.
