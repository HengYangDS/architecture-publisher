## Why

The model reference restated the strip's lengths, the three age bands and the fields of a palette of a model's own,
and its table of top-level fields the model's format and version; the lines reference restated the three widths the
line trials measured at; and the glossary restated the file names of the data, the manifest, the page, the print
edition, the reader file, the acceptance and the delivery's contents, the data's members and the number of balance
gates. The agent Skill restated the exit statuses and the ids that would give two files of a delivery one name, and
the lines reference counted the line weights, and the bug report's form listed the release's platforms. The census of
2026-11-27 (`docs/research/one-source.md`, "Prose that names a set the source states") lists these places; the owner
chose on 2026-11-28 that each such set be stated once, in a table the code reads, and that each document's list be
written from it by `tools/docs/references.mjs`.

Queue: `maintenance`.

## What Changes

- The model reference's sentences of the strip's lengths, the age bands and a palette's colours, and the lines
  reference's sentence of the measured widths, are written by `tools/docs/references.mjs` from the modules and the
  schema that state them, each a paragraph between its own comment lines, worded as before where the values allow.
- The table of top-level fields no longer states the model's format and version; the model reference's smallest model
  and the tutorial's model show them, and a test holds both examples valid with the loader.
- The glossary names no file and no count: each term keeps its meaning and its link, and the references it links to
  list a delivery's files and the data's members from their sources.
- The Skill names neither the exit statuses nor those ids: the exit status is the one `--help` lists, and a model
  whose id would give two files of its delivery one name is refused, naming its id. The lines reference describes the
  two line weights instead of counting them.
- The bug report's form offers the release's platforms written from the mise lock between two YAML comment lines, as
  the README's are.
- Every delivered byte and every command's output are as before, but for `archpub skill`, which prints the Skill as
  written and so carries its two reworded sentences.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: the table of top-level fields states each field's description and the values it takes, not a
  constant; one requirement is added: the references' measures written from their sources, and the examples held
  valid.

## Impact

`.github/ISSUE_TEMPLATE/bug-report.yml`, `docs/glossary.md`, `docs/reference/configuration.md`,
`docs/reference/lines.md`, `docs/reference/model.md`, `docs/research/one-source.md`,
`skills/architecture-publisher/SKILL.md`, `tests/fixtures/line-tables.mjs`, `tests/fixtures/references-writer.mjs`,
`tests/line-table.test.mjs`, `tests/references-measures.test.mjs`, `tests/references-writer.test.mjs`,
`tools/docs/references.mjs`, `tools/docs/references/delivery.mjs`, `tools/docs/references/measures.mjs`,
`tools/docs/references/model.mjs`, `tools/docs/references/operations.mjs` and `tools/docs/references/text.mjs`.

No delivered byte changes, and no program behaviour; `archpub skill` prints the Skill's two reworded sentences.
