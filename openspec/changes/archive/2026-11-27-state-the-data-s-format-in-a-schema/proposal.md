## Why

The delivery's data file had no machine-readable statement of its format: the data reference's tables of the data's
members and of an evidence row's keys were the format's own statement, which the tests held the data to, and the
reference restated the keys of a plate's record and face, a component, a relation, a group and a fact, and the four
ids that would give two files one name. The census of 2026-11-27 (`docs/research/one-source.md`, "Prose that names a
set the source states") lists these places; the owner chose on 2026-11-28 that each such set be stated once, in a
table the code reads, and that the data file gain a machine-readable schema an agent can read.

Queue: `maintenance`.

## What Changes

- A JSON Schema of the data file, `src/pinned/data.schema.json`, ships in the package: every member in its order, and
  the keys of every object the data writes in their order, each with its type and a description.
- The data takes each object's keys and their order from the schema, through `src/pinned/format.mjs`; every object the
  schema states is closed, and a key its definition lacks, or a required key that is missing, fails the build and
  names the key and its place.
- The data reference's tables and its sentence on the four ids are written from the schema and `src/delivery.json` by
  `tools/docs/references.mjs`. The ids that would give two files one name are computed once, in `src/names.mjs`, which
  the refusal and the reference both read.
- The tests hold every data file they build and read to the schema with a checker of the keywords the schema uses.
- The research page records that the schema replaces the data reference's tables as the format's statement.
- Every data file and every command's output are as before.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pinned-edition`: "The pinned edition as data" and "A row of evidence" name the schema as the format's statement;
  one requirement is added: the data's format stated in a schema.

## Impact

`docs/reference/configuration.md`, `docs/reference/data.md`, `docs/research/one-source.md`, `src/names.mjs`,
`src/pinned/data.mjs`, `src/pinned/data.schema.json`, `src/pinned/evidence.mjs`, `src/pinned/face.mjs`,
`src/pinned/format.mjs`, `src/projection.mjs`, `src/refusal.json`, `tests/data-schema.test.mjs`,
`tests/delivery-data.test.mjs`, `tests/delivery-guide-files.test.mjs`, `tests/delivery.test.mjs`,
`tests/facts-pin.test.mjs`, `tests/fixtures/data-format.mjs`, `tests/overview.test.mjs`, `tests/pinned-data.test.mjs`,
`tests/pinned-evidence.test.mjs`, `tests/pinned-reader.test.mjs`, `tests/references-writer.test.mjs`,
`tools/docs/references.mjs`, `tools/docs/references/command-line.mjs`, `tools/docs/references/data.mjs`,
`tools/docs/references/delivery.mjs`, `tools/docs/references/operations.mjs` and `tools/docs/references/text.mjs`.

No command's output and no delivered byte changes; the package gains `src/pinned/data.schema.json`.
