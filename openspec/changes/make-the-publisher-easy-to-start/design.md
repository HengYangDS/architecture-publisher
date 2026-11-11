## Context

See [proposal.md](proposal.md). 0.12.0 changes how a reader finds, installs, starts and asks for help, and justifies
the edition's readings. Twelve editions of the six published works pin the bytes that must not move, and show where
the readings do.

## Goals / Non-Goals

**Goals:**

- A newcomer installs the command in one line on Linux, macOS or Windows, on ARM64 or x86-64 where CI verifies it.
- An agent can draft a model and its guide from the Skill alone, and every command, option and refusal code the Skill
  names exists in the source.
- Every command explains itself with `--help`; no option is ignored without a word.

**Non-Goals:**

- Any change to a plate's composition, the page or the manifest's content beyond the readings' alignment; the new
  house style, with more styles, compositions and palettes and a general acceptance mark, is a later Change.
- Moving the layout prose out of `docs/reference/operations.md`: published works cite its line ranges, and moving it
  would orphan those citations for no reader-facing gain in this release.
- macOS on x86-64: GitHub's Intel runners and Homebrew's Intel bottles end in 2027.
- A gallery website, and splitting the CJK fonts out of the package.

## Decisions

- **Every reading justified.** The 24 em threshold set most readings flush left: at 80 percent of the body the column
  holds about 15 em. Set at that width in English, Spanish, Korean and Chinese, the house's prose rules (optimized
  lines, hyphenation in the model's language, word spaces from 80 to 125 percent) give an even right edge without
  rivers, while justification without hyphenation opens wide gaps in English. A summary above a figure is set by
  Typst as prose within 32 em, since justifying the engine's own lines would stretch a line short by a whole word; it
  keeps the engine's lines, flush left, in the rare case Typst needs more lines than the engine reserved.

- **One help source per command.** Each entry of the command table carries its usage lines, which both `archpub
--help` and `archpub <command> --help` print; the usage block stays derived from them.
- **The nearest field by edit distance.** An unknown field names the closest field of that object when the edit
  distance is at most a third of its length; otherwise the message is unchanged. The suggestion is part of the
  message only, so codes and paths are stable.
- **A warning, not a refusal, for an unused checkout.** Results gain a `warnings` array; text output prints each
  warning on its own line. A refusal would break callers that check a model before it claims files.
- **The Skill is versioned with the package.** `skills/architecture-publisher/SKILL.md` ships in the package's
  files; `archpub skill` prints it, and a test reads every command, option and refusal code the Skill names against
  the command table and the refusal codes in `src/`.
- **x86-64 is verified on GitHub only.** The lock pins Node.js, Typst, CUE and Taplo for `linux-x64` and
  `windows-x64`; GitHub runs the full verification on `ubuntu-24.04` and `windows-2025`. GitLab keeps its ARM64 jobs,
  and both Forges publish the same five archives.
- **npm publication waits for registration.** A tag job publishes with `npm publish --provenance` through GitHub's
  OIDC only when the repository variable `NPM_PUBLISH` is `enabled`; the package must first be registered by its
  owner.

## Risks / Trade-offs

- [x86-64 runners double the GitHub minutes of each run] → Accepted for a public repository; the jobs share the ARM64
  steps.
- [A README image ages when the house style changes] → The next style Change replaces it.
