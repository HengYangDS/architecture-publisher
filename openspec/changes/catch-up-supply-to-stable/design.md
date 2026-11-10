## Context

See [proposal.md](proposal.md). The development dependencies are pinned exactly in `package.json`; the npm lock holds
their transitive closure. The CI pipeline is declared in `.config/ci/pipeline.cue` and projected into
`.github/workflows/verify.yml` and `.gitlab-ci.yml` by `tools/ci/projection.mjs`; GitLab's jobs run with the runner's
own mise.

## Goals / Non-Goals

**Goals:**

- Every development dependency and CI tool at the newest stable release public for 24 hours.

**Non-Goals:**

- Moving a dependency younger than 24 hours: `@fission-ai/openspec` 1.17.0 waits for a later move.
- Changing anything a build, a check or a delivery produces.

## Decisions

- **Move the lock with the pinned npm at a cutoff.** `npm install --package-lock-only --before=<24 h ago>` and then
  `npm update` with the same cutoff move exactly the pins and their transitive updates; no entry younger than the
  cutoff enters the lock. OSV names no advisory for any of the 29 moved versions.
- **Pin mise-action by its release commit.** v5.2.7 is commit `b44d12e7d0d8`; the workflow names the commit, as for
  every action.
- **Regenerate the workflow, never edit it.** The projection writes `verify.yml` from the pipeline declaration, and
  its check refuses a hand edit.

## Risks / Trade-offs

- [playwright-core 1.65.0 installs a newer Chromium] → The browser tests in the proof and in CI run on it before the
  move lands.
- [mise 2026.11.5 in CI changes how tools install] → The workstation installs the same lock with it, and fbee0c's
  acceptance installed this lock with it in isolation on 10 November.
