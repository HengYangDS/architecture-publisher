## Context

See [proposal.md](proposal.md). The owner's words stand in the maintainer's record of his asks (rows 22, 48 and 49).
The publications repository declares each work as `publications/<work>/<language>/model.json`.

## Goals / Non-Goals

**Goals:**

- The item that will build the gallery says, before it is designed, that the gallery grows with the works.

**Non-Goals:**

- Designing the gallery: where it is published, what a page of it shows and which editions it carries are the
  item's own design when it is reached.
- Moving the item: the owner's word of 2026-11-14 puts a whole product before any showing.

## Decisions

1. Say it in the item's own text.
   - Rests on: the contract is where each open item states what it ends with, and the owner's words of 2026-11-21.
   - Considered: a note in the maintainer's records only; the item's design would not find it.
   - Chosen because: the item's text is what its Change is accepted against.
   - Applies to: the item `gallery` of `docs/product-contract.md`.
2. Name the source the gallery is made from, not a list.
   - Rests on: the publications repository's own layout, one directory a work and a language.
   - Chosen because: a gallery made from that declaration takes a new work as soon as it is published, and one
     made from a list kept beside it would need the list edited each time.
   - Applies to: the same item.

## Risks / Trade-offs

- [The item now says how the gallery is made before its design] → It says only where the works come from; the
  design of the gallery is left to the item.
