## Context

See [proposal.md](proposal.md). The census of the sets the documents restate is a section of
`docs/research/one-source.md`. Three Changes before this one put a command's outcomes, the release's and runtime's
sets and the data's format in one place each; the generator `tools/docs/references.mjs` writes marked blocks of a
document from their sources, by family of sources, and `npm run check:generated` refuses a block that differs.

## Goals / Non-Goals

**Goals:** the model reference's, the lines reference's and the glossary's sets written from their sources or no
longer restated; every output as before.

**Non-Goals:** the operations reference's balance gates and their limits, which `GATES` in
`src/poster/compose/gates.mjs` states and does not export, so writing them from it changes a drawing root and belongs
to the compositions item of the queue.

## Decisions

1. **A sentence that holds a set is a paragraph block.** Rests on: the generator's blocks, each between two comment
   lines. Considered: a block inside a sentence or a table cell, which an earlier draft of this Change wrote; it
   tripled a line's raw length, broke the document's wrap, and made the raw Markdown that agents read noisy. Chosen
   because: a paragraph written from its source reads as before when rendered and keeps the raw text plain. The
   wording is kept where the values allow; the age bands' second bound reads 90 days, since the source states days and
   a month has no fixed number of them. A YAML file takes the same two lines as comments of its own syntax. Applies
   to: `docs/reference/model.md`, `docs/reference/lines.md` and `.github/ISSUE_TEMPLATE/bug-report.yml`.
2. **Constants imported as they stand.** Rests on: the maintenance rule that no file under the drawing roots changes.
   Considered: moving `STRIP_LENGTHS`, `BANDS` and `WIDTHS` into declared tables, which changes a drawing root, adds a
   table only the generator reads, or, for `src/house.json`, changes the manifest's house digest. Chosen because: the
   generator reads the module that states each set; this is an exception to its rule of reading declared files, and a
   comment at each import says why. Applies to: `tools/docs/references/measures.mjs`.
3. **The glossary names no file and no count.** Rests on: a glossary defines a term, and the reference it links to
   lists the delivery's files from `src/delivery.json` and the data's members from the data's schema; a committee of
   2026-11-26 chose a pointer for the delivery's contents for the same reason. Applies to: `docs/glossary.md`.
4. **Examples stay where they are read.** Rests on: an example is edited where an author reads it. Considered: the
   smallest model as a block written from a constant in the generator, which an earlier draft wrote. Chosen because:
   the format and version an example shows are what a model must state, and a test that loads each example holds them
   to the schema; the table of top-level fields then states no constant. Applies to: `docs/reference/model.md`,
   `docs/tutorial.md` and `tools/docs/references/model.mjs`.
5. **The Skill points instead of restating.** Rests on: the Skill is documentation the package ships, as the README
   is, and `archpub skill` prints it as written, so a generated block's comment lines would reach an agent's reading.
   Considered: blocks in the Skill, as in the references; the whole Skill written from a template, which keeps a
   second copy of its text in the repository. Chosen because: `--help` already writes the exit statuses from the
   outcomes' table, and the refusal names the clashing id, so two sentences that point say all an agent needs. The
   command's output changes by those sentences, as with any edit of the Skill; no program behaviour does. Applies to:
   `skills/architecture-publisher/SKILL.md`.

## Risks / Trade-offs

- A sentence written by the generator is edited in its code, not in the document; the comment above it names where.
