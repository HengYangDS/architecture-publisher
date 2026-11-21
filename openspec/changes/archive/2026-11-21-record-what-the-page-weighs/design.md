## Context

See [proposal.md](proposal.md) and the research page `docs/research/page-weight.md`, which this Change adds.

## Goals / Non-Goals

**Goals:**

- The item that builds the page knows, before it is designed, what its pages carry and what of that is waste.

**Non-Goals:**

- Changing the bundled Archify: its format is verified entry by entry, and the publisher does not change another
  product's source; the remedy is asked of Archify.
- Measuring how long a page takes to load: the research page says so.

## Decisions

1. Record the measurement as research, and the outcome in the item.
   - Rests on: `docs/research/page-weight.md`.
   - Considered: an issue upstream alone; the next Change of `page` would not find it in the repository.
   - Chosen because: the item states what it ends with, and the research page keeps how the weight was read.
   - Applies to: the item `page` and the research index.
2. Leave the diagrams' Explore views as they are.
   - Rests on: `explainer/page-bundle.mjs` of Archify: each view is inflated when a reader opens it.
   - Chosen because: they are the feature a reader opens, not a copy of the page.
   - Applies to: the item's wording, which names only the repeated files.

## Risks / Trade-offs

- [Archify does not take the proposal] → The item still says what a page carries; its Change measures again and
  decides then.
