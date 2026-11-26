## Context

See [proposal.md](proposal.md). The research page `docs/research/one-source.md` counted a delivery's file names
formed in six modules on 2026-11-20; the Change `name-a-delivery-s-files-in-one-module` of 2026-11-21 brought them
into `src/names.mjs`. Their meanings stayed in the operations reference's table, written by hand beside it, and
again, shorter, in `src/projection.mjs`'s refusal of a model id that takes a fixed name. The committee of
2026-11-26 chose a table of the files as data, read by the module that names them and by the writer (the page's
section "How the rest of the references are written", which the Change `catalogue-the-commands-in-the-help`, landed
before this one, adds).

## Goals / Non-Goals

**Goals:**

- Each file of a delivery has one row, and the names the source forms and the reference's table both come from it.

**Non-Goals:**

- Changing a file's name, a delivery's layout (the queue item `delivery-layout`) or what a file holds.
- The house class's own names (`src/shared.json`), which the Typst reads too.

## Decisions

1. **Data beside the names.** `src/delivery.json` sits beside `src/shared.json` and is read the same way, once and
   frozen; `names.mjs` keeps its exports, so no caller changes, and adds the resolved names and the rows.
2. **A pattern names what a build forms.** `{id}`, `{NN}`, `{view}`, `{name}` and `{width}`; the names `names.mjs`
   forms from a model or a plate are held to the patterns by a test with a model id and a plate. The delivered
   model's name stays with `src/shared.json`, which the house class reads to attach it; its row says `{shared}`.
3. **The table states the default width and what a refusal calls a file.** `defaultWidth`, read by `names.mjs`
   and the writer; each fixed or id-named file's `called`, read by `src/projection.mjs`, whose refusal of a model
   id that takes a fixed name keeps its words.
4. **When a file is written is a column of its own.** It was the end of the content's sentence ("unless excluded",
   "absent until then"); a column of its own reads at a glance and is filled from the row's `when`.

## Risks / Trade-offs

- [A new file of a delivery is named in `names.mjs` and not in the table] → Every name `names.mjs` exports for a
  delivery reads the table, and the test fails for a row it lacks.
- [A row's "written" is wrong] → An independent review compared each row with what a build and an acceptance
  write before the lane (images and figures only with the edition); a fixed name's row is held by the refusal's
  test of a model id that takes it.
