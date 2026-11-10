## Why

21 of the 82 plates of the six published works leave their view's summary out. Each has a summary, but its figure
cannot give up a fifth of the body's width without wiring worse: 19 of them already cross or bend wires at the full
width, and narrowing only adds defects. A reader of those plates gets the figure without the sentences that say what it
shows.

Measured on 10 November against publications `b774089`, 17 of the 21 figures wire no worse when they keep the full
width and give up the top of the body instead, by the height of their summary set in the house's 32 em measure.

## What Changes

- A view with a summary whose figure cannot narrow without wiring worse sets its summary above the figure, as a
  standfirst: at 17 points in Source Serif 4, as beside a figure, within 32 em, on the lines the publisher breaks,
  flush left, under the plate's question. The figure keeps the full width and takes the body's height less the
  standfirst's.
- The standfirst is set only when the figure wires no worse at that height than at the full body; otherwise the
  plate leaves its reading out, as today.
- A standfirst carries the summary alone, without the heading for where each part lives or the paths.
- `archpub check` and the manifest report such a plate's reading as set above its figure.
- The release is 0.11.0.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `edition-delivery`: a plate whose figure cannot narrow sets its summary above the figure when the figure wires no
  worse there; `check` reports it.

## Impact

`src/poster/compose/plates.mjs`, `src/poster/text.mjs` (the engine also measures Source Serif 4), `src/edition/record.mjs`,
`src/overview/house.typ`, `src/cli/run.mjs`, their tests, `docs/reference/operations.md`, `CHANGELOG.md` and the
version. Plates that set their summary beside the figure, and plates without a summary, are typeset as in 0.10.2.
