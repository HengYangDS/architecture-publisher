## Why

The model's schema states its categories and statuses, and the categories Change of 2026-11-26 stated how each category
looks once in the publisher's code. The reference documents still write them again by hand: the model reference's table
of categories, which already says less than the code for two of them (`external` lacks Archify's type, `security` its
accent), and its sentence of statuses; the versions `migrate` converts, stated in the model reference's row of
`version`, its section on earlier versions, the operations reference and the shipped Skill; and the command line
reference's sample refusal, copied once from a terminal. The queue item `derived-references` asks that each be stated
once. The model reference stands at 500 non-blank lines, the cap, so its overview section moves to a page of its own
first.

Queue: `derived-references`.

## What Changes

- How each category looks moves from `src/kinds.mjs` into a registry, `src/categories.json`, which `src/kinds.mjs`
  reads as other modules read their registries; the reference writer reads it too, since the writer may not import
  the publisher's source.
- `tools/docs/references.mjs` writes the model reference's table of categories (each with its default icon and how it
  is drawn, the default marked) from the schema and the registry, and a row of statuses into its table of values from
  the schema; the sentence of statuses points to that row.
- The writer runs `archpub check` on a committed sample model, `docs/reference/refused-model.json`, and writes its
  output, without colour, as the command line reference's sample refusal.
- The earlier versions are named only in the model reference's section on them: its row of `version`, the
  operations reference's item on `migrate` and the shipped Skill point to that section or say "an earlier version",
  and the operations reference no longer restates the section's rules of conversion.
- The model reference's overview section moves to `docs/reference/overview.md`; the links to it, both indexes of
  the documents and the Skill's pointer follow. The model reference's table of values gets a heading of its own.
- A check, a build and a guide's scaffold load the faces a model's texts are measured in only once the loader has
  admitted the model: a check of a refused model took 0.53 to 0.79 s by the host's load, 0.47 s of it in faces it
  never measured, and the writer now runs one.

Out of scope: what a category looks like (no icon, type or hue changes); the words of a refusal's messages.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: the model reference's categories, statuses and sample refusal written from their sources.

## Impact

`src/categories.json` (new), `src/kinds.mjs`, `src/build.mjs`, `src/map/archify.mjs` (a cast the registry made
empty), the reference writer and its test, the sample `docs/reference/refused-model.json` (new), the references
`model.md`, `overview.md` (new), `command-line.md`, `operations.md` and `README.md`, `docs/README.md`,
`docs/glossary.md`, `docs/how-to.md` and the shipped Skill. No model is accepted or refused differently, and no
plate, page or message changes; what the loader refuses is reported before the faces are read, so a font supply that
differs from its manifest no longer hides those problems.
