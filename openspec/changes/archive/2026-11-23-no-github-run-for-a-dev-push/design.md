## Context

See [proposal.md](proposal.md). ETHOS lands by fast-forward, so the commit pushed to `dev` is one a proposal branch
ran. GitLab has run no pipeline for a push of `dev` since 2026-11-23 08:47.

## Goals / Non-Goals

**Goals:**

- A commit published to `dev` runs once on GitHub, on its proposal branch.

**Non-Goals:**

- Tags and protected runs: unchanged.
- Other repositories: decided after the review of 2026-12-06.

## Decisions

1. A push filter, not a job condition.
   - Rests on: a condition would still start a run whose jobs are all skipped.
   - Considered: `github.ref_name != 'dev'` in the review jobs' condition.
   - Chosen because: no run is clearer than an empty one; `tags: ["**"]` keeps tags, which a filter naming branches
     alone would drop.
   - Applies to: `.config/ci/pipeline.cue`.

## Risks / Trade-offs

- A commit reaching `dev` without a proposal run would have no GitHub result; the holder's kit then waits for one
  and the landing stops.
