## Context

See [proposal.md](proposal.md). The research page `docs/research/one-source.md` found the operations reference's
usage block kept by hand beside the commander program of `src/cli/run.mjs`. The repository's tools import no module
of the product (`tests/module-boundaries.test.mjs`), so the writer cannot read the program; `archpub --help --json`
printed the help's text alone.

## Goals / Non-Goals

**Goals:**

- The commands and their options are stated once, in the program, and the reference's block is written from it.
- An agent reads the commands as data.

**Non-Goals:**

- The prose that explains each command and option, which is the authors'.
- Changing a command, an option, a help's text or an exit status.

## Decisions

1. **The help's JSON carries the program.** A committee of three, each blind to the others, chose this two to one
   on 2026-11-26 (the research page's section "How the rest of the references are written", which this Change
   adds): it adds nothing to declare, gives agents the catalogue, and parses no help text. The third chose a data
   file the program is built from, which would be a second statement of the program.
2. **Every help's JSON carries the whole program.** An agent that asked one command's help gets the catalogue too,
   from the same call; the catalogue is the program's, not the command's, and its root is `archpub`.
3. **The catalogue is walked from commander's own help.** `createHelp()`'s visible arguments, options and commands,
   each command's `usage()` and `helpGroup()`, so the catalogue and the help cannot differ in what they list.
4. **The writer runs the command line, as an agent does.** The module boundaries forbid a tool to import a module
   of the product's, and it imports none: it runs `node src/cli/main.mjs --help --json` in a process of its own, with
   no environment but the path, reads what it prints, and writes
   each runnable command's synopsis: its words, its arguments, then its options in the program's order, an optional
   one in brackets. The block follows the program's order: against the hand-written block, `check`'s `--against`
   moves after `--quality`, `scaffold guide` comes before `import likec4`, and the program's line reads
   `--version | --help`.

## Risks / Trade-offs

- [A commander release changes what its help exposes] → The catalogue test holds every command, argument, option
  and description to the command's own help text, and the version is pinned in the lock.
- [A table changed by hand passes] → A test runs the writer on a copy of what it reads with a table of each kind
  changed: its check refuses and names the document, and its write puts it back.
- [The writer runs the product] → It runs the command in the checkout with no network, in seconds, inside the check
  of generated inputs, which already runs the CI projection's tools.
