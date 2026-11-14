## Why

The owner looked at `archpub` in a terminal on 2026-11-14 and asked for it to be researched and improved:
「archpub 的 cli 在屏幕上看起来好丑」, 「整体上要求满足：信、达、雅 打磨好 DX 和 UX，以及 agentic native」,
「利用好成熟工具和框架，减少手撸」. Run as a user would run it, the command line shows why. Its help is one block of
eleven usage lines with no grouping. A check prints one sentence per fact with nothing aligned and no mark for what
passed. A mistyped command gets the whole usage and no suggestion. A build or a check that takes minutes prints
nothing until it ends. All of it is written by hand: the argument parser, the help and every report.

AIGW, the owner's command line that reads best, gets there with cobra for commands and help and lipgloss for
status, under one rendering contract. The same division exists for Node.js.

## What Changes

- **BREAKING:** the texts a reader at a terminal reads change: the help, every command's report, refusals and
  usage errors. The `--json` results, their fields and the exit statuses do not change, except that a usage error's
  `message` is now commander's.
- Commands, options, help, version and usage errors come from commander. The help groups the commands by the role
  that runs them, author, reviewer and publisher, with `skill` and `help` under a heading for every role. A mistyped
  command or option names the nearest one.
- Reports come from clack: one line per fact with a mark for passed, needs attention, refused or noted, grouped
  under headings, with the next command to run at the end. A refusal lists each problem with its path. No line of
  a report is wider than the terminal, and a path inside the working directory is printed relative to it.
- A build or a check on a terminal shows the step it is at. Nothing of it reaches a pipe, a file or `--json`.
- The package declares commander and clack as dependencies, with the two libraries clack wraps and measures text
  with, and bundles them, so the release archive and the npm
  package stay self-contained. The rule that shipped modules import only Node.js and the publisher's own modules
  now admits the bundled dependencies in the command line's own directory and nowhere else.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: command help is grouped by role and suggests the nearest name; results for a reader at a
  terminal are marked and grouped; long commands show progress on a terminal only.
- `product-identity`: the package bundles the libraries its command line is built on.

## Impact

`package.json` and its lock (two dependencies, bundled), `src/cli/` (rewritten on the libraries, with one new
module for the reports), `src/build.mjs` (reports its steps to a listener), `tests/cli-commands.test.mjs`,
`tests/installed-cli.test.mjs`, `tests/module-boundaries.test.mjs`, `tests/release-archive.test.mjs`, the licenses
the archive carries, `docs/reference/operations.md`, `docs/tutorial.md`, `README.md`, the Skill and `CHANGELOG.md`.

Queue: `command-line`.
