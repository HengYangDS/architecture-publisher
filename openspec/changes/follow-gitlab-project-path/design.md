## Context

See proposal.md for why. `tools/supply/resvg.mjs` derives the closure's
location in the supply manifest and the third-party notices from
`source.registry.projectPath`, and
`tools/raster/resvg/verify.mjs --registry-url` builds the download URL from
the same field.

## Goals / Non-Goals

**Goals:**

- Every current reference names the project where it is.

**Non-Goals:**

- Rebuilding, re-publishing or re-witnessing the closure.
- Rewriting research records dated before the move.

## Decisions

- **Keep naming the registry by path.** The numeric project id would survive a
  move, but `projectPath` is part of the source record's schema and the notices
  show it to readers. Moves are rare; following one is this small Change.
- **Derive every copy of the location from the source record.**
  `tools/supply/resvg.mjs --write` rewrites the notices and, from this Change
  on, the resvg package's archive and integrity in the manifest; its `--check`
  fails when either copy differs from the source record.

## Risks / Trade-offs

- [Until this Change lands, CI downloads the closure through the old path] →
  GitLab's API resolved the old path to the moved project on 2026-11-03, so
  pipelines in between keep working; that redirect ends when another project
  takes the old path, which this Change makes irrelevant.
