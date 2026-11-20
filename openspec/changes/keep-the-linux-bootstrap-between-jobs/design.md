## Context

See [proposal.md](proposal.md). `.config/ci/pipeline.cue` owns the pipeline; `tools/ci/projection.mjs` writes
`.gitlab-ci.yml` from it and `npm run check:ci` holds the two together. The Linux job runs in a container whose
build directory the runner keeps, and `GIT_CLEAN_FLAGS` spares `build/runtime/tool-cache/` there, where Mise's
own installs already persist. The staged release alone was fetched anew by every job.

## Goals / Non-Goals

**Goals:**

- A Linux job that does not fail because the guest's network is slow for three minutes.
- No download in a job whose runner already holds the release.

**Non-Goals:**

- The guest's network, which the product does not own.
- An image that carries Mise. It would move the version to a second place, the image's build, beside the
  pipeline's definition.

## Decisions

1. The checksum decides whether to fetch.
   - The file `.config/ci/linux/mise.sha256` already states what the staged release must be. A job checks it
     first and fetches only where it does not hold, so a change of the Mise version fetches once and a kept file
     of the right version is never fetched again.
2. A partial file is resumed, and a file that is still wrong after that is fetched whole.
   - A download that ran out of time leaves a partial file; resuming it keeps what a slow network already gave.
     A kept file of another version, or a damaged one, fails the checksum after the resume and is replaced.
3. A download gets fifteen minutes.
   - 157 MB at the 0.2 MB/s measured on 2026-11-20 takes thirteen. The job's own limit stays 75 minutes.
4. One line states the fetch.
   - The command and the staged path are named once in the pipeline's definition and used by the three lines
     that need them.

## Risks / Trade-offs

- A job on a runner without the file still depends on the network once. → It has fifteen minutes and keeps what
  it received for the next job.
- The first job after this Change resumes a file a failed job left. → The checksum decides; a wrong file is
  fetched whole.
