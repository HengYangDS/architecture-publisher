## Why

Every print edition looks the same today: icon cards with a coloured bar on a
warm paper, in one green. An author cannot choose how a work looks, and the
cards say nothing the model does not already say in words. The files each part
owns, how much code they hold and how recently they changed are already read at
the pinned commit, yet no plate shows them.

## What Changes

- A model may name its edition's house style and palette in a new optional
  `edition` object. Two house styles: `bolts`, where each part is a strip woven
  from the files it owns, and `cards`, the current cards.
- Four built-in palettes: `indigo`, `persimmon`, `ink` and `forest`, the current
  house colours. A model may also give its own palette as a ground, an ink,
  three dye steps and an optional accent; the publisher refuses one that fails
  the contrast, chroma and lightness rules, naming the colour and its measure.
- In the `bolts` style, a strip's segments are the part's files, as wide as
  their share of its bytes and as dark as their last change is old; its
  thickness grows with the part's code; a relation's line is as heavy as the
  number of files that evidence it, and the relations into the part most others
  call are drawn in the darkest dye. The plate's key explains each of these it
  shows.
- The defaults become `bolts` and `indigo`. A build whose model claims no files,
  or that reads no checkout, cannot weave strips: it sets `cards` unless the
  model asks for `bolts`, which it refuses.
- **BREAKING**: the manifest moves to version 7. It records each cited file's
  size and the date of its last change at the pin, and the edition's style and
  resolved palette. Every plate of the default style changes.
- The overview's house class takes its colours from the chosen palette; the
  names a composition uses keep working.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: the optional `edition` object and the rules a custom
  palette must meet.
- `poster-composition`: the `bolts` drawing, age bands and line weights; plates
  in either style keep every layout gate.
- `edition-delivery`: manifest version 7 and the key of a `bolts` plate.
- `overview-page`: the house class reads the chosen palette.

## Impact

`src/model/` (the `edition` object), `src/house.json` and a new palette module,
`src/poster/` (drawing, metrics and keys), `src/sources/` (file sizes and change
dates), `src/edition/` and `src/overview/house.typ` (palette and key marks),
the manifest, the reference documentation, the Skill and the tests. Pages
(HTML) are unchanged. Out of scope: other compositions (loom, hanging cloths,
ledger), the acceptance mark and acceptance record version 2, which follow in
their own Changes.
