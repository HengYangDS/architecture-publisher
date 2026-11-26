## Why

The operations reference lists every command with its arguments and options in a block written by hand, and
`archpub --help --json` gives an agent the help's text alone, which it has to parse. The commands and their options
have one source, the program the command line builds. The queue item `derived-references` asks that a table of a
reference document restating the source be written from it by a command.

Queue: `derived-references`.

## What Changes

- `archpub --help --json`, and a command's `--help --json`, print `commands` beside `usage`: the program as data,
  each command with its name, usage, group, description, arguments, options and the commands it holds, walked from
  the commander program itself.
- `tools/docs/references.mjs` writes the operations reference's usage block from that catalogue, which it asks of
  the command line, and the check of generated inputs refuses a block that differs.
- The command line reference describes the help's JSON.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: the help as data, and the reference's list of commands written from it.

## Impact

`src/cli/run.mjs`, `tools/docs/references.mjs`, `docs/reference/operations.md` and `command-line.md`, two tests of
the command line. Additive: `usage` and the exit statuses are as before.
