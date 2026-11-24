## Context

See [proposal.md](proposal.md). The reviews and their answers lie in the checkout's ignored
`build/runtime/work/review-20261124/` (`ANSWERS.md`). The code findings, all latent, go to a Change of their own
after 0.18.0.

## Goals / Non-Goals

**Goals:**

- What 0.18.0 ships says what the product does.

**Non-Goals:**

- The code findings: a kept page's key, Archify's timer during the layout, a generated page's start, the line back's
  fallback and the search's test.

## Decisions

1. Docs and words only, before the release; code after it.
   - Rests on: every code finding is latent (no published work reaches it); every docs finding is in what ships.
   - Considered: one Change for both, which holds the release for a proof of code it does not need.
   - Chosen because: the release then carries no known wrong sentence, and waits for one light Change.
   - Applies to: this Change.
2. `check` keeps the reading's value `omitted` and changes its words.
   - Rests on: the manifest records `omitted`, which readers of the JSON may key on.
   - Considered: a new value `head`.
   - Chosen because: the words were wrong, not the state; a renamed value would break a reader for no gain.
   - Applies to: `src/cli/report.mjs`.

## Risks / Trade-offs

- None.
