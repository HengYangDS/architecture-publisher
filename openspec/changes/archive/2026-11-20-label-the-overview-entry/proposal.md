## Why

The contents set the overview apart from the plates: its entry opens the left half of the first page, the rows
of the plates stand in the right. The entry still begins with the number 00, set as a plate's number is set, in
the size, face and colour the contents and the index keep for plate numbers alone. Read beside the rows it is a
plate numbered 0, while contents of more than one page count the plates without it, and no other page of the
edition prints 00: neither the overview's page nor the index.

The owner asked on 2026-11-20 at 13:05 for the overview to be designed on its own on the left of the contents,
with the plates on the right, ten a side at most.

## What Changes

- The overview's entry on the contents is headed by its name alone, in the tracked capitals that head the scope,
  the limits and the reading note, and its claim stands under it as before. It prints no number.
- The entry still leads to the overview's page, whose label stays `plate-00`.
- The record's entry for the overview no longer carries a number.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: the overview's entry on the contents is its name and its claim, without a number.

## Impact

`src/overview/house.typ`, `src/edition/record.mjs`, `tests/edition-contents.test.mjs`, the research page
`docs/research/contents-and-index.md` and the Changelog. Every edition's contents page changes; no plate, index
or overview page changes.

Queue: `edition-map`.
