## Context

See [proposal.md](proposal.md). `.config/ci/pipeline.cue` states the Mise release once (`miseVersion`) and the
action that installs it in GitHub's jobs; `tools/ci/projection.mjs` writes `.github/workflows/verify.yml` and
`.gitlab-ci.yml` from it. GitLab's Linux job downloads the Mise binary itself and checks it against
`.config/ci/linux/mise.sha256`; its macOS jobs run the guest's own Mise, which ETHOS 仓库纳管 reported moved to 2026.11.14 on 26
November 2026 at 05:50.

The releases between: Mise 2026.11.12 to 2026.11.14 add opt-in features (`mise audit`, `mise upgrade
--vulnerable`, global task filters in `mise run`, a sandbox for cached tasks on Linux) and change no default the
jobs use; 2026.11.12 records in `mise.lock` the platforms a tool has no build for, without changing the lock's
format. mise-action v5.2.10 fixes a download on Windows, and v5.3.0 adds a `mise_env` input; the workflow
sets `MISE_ENV` for every job, which the action's notes say works as before.

## Goals / Non-Goals

**Goals:**

- Every CI job runs Mise 2026.11.14, installed by mise-action v5.3.0 where an action installs it.

**Non-Goals:**

- Changing a tool of the Mise configuration, its lock, a job or a check.
- The publications' pipelines, which ETHOS's common model generates.

## Decisions

- The checksum is the one the release's `SHASUMS256.txt` gives for `mise-v2026.11.14-linux-arm64`, the same as
  GitHub's digest of the asset (both read on 26 November 2026 at 06:3x).
- The pipelines are generated, not edited: the projection's check holds them to the source.

## Risks / Trade-offs

- [The new Mise or action changes a job] → The proposal's push runs the hosted jobs on both Forges, and the
  landing waits for them; restoring the two lines of the pipeline's source and the checksum rolls it back.
