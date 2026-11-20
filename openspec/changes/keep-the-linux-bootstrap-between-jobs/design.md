## Context

See [proposal.md](proposal.md). `.config/ci/pipeline.cue` owns the pipeline; `tools/ci/projection.mjs` writes
`.gitlab-ci.yml` from it and `npm run check:ci` holds the two together. The Linux job runs in a container whose
build directory the runner keeps, and `GIT_CLEAN_FLAGS` spares `build/runtime/tool-cache/` there, where Mise's
own installs already persist. The staged release alone was fetched anew by every job.

## Goals / Non-Goals

**Goals:**

- A Linux job that does not fail because the guest's network is slow for three minutes.
- No download in a job whose runner already holds the release.
- Each step of the bootstrap stays one native command, as the repository paradigm requires.

**Non-Goals:**

- The guest's network, which the product does not own.
- An image that carries Mise. It would move the version to a second place, the image's build, beside the
  pipeline's definition.

## Decisions

1. Curl's own resume decides whether to fetch.
   - `--continue-at -` asks the server for the bytes after those the staged file holds. A partial file is
     completed; a whole file gets the server's answer that no range is left, which Curl takes as success and
     which transfers nothing. Measured on 2026-11-20 with curl 8.7.1 against a release asset of the same host:
     the second run answered 416, exited 0 and received 0 bytes.
   - Considered and withdrawn: one step that checks the checksum first and fetches only where it fails, with a
     second fetch where a resumed file is still wrong. It was a sequence of commands in one step, and the
     repository paradigm reported it as inline shell at this Change's first commit.
2. The staged file carries the release's name.
   - A file staged under one fixed name would, after a move to another Mise release, be resumed from the old
     release's bytes and fail its checksum in every job until a person cleared the runner's cache. Under the
     release's own name, `mise-v<version>-linux-arm64`, a new release starts a new file.
   - The checksum carrier therefore names the release it pins, as a line of a checksum list does. The version
     stands in it beside the pipeline's definition; the projection's test holds the two together. Writing the
     carrier from the definition would give the version one place and belongs with the queue's work on single
     sources, not here.
3. A download gets fifteen minutes.
   - 157 MB at the 0.2 MB/s measured on 2026-11-20 takes thirteen. The job's own limit stays 75 minutes.

## Risks / Trade-offs

- A job on a runner without the release still depends on the network once. → It has fifteen minutes, and what it
  received stays for the next job to resume.
- A staged file damaged on disk fails its checksum in every job. → Curl appends only what the server sends for
  the range it asked, so a partial file is a true beginning; a damaged one is cleared with the runner's cache.
- Each Mise release leaves its staged file in the runner's tool cache, 157 MB a release. → A few a year.
