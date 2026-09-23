# Design

## Context

The Edition Provider implementation and release are governed by the archived
`edition-provider-convergence` Change and its completed `tasks.md`. The separate
Superpowers plan was an execution aid. Its unchecked boxes remain in the current
documentation tree, while no current document or test links to it.

## Goals / Non-Goals

**Goals:** Retire the obsolete current-tree checklist without losing its exact
historical bytes or creating another progress owner.

**Non-Goals:** Change the Edition Provider contract, package, active specs,
release evidence, or any source-product migration.

## Decisions

Delete only `docs/superpowers/plans/2026-09-22-edition-provider-convergence.md`
from the current tree. The signed Git history remains the recovery path for that
historical execution aid. The archived OpenSpec Change remains the durable record
of what was implemented and verified. Do not copy or summarize checkbox state
elsewhere.

Keeping the file with a historical banner would still expose a second checklist.
Moving it into another tracked archive would preserve duplicate content without
adding authority. Neither is preferable to a history-preserving removal.

## Risks / Trade-offs

An external bookmark to the current path will stop resolving at the new HEAD;
Git history can recover the exact file by commit. Before removal, verify the
file is unreferenced in current source and documents. After removal, verify the
diff contains no product inputs and the repository's documentation and full
quality gates still pass. Historical tags and release assets are untouched.
