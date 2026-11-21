## Why

On 2026-11-20 the owner made one source for each fact a hard requirement of everything built here. The census of
that day (`docs/research/one-source.md`, "Names the source forms") found the JavaScript and the Typst class naming
the same things on both sides with no table between them: the five labels the class sets and the publisher
queries (`archpub-end`, `-mark`, `-line`, `-box`, `-loose`), a plate's key, which the drawing forms again from
`plate-`, and the files staged for Typst, written by name and read by name. A name changed on one side would leave
the other setting, staging or querying the old one, and nothing but a failed build would say where.

## What Changes

- A table, `src/shared.json`, names what the JavaScript and the class share: the directory the class is staged in,
  the files staged beside it (the tokens, the model, the breaks, the overview's inputs, the edition's and the
  colophon's records), the delivered model's name, which the class gives the model it attaches to the edition, the
  directory of the plates' staged figures, the five labels, and what a plate's key begins with.
- The unit `names` reads the table, read-only, and forms a plate's key and its staged figure from it; the overview's
  staging copies the table beside the class by its own name. Every module that staged, wrote or queried one of the
  names takes it from the table.
- The class reads the table where it is staged and sets each label, reads each staged file and names the attached
  model from it; the drawing and the colophon page take it from the class they import. The table's own name is the
  one name both languages state.
- `tests/one-source.test.mjs` refuses a name of the table written again in the JavaScript or the Typst, and holds
  the table's own name to the two places that state it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement changes: every page, image, figure, edition, data and reader file, and every refusal, is what
it was.

## Impact

New: `src/shared.json`. Changed: `src/names.mjs`, `src/overview/typeset.mjs`, `src/edition/typeset.mjs`,
`src/edition/colophon.mjs`, `src/edition/record.mjs`, `src/overview/house.typ`, `src/overview/drawn.typ`,
`src/edition/colophon.typ`; `tests/one-source.test.mjs`; `docs/reference/development.md` where it names the units,
and `CHANGELOG.md`. Untouched: `src/house.json`, the model's schema, the manifest's format, and every file a
delivery lists. Each delivery's `manifest.json` changes in two values, `edition.house` and `overview.house`: the
digest of the class's inputs, which now covers the edited class and drawing and the table.

Queue: `one-source`.
