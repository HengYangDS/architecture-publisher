## Context

See [proposal.md](proposal.md). The census of the sets the documents restate is the last section of
`docs/research/one-source.md`; the reference tables were made one source by the item `derived-references`, whose
generator, `tools/docs/references.mjs`, writes marked blocks of a document from their sources and whose check,
`npm run check:generated`, refuses a block that differs.

## Goals / Non-Goals

**Goals:** each outcome's exit status and JSON keys stated once, read by the program and written into the references
from there; every command's output as before.

**Non-Goals:** a JSON Schema of a command's result, which no consumer reads and no validator is installed for; the
skill's text (`skills/architecture-publisher/SKILL.md`), which `archpub skill` prints as written and which states the
statuses too: a marked block there would change that output, so it is left to its own Change.

## Decisions

1. **A table of outcomes beside the program, not rows of the refusal registry.** Rests on: two of the four outcomes
   print no code of their own (success prints none, a refusal prints any code of the registry's `refusal` section),
   and `usage` and `internal_error` share the registry's `command` section but end with different statuses.
   Considered: a status on each registry section, which cannot tell usage from an internal error; a status on each
   row, which would repeat it on 59 refusal rows. Chosen because: an outcome is a fact of its own, which the registry's
   codes point to. Applies to: `src/cli/outcomes.json` and its reader `src/cli/outcome.mjs`.
2. **The JSON keys in the table, which the program builds each result from.** Rests on: the program prints each
   result itself. Considered: a JSON Schema of a result held by the tests, which would be a second statement the
   program does not read. Chosen because: one statement, the program's own, that a program reading `--json` can map a
   status to. Applies to: the four outcomes' JSON objects.
3. **The references written from the table, the prose kept for what it does not say.** Rests on: the generator's
   marked blocks. Chosen because: the table states the set; the prose explains `...`, the keys of a problem and
   where `--json` may stand. Applies to: `docs/reference/command-line.md` and `docs/reference/refusals.md`.

## Risks / Trade-offs

- A test outside this Change's affected light tests may pin the old literal text; the heavy tests run in the lane's
  pre-run, before the proof.
