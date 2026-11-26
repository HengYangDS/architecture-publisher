## Why

The reference documents state the versions the publisher needs and bundles by hand: Typst 0.15.1 in five places of
three documents and three meanings of the refusal registry, Node.js's floor in three, Archify's version in one. The
queue item `derived-references` asks that a table of a reference document restating the source, the versions of
supplies among them, be written from the source by a command.

Queue: `derived-references`.

## What Changes

- The package states the Typst release it needs beside Node.js's floor, in `package.json`'s `engines`, and
  `src/names.mjs` reads `TYPST_VERSION` from it.
- `tools/docs/references.mjs` writes a table of what the publisher needs (Node.js, Typst, the bundled Archify) in the
  operations reference, each version read from its owner, and fills the Typst release into the registry's meanings
  that name it; the check of generated inputs refuses a table that differs.
- The prose of the operations, how-to, development and configuration documents names no version and points to the
  table or to the owner.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: the versions the publisher needs, stated once and written into the reference.

## Impact

`package.json` and the lock's root entry, `src/names.mjs`, `src/refusal.json`, a comment of
`src/map/guide-figures.mjs`, `tools/docs/references.mjs`, the writer's test, and four documents. No behaviour changes: the publisher refuses any Typst release but 0.15.1, as before.
