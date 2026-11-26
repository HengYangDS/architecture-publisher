## Why

A delivery's files are named in `src/names.mjs`, and the operations reference lists them in a table kept by hand
beside it, with the default image width written again as a number. The queue item `derived-references` asks that a
table of a reference document restating the source, a delivery's files among them, be written from the source by a
command.

Queue: `derived-references`.

## What Changes

- `src/delivery.json` holds each file at the top of a delivery once: its role, its name or the pattern a build forms
  it from, when it is written, what it holds and, for a fixed or id-named file, what a refusal calls it.
- `src/names.mjs` takes every name of a delivery's files and the default width from it, and `src/projection.mjs`
  what its refusal calls a file whose name a model id would take.
- `tools/docs/references.mjs` writes the operations reference's table of a delivery's files from it, and the check
  of generated inputs refuses a table that differs. The table gains a column for when each file is written.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: a delivery's files named in one table, from which the reference's table is written.

## Impact

`src/delivery.json`, `src/names.mjs`, `src/projection.mjs`, `tools/docs/references.mjs`, `docs/reference/operations.md`,
the writer's test and a new test. No
file a build delivers changes its name or its bytes.
