## Why

No module of the publisher reads `src/model/schema.json`: the loader restates by hand the model's format and
version, its categories and statuses, and the patterns and limits it holds a single value to. The two already
disagree in four places where the schema accepts what the loader refuses: a text that holds a NUL; a path with an
empty segment; a path with a line separator before a `.` or `..` segment; and a model's id that is a name Windows
reserves for a device or ends in a dot. The queue item `derived-references` asks that a model's enumerations,
patterns and limits be stated once, and that the schema and the loader's checks both come from that statement.

Queue: `derived-references`.

## What Changes

- `src/model/vocabulary.mjs` reads from the schema the format, the version, the categories, the statuses, the
  patterns of an id, a model's unportable id, an icon, a revision, a browse address, a licence, a detail's name, a
  colour, a guide, a path and a path that is no glob, the limits of a text and a path, and the tracks of a stretch;
  it refuses at import a value the schema does not state. The loader, its path and overview checks and the palette's
  check take them from it.
- The schema gains the loader's rules of one value that it lacked: no NUL in a text; no empty segment, and no `.` or
  `..` segment after a line separator, in a path; no device's name and no final dot in a model's id.
- A characterisation test holds the problems of 68 bad models, code, path, message and order, to what the loader
  reported before the change. A test walks the schema and refuses its patterns and longest lengths written again in
  a model module, and holds the schema to the loader's rules of one value.
- The model reference's rules of ids, text and paths are written from the schema by `tools/docs/references.mjs`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: the model's vocabulary read from its schema.

## Impact

`src/model/` (a new module, four modules and the schema), the reference writer and its test, two model tests and
their fixtures, `docs/reference/model.md`. No model is accepted or refused differently by the publisher, and no
problem's code, path or message changes; a JSON Schema validator now refuses the four kinds of value above.
