## Context

See [proposal.md](proposal.md). An answer is keyed by the supply's digest, Node.js, the platform, the kind, the
quality and the document (`candidateAnswer`), so a kept answer is the answer Archify gives.

## Goals / Non-Goals

**Goals:**

- A review job asks Archify only for candidates no earlier job of its platform asked for.

**Non-Goals:**

- Protected jobs: a release is verified from nothing.

## Decisions

1. One variable for where the directory stands.
   - Considered: setting `ARCHPUB_ARCHIFY_ANSWERS` itself, which would skip the fixture's pruning.
   - Chosen because: the fixture still prunes answers a week old wherever the directory stands.
2. GitHub's cache keyed by platform and run, restored from the platform's newest.
   - Chosen because: a cache key cannot be written twice; a key of the run saves each job's answers.

## Risks / Trade-offs

- GitHub keeps one entry a run (about 16 MB) until its own limit evicts the oldest.
