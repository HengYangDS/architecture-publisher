## Context

See [proposal.md](proposal.md). The owner's words of 2026-11-25 13:45, relayed by the session that governs ETHOS's
repositories: 「ethos 所有纳管仓库，全面去除对 windows 的支持，从 CI 以及各个方面」. The measures of the Windows jobs are in
`docs/research/build-and-suite-time.md`, which keeps them as the record of what was measured.

## Goals / Non-Goals

**Goals:**

- No job, archive, lock row, code path, test or reference of the product serves Windows.

**Non-Goals:**

- The Windows runners' registration and the Windows guest itself: the host's, not this repository's.
- Archify and the bundled supplies, shipped whole as their publishers made them.
- Archived Changes and research pages: the record of what was decided and measured.

## Decisions

1. GitHub keeps x86-64 Linux.
   - Rests on: the release ships a `linux-x64` archive, which only GitHub's hosted runner verifies; the owner's rule
     admits x86-64 Linux on GitHub where needed.
   - Considered: dropping the archive, and with it x86-64 Linux.
   - Chosen because: the archive serves readers on x86-64 Linux machines, and its job costs no guest time.
   - Applies to: `.config/ci/pipeline.cue`.
2. A model id that is a Windows device name stays refused.
   - Rests on: the id names the delivery's directory, which a reader copies or unpacks on a system of their own.
   - Considered: dropping the rule with the rest.
   - Chosen because: it guards a name the publisher writes, not a platform it runs on.
   - Applies to: `src/model/load.mjs` (unchanged).
3. A signature keeps ssh-keygen's own line ends.
   - Rests on: only Windows' ssh-keygen ends lines in carriage returns.
   - Considered: keeping the conversion as harmless.
   - Chosen because: code that serves no supported platform is code no test can hold.
   - Applies to: `src/delivery.mjs`. The overview's reading of a path Typst reports on Windows
     (`src/overview/typeset.mjs`) stays: it is drawing source, which a maintenance Change does not touch, and it reads
     nothing on the other platforms.
4. One macOS label on both Forges.
   - Rests on: the owner's choice of 2026-11-25 13:54 (option 1 of three), relayed with the question that named
     them: `macos-latest` moves with GitHub's hosted runner; the host's macOS guest takes the same label, and the
     trust role names which of its runners a job may use.
   - Considered: a fixed `macos-26` on both, false on the macOS 27 guest; GitHub `macos-26` and GitLab `macos-27`.
   - Chosen because: the owner chose it, and the two Forges' jobs then read alike.
   - Applies to: `.config/ci/pipeline.cue`; the guest's runners gain the tags before the proposal is pushed (the
     session that governs the host), and lose the old ones after `main` is published.

## Risks / Trade-offs

- A reader on Windows loses the archive and the npm package's tested path. The package may still run there; no
  release says so.
- A release's notes must say the two archives are gone.
