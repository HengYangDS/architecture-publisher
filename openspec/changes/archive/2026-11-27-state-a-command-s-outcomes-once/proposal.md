## Why

The command line's four outcomes, each with its exit status and the JSON object it prints, are stated in the program
as literals, again in its help text and its doc comment, and again in the command line and refusals references. The
census of 2026-11-27 (`docs/research/one-source.md`, "Prose that names a set the source states") lists these places
among the sets the documents restate; the owner chose on 2026-11-28 that each such set be stated once, in a
table the code reads, with the documents written from it.

Queue: `maintenance`.

## What Changes

- A table, `src/cli/outcomes.json`, states each outcome of a command once, in the order of its exit status: its
  status, whether it succeeded, the refusal code it prints or the registry's section its code comes from, the keys
  its JSON object carries after `ok`, and what it means.
- The program takes its exit statuses, the last line of its help, its reports' closing lines and its JSON results
  from the table; no exit status is written as a number in `src/cli/`.
- The command line reference's table of outcomes and the refusals reference's sentence on exit statuses are written
  from the table by `tools/docs/references.mjs`; the `internal_error` row of the refusal registry no longer restates
  its status.
- Every command's exit status, standard output and standard error are as before, the help included.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: one requirement is added: a command's outcomes stated once.

## Impact

`docs/reference/command-line.md`, `docs/reference/configuration.md`, `docs/reference/refusals.md`,
`src/cli/outcome.mjs`, `src/cli/outcomes.json`, `src/cli/report.mjs`, `src/cli/run.mjs`, `src/refusal.json`,
`tests/cli-outcomes.test.mjs`, `tests/references-writer.test.mjs`, `tests/refusal-registry.test.mjs` and
`tools/docs/references.mjs`.

No command's output and no delivered byte changes.
