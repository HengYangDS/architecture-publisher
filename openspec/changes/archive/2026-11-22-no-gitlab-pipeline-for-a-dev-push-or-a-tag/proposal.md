## Why

The owner approved on 2026-11-22 a trial of two weeks on this repository (「同意，按你的建议试行」, 14:15). In the seven
days before, GitLab ran 66 pipelines on this host's guests, 40.9 hours in all, each holding the host's one slot;
`dev` took 16.6 hours and tags 1.2, almost all of it a commit its proposal branch's pipeline had already run with the
same commands. 31 such repeats in those days found nothing; in the thirty days GitLab keeps, two failed, both on the
protected Windows runner, neither for a fault the proposal's run had missed.

## What Changes

- GitLab runs no pipeline for a tag or a push of `dev` (two rules at the head of the workflow's rules in
  `.config/ci/pipeline.cue`, and `.gitlab-ci.yml` generated from it). A push of `main`, a proposal branch, a merge
  request and a pipeline of `dev` started through GitLab's API run as before.
- The rule that admitted protected references no longer names tags, which no longer reach it.
- A test reads the generated rules for each event and names the jobs it starts.
- The development guide says what runs where and that a release first runs one protected pipeline of `dev`; the
  performance record gains the seven days' pipelines, the decision and its review on 2026-12-06; the changelog says
  so.
- GitHub is unchanged: it does not run on this host's guests and publishes to npm from its tag pipeline.
- A second commit, apart from the trial: the Linux job keeps Chromium in the tool cache that a job's clean spares, as
  the macOS and Windows jobs do. It kept its browsers in the image's own path, and since the lockfile's Playwright
  left the image's release on 2026-11-10 every job fetched 198 MiB anew: 65 of 65 jobs in the seven days, 1.6 hours
  in all, and 30 minutes of one job on 2026-11-22.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement names the pipelines a reference starts; they are the repository's development practice.

## Impact

Changed: `.config/ci/pipeline.cue`, `.gitlab-ci.yml` (generated), `tests/ci-projection.test.mjs`,
`docs/reference/development.md`, `docs/research/build-and-suite-time.md` and `CHANGELOG.md`. No delivered byte.
The holder's release script starts the protected pipeline of `dev` before `ethos land --release`, from the next
release on; the lane kit reuses the proposal's GitLab result for `dev` where the generated rules say a push of `dev`
starts none.

Queue: `maintenance`.
