## Why

On 2026-11-21 the owner asked for the opportunities to improve the product for its developers, its readers and the
agents that use it, and that what was found be carried through to landing. For a reader the largest was the page in
a browser: 4 to 12 MB for each published work, of which a cited file repeated once per citation takes 21% to 52%.
The repeats come from Archify's format, so the remedy is Archify's; its issue 1426 asks for it. The contract's item
`page` says nothing of what a page carries or weighs.

## What Changes

- `docs/research/page-weight.md` records what makes up the twelve pages 0.16.0 built and how it was measured.
- The item `page` says that a page carries what its reader uses and each cited file once, and that its weight is
  measured on the published works.

The queue's order is unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No behaviour of the product changes.

## Impact

`docs/research/page-weight.md` (new), `docs/research/README.md`, `docs/product-contract.md` and `CHANGELOG.md`. No
source and no test.

Queue: `maintenance`.
