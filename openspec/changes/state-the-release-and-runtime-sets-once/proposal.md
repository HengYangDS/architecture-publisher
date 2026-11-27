## Why

Four sets that the release and the runtime use are restated in the documents: the release's platforms, in the
operations reference, the README and the how-to; and the archive's members, the runtime dependencies and the variables
a child process receives, in the operations reference. Two of them are stated only in code (the variables in
`src/environment.mjs`, the members in the archive's assembly and again in its mise declaration). The census of
2026-11-27 (`docs/research/one-source.md`, "Prose that names a set the source states") lists these places; the owner
chose on 2026-11-28 that each such set be stated once, in a table the code reads, with the documents written from it.

Queue: `maintenance`.

## What Changes

- The release's platforms are read from the repository's mise lock, as the release already reads them; the runtime
  dependencies from the package's `dependencies`.
- The archive's members stand once in `tools/release/archive/members.json`, which the assembly reads for each member's
  place and the mise declaration for the launcher's directory.
- The variables a child process receives stand once in `src/environment.json`, which `src/environment.mjs` reads.
- The operations reference's platforms, members, dependencies and variables, and the README's and the how-to's
  platforms, are written from those sources by `tools/docs/references.mjs`; the operations reference says which
  children receive only the listed variables and that `ssh-keygen`, which `--sign` runs, receives the caller's whole
  environment.
- The generator is split by family of sources into `tools/docs/references/` (the model's, the command line's and the
  operations reference's), `references.mjs` keeping its command, the block markers and the check, so that each module
  stays within the repository's size limit; it writes the same bytes.
- Every command's output and a child's environment are as before; a release archive and the package gain
  `src/environment.json`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: one requirement is added: the release's and the runtime's sets stated once.

## Impact

`README.md`, `docs/how-to.md`, `docs/reference/configuration.md`, `docs/reference/development.md`,
`docs/reference/operations.md`, `src/environment.json`, `src/environment.mjs`, `tests/child-environment.test.mjs`,
`tests/one-source-tokens.test.mjs`, `tests/references-writer.test.mjs`, `tests/release-archive-members.test.mjs`,
`tools/docs/references.mjs`, `tools/docs/references/command-line.mjs`, `tools/docs/references/model.mjs`,
`tools/docs/references/operations.mjs`, `tools/docs/references/text.mjs`, `tools/release/archive/assemble.mjs`,
`tools/release/archive/declaration.mjs` and `tools/release/archive/members.json`.

No command's output and no delivered byte changes. A release archive and the npm package gain one file,
`src/environment.json`, which the command reads; every other path, mode and byte of an archive is as before.
