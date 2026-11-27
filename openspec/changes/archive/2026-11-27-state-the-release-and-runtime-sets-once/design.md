## Context

See [proposal.md](proposal.md). The census of the sets the documents restate is the last section of
`docs/research/one-source.md`. The first Change of this work, `state-a-command-s-outcomes-once`, put a command's
outcomes in one table; the generator `tools/docs/references.mjs` writes marked blocks of a document from their
sources, and `npm run check:generated` refuses a block that differs.

## Goals / Non-Goals

**Goals:** the release's platforms, the archive's members, the runtime dependencies and a child's variables each
stated once, read by the code that uses them, and the documents written from there; every output as before.

**Non-Goals:** the development reference's account of the bundled libraries and the module-boundary test's lists,
which state what each library is for and where it may be imported, not only which they are; the issue template's
platforms, which are YAML options, not Markdown; a member named once as an example in prose.

## Decisions

1. **The platforms from the lock, through the function the release reads.** Rests on: the release already takes its
   platforms from `.config/mise/mise.lock` (`lockedPlatforms`). Chosen because: the lock is the declared owner. Each
   platform's words come from two small maps of the generator (`linux` to Linux, `arm64` to ARM64); a platform with a
   word the maps lack stops the generator with `references_platform_unnamed`, so a new platform cannot be written
   unnamed. Applies to: the operations reference, the README and the how-to.
2. **The archive's members in a table, not an export.** Rests on: the members were stated in the assembly and again as
   `bin_path` in the mise declaration. Considered: the generator importing the assembly's constants. Chosen because:
   the table removes the second statement, the generator reads it from the root it is given, so a test can change it,
   and the assembly's lookups stay as simple. Applies to: `assemble.mjs`, `declaration.mjs` and the reference's table.
3. **A child's variables in a table beside the module that passes them.** Rests on: the generator reads declared files
   and imports no product module. Chosen because: the variables are a fact of the product, which the module and the
   reference both read. Applies to: `src/environment.json` and `src/environment.mjs`.
4. **The generator split by family of sources.** Rests on: with this Change's blocks the generator reached 562
   effective lines, over the repository's limit of 500. Considered: moving only the new blocks out. Chosen because:
   each family (the model's schema and tables; the commands, outcomes and refusals; the delivery, the supplies and the
   release's and runtime's sets) is read and written together, and the shared forms and the check are one small
   module. Applies to: `tools/docs/references.mjs` and `tools/docs/references/`.

## Risks / Trade-offs

- The archive's existing paths, modes and bytes are shown unchanged by a comparison of the assembly on fixed inputs
  for each locked platform before and after; the archive gains `src/environment.json`, which the heavy test that holds
  its members (`release-archive`) states and which runs in the lane's pre-run.
- Two children the publisher starts receive the caller's whole environment, `ssh-keygen` and the LikeC4 parser; the
  operations reference now says so. Whether the parser should receive only the table's variables is a change of
  behaviour, left out of this maintenance Change and recorded for its own.
