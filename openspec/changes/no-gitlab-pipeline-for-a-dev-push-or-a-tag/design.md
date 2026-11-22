## Context

See [proposal.md](proposal.md) and the research page `docs/research/build-and-suite-time.md`, its section "The
pipelines of seven days (2026-11-22)". GitLab's review and protected jobs run the same `.verify-native` script with the
same image and lockfiles; they differ in the runners they are sent to. ETHOS lands a lane by fast-forward, so the commit
pushed to `dev` is one a proposal branch's pipeline ran: the lane's own, or, where several lanes land one after
another, the last one's, whose proposal holds them all.

## Goals / Non-Goals

**Goals:**

- A commit published to `dev` has been run once on GitLab, on a proposal branch, and is run once more as the release
  commit on `main`.
- The protected runners are still exercised before anything irreversible: a release runs one protected pipeline of
  `dev` before `ethos land --release` moves `main`.

**Non-Goals:**

- GitHub's runs: they use no slot of this host.
- The other repositories ETHOS governs: whether they follow is decided after the trial, by ETHOS's owner session.
- Fewer platforms on a proposal branch: a fault found after landing costs more than the run.

## Decisions

1. No GitLab pipeline for a push of `dev`.
   - Rests on: the seven days' 31 repeats after a passing proposal pipeline, none failed; the thirty days' two
     failures, both of the protected Windows runner's own environment (a linker that could not open a file in its
     build directory; a job that reached its hour's limit).
   - Considered: running `dev` as now (16.6 hours of the slot a week); running only Linux on a proposal branch.
   - Chosen because: the same commands on the same commit, and the protected runners are still run before a release.
   - Applies to: `.config/ci/pipeline.cue`'s workflow rules.
2. No GitLab pipeline for a tag; the release commit is verified on `main`.
   - Rests on: a tag names the commit `main` holds, whose protected pipeline runs when `main` moves.
   - Applies to: the same rules; GitHub's tag pipeline, which publishes to npm, is unchanged.
3. One protected pipeline of `dev` before a release, started through GitLab's API.
   - Rests on: the release is the one step that cannot be taken back; both thirty-day failures were of the protected
     runners, and each would have stopped here, before `main` and the tag moved.
   - Applies to: the holder's release script, from the release after this Change.
4. A trial of two weeks, measured again on 2026-12-06 by the same count (the failures and the slot's hours), then
   kept, reverted or offered to the other repositories.
5. The Linux job keeps Chromium in the tool cache, apart from the trial.
   - Rests on: the Linux jobs' logs of the seven days (the research page's section on the download); the job's own
     log, in which its tools are found installed from the same cache.
   - Considered: building the image again for each release of Playwright, which is a rule to remember at every move
     of the lockfile and an image to publish.
   - Chosen because: the lockfile alone then decides which Chromium runs, on every platform alike, and a move costs
     one download a runner.
   - Applies to: the Linux job's variables in `.config/ci/pipeline.cue`.

## Risks / Trade-offs

- A fault of the protected runners shows at a release instead of at each landing. The release waits for that run;
  between releases, `dev` carries no protected result of its own.
- Whether GitLab holds protected variables for this project was not read (its interface returns the values). A job
  that behaves otherwise with one shows it at the release's protected pipeline, not at each landing.
- The image's own browsers are no longer used; it still supplies Chromium's system libraries, which are those of
  the release it was built from. A later Chromium that needs another library fails the job's browser admission,
  which names it.
