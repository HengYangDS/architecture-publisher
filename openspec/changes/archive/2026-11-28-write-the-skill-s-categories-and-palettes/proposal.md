## Why

The agent Skill counted the categories a kind maps to ("the eight categories") and named the built-in palettes by
hand. An agent that has only the package reads neither set anywhere else, so the Skill cannot point elsewhere for
them, as it does for the exit statuses; each set is stated once, in the model's schema and the house's tokens, and the
owner chose on 2026-11-28 that each document's list be written from its source by `tools/docs/references.mjs`. The
Change before this one recorded the two sets as left on the research page (`docs/research/one-source.md`).

Queue: `maintenance`.

## What Changes

- The Skill lists the categories, written from the model's schema, and the built-in palettes by their Chinese names
  and ids, written from the house's tokens, each a paragraph between its own comment lines in a section at the Skill's
  end.
- The Skill's steps no longer count the categories or name the palettes; they point to that section.
- `archpub skill` prints the Skill as written, so its output carries the two lists and their comment lines.
- The research page records the Skill's two sets as written from their sources.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: one requirement is added: the Skill's categories and palettes written from their sources.

## Impact

`docs/research/one-source.md`, `skills/architecture-publisher/SKILL.md`, `tests/fixtures/references-writer.mjs`,
`tests/references-writer.test.mjs` and `tools/docs/references/model.mjs`.

No delivered byte changes, and no program behaviour; `archpub skill` prints the Skill's two lists.
