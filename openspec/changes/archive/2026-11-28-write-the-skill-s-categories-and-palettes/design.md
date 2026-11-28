## Context

See [proposal.md](proposal.md). The Change `write-the-references-sets-from-their-sources` made the Skill point to
`--help` for the exit statuses and say why a model's id is refused instead of listing the ids, and left the Skill's
categories and palettes for a Change of their own, since no command an agent runs lists them.

## Goals / Non-Goals

**Goals:** the Skill's categories and palettes written from the sources that state them; the Skill still printed as
written.

**Non-Goals:** the Skill's other guidance, such as the most cards a row holds, which the layout states in a drawing
root and which goes with the compositions item of the queue.

## Decisions

1. **Blocks in the Skill.** Rests on: the Skill is the one guide an agent with only the package reads, and the
   generator's blocks, each between two comment lines. Considered: pointing to the model's schema, which an agent can
   read but which holds no Chinese name of a palette; the whole Skill written from a template, which keeps a second
   copy of its text in the repository. Chosen because: two lists written from their sources keep the Skill whole and
   state each set once; the comment lines reach an agent's reading, as the README's reach a reader of its source. The
   lists stand in a section at the Skill's end, which its steps point to: a block's comment lines need blank lines
   around them, which the tight list of steps does not take under the repository's Markdown spacing. Applies to:
   `skills/architecture-publisher/SKILL.md` and `tools/docs/references/model.mjs`.
2. **The Skill as documentation.** Rests on: the Skill is documentation the package ships, as the README is, and
   `archpub skill` prints it as written. Chosen because: the command's behaviour is unchanged; its output changes with
   the Skill's text, as with any edit of the Skill. Applies to: this Change's queue line, `maintenance`.

## Risks / Trade-offs

- An agent reads the two lists at the Skill's end, a step away from the steps that use them.
