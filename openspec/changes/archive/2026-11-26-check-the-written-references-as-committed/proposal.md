## Why

A reference document's tables that restate the source are written from it by `tools/docs/references.mjs`, and the
LikeC4 supply's manifest and notices from the locked packages by `tools/supply/likec4.mjs`; the check of generated
inputs refuses a table or a supply file that differs. Three consumers run `npm run generate` before that check: the
pipelines, the proof's `runtime-generation` gate and the publish job. `generate` ran both writers with `--write`, so
each check compared the committed files with what had just been written, and a table or a manifest changed by hand,
or a manifest left stale after an update of the lock, failed only a local check. The independent review of
`write-the-reference-s-categories-and-refusal` (2026-11-26) found it for the tables, and this Change's review for the
supply. It lands after `write-the-reference-s-categories-and-refusal`.

Queue: `derived-references`.

## What Changes

- `tools/supply/likec4.mjs` gains `--parser`, which writes only the parser the repository ignores and then verifies
  the supply's directory whole, so a committed manifest or notices that differ from the locked packages are refused,
  not rewritten. `--write` stays the command for an update of the supply.
- `npm run generate` runs `--parser` only: it writes no committed file. The reference tables are written by their
  writer's own command, as the check's refusal already says.
- The development reference says what generation does; the configuration reference gives the written tables one
  section, which replaces its stale paragraph on the refusals' tables.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: generation writes no committed file, so every check of generated inputs reads them as
  committed.

## Impact

`package.json` (the `generate` script), `tools/supply/likec4.mjs`, `docs/reference/development.md`,
`docs/reference/configuration.md`. The pipelines' steps, the projected CI files, the proof's gates and the bootstrap
task are unchanged; a developer who changed a table's source writes the tables with the writer's own command. No
product behaviour changes.
