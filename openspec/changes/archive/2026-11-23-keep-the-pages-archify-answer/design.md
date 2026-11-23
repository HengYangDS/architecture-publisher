## Context

See [proposal.md](proposal.md) and the research page `docs/research/build-and-suite-time.md`, its section "The
suite's profile and the page's answer (2026-11-23)". A page's delivery is held as its file name, bytes, the supply's
digest and Archify's receipt (`holdDelivery`).

## Goals / Non-Goals

**Goals:**

- A build asks Archify for a page only when no earlier run delivered the same page.

**Non-Goals:**

- Guides and pages built against a checkout: Archify reads the repository for them, which the key would not hold.

## Decisions

1. Keep the held delivery, not Archify's output directory.
   - Rests on: the held delivery is what a build writes.
   - Chosen because: a kept answer then replaces one run of Archify and nothing else.
2. One keeping for candidates and pages (`keptAnswer`).
   - Chosen because: the store, the key's base and the atomic write are one rule.

## Risks / Trade-offs

- The store grows by about one page a changed model; answers a week old are removed by the suite's fixture.
