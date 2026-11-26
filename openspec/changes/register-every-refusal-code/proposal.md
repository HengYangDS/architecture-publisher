## Why

The publisher raises or reports 181 codes, and no one place holds them. Each is a literal where it is raised, the
refusals reference lists 102 of them by hand, and four `layout_*` refusals and the codes a refusal's problems
carry are in no table. The queue item `derived-references` asks that the refusal codes stand in one registry, and
that a reference table restating the source be written from it by a command.

Queue: `derived-references`.

## What Changes

- `src/refusal.json` holds every code the publisher raises or reports, each once, with its meaning: the two a
  failed command prints, a refusal's own code, a problem's code with the refusals that carry it, a warning's, and
  the one it uses inside and never shows. Codes that share a meaning share a row.
- `refuse`, `Refusal`, a problem and the helpers that pass a code on take a registered code: the type check
  refuses a raise of a code the registry does not hold. A test reads every literal that stands where a code is
  raised or reported, in the JavaScript and the Typst classes, and holds that set equal to the registry's keys.
- `tools/docs/references.mjs` writes the tables of `docs/reference/refusals.md` from the registry, and the check
  of generated inputs refuses a table that differs. The reference gains a table of problem codes and one of
  warnings, and the refusals it lacked.
- A layout's route defects name their kind in `kind`: they rank candidate layouts and are no refusal's code.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-identity`: one registry of codes, held by the type check, a test and the reference written from it.

## Impact

`src/refusal.mjs` and `src/refusal.json`; the modules that pass a code through a variable or build a list of
problems; `src/layout/measure.mjs`; `tools/docs/references.mjs`; `docs/reference/refusals.md`,
`configuration.md` and `development.md`; the type check's configuration, which resolves the registry's JSON for the type; three tests and
a new one. No delivered byte, code, exit status or message changes.
