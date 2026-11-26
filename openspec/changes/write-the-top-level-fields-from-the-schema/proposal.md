## Why

The model reference's table of top-level fields is written by hand: it restates the schema's fields, which of them
are required, the constants of `format` and `version`, the languages of `locale` with its default, and the fewest
items of the lists, and no test holds it to the schema. The schema describes nine of its twenty-two fields for an
author's editor, eight of them again in other words. The data reference keeps a table of three refusal codes and their meanings, to
which the refusal registry's row defers, and the model reference states the limit of a detail's name in prose. The
queue item `derived-references` asks that a reference table restating the source be written from it; the review of
`check-the-written-references-as-committed` (2026-11-26) found these left. It lands after that Change.

Queue: `derived-references`.

## What Changes

- Every top-level field of the schema carries one description, which an editor shows and the model reference prints;
  the locale's default is the schema's `default`, held to the publisher's default language as its languages are.
- `tools/docs/references.mjs` writes the model reference's table of top-level fields from the schema: each field in
  the schema's order, whether it is required, its description, and what the schema states of its value (a constant,
  the values it takes with the default, the fewest items of a list). A field the schema neither describes nor fixes
  stops the writer.
- The table of values gains a detail's name, written from its pattern, and the prose on details points to it.
- The three codes of the data reference's table each get a row of their own in the refusal registry, with the meaning
  that table gave; the data reference names them and links the refusals reference.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: the model's top-level fields described once, in its schema, and the reference written from
  it.

## Impact

`src/model/schema.json` (descriptions and the locale's `default`), `src/refusal.json` (three rows), the reference
writer and its test, `tests/locale.test.mjs`, `docs/reference/model.md`, `docs/reference/data.md` and the written
`docs/reference/refusals.md`. No model is accepted or refused differently; an editor shows the new descriptions.
