## Context

See [proposal.md](proposal.md) and the research page `docs/research/build-and-suite-time.md`, its section "Archify's
answers kept between runs (2026-11-23)". `candidateAnswer` (`src/map/archify.mjs`) keeps an answer by a SHA-256 of the
vendored supply's digest, Node.js's version, the platform and architecture, the kind of answer, the quality and the
document, and reads only a whole answer; the test `tests/archify-answers.test.mjs` holds it, and a build with answers
kept delivers what one without delivers.

## Goals / Non-Goals

**Goals:**

- A candidate diagram is measured once on a machine, not once a run.

**Non-Goals:**

- Keeping answers in a proof's or a pipeline's own store: they use the system's temporary directory as the suite does.
- Changing the answers' key or what is kept.

## Decisions

1. One directory a machine, kept between runs.
   - Rests on: the measurement of 2026-11-23 (240 s and 4332 runs of Archify without, 130 s and 138 with).
   - Considered: keeping the directory a run (as now); a directory in the checkout's `build/`, which a lane's
     retirement removes and each worktree would hold apart.
   - Chosen because: the key holds everything an answer depends on, so an answer kept is the answer Archify gives.
   - Applies to: `tests/fixtures/archify-answers.mjs`.
2. Answers a week old are removed.
   - Rests on: the store grows by the candidates that change; 4044 answers after one run.
   - Considered: no removal; removal by size.
   - Chosen because: a week bounds the store by the work of a week, and an answer removed is asked again.

## Risks / Trade-offs

- Two runs at once share the directory: an answer is written beside its place and moved there, so a reader never
  meets half of one (`candidateAnswer`).
- The installed package's test names no store (`tests/installed-cli.test.mjs`), so the installed command still
  measures every candidate itself.
