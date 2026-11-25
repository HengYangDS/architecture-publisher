## Why

The queue item `reader-file`, its second Change. The reader file writes a guide as prose since
`read-the-reader-file-as-a-document`, but a figure is a line that names its title and file: the text around it
points at a picture the reader of the file does not have. A second reader of the sample found this the largest gap
(`docs/research/reader-file.md`), and the committee gave a figure's content a Change of its own, after the first.

## What Changes

- A guide's figure is written as text under its line, from its document: the parts of an architecture with the
  lines between them, a workflow's steps, a life's states, a sequence's messages by phase, entities and types with
  their fields, a tree nested, a timeline's events and a waterfall's spans as tables. What only shapes the drawing
  (places, sizes, a line's variant, an icon) is left out.
- Steps of the guide that walk a figure, each naming one of its items, stand with those items once, in the steps'
  order; a step's own name for an item that differs from the drawn one stays as an aside.
- A citation of a figure's item is a footnote, as the guide's own are.
- A figure that the draft names without a title takes the title its own file states.
- The contract's queue marks `reader-file` finished: the twelve published guides pass the check of the rendered
  form with their figures as text.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `reader-file`: a guide's figures as text.

## Impact

Changed: `src/map/guide-text.mjs`, `src/map/guide.mjs`, `src/projection.mjs`, `src/locale.mjs`,
`tests/pinned-reader-form.test.mjs`, `docs/product-contract.md`; new
`src/map/figure-text.mjs` and `tests/pinned-reader-figures.test.mjs`; `docs/reference/data.md`,
`docs/research/reader-file.md` and `CHANGELOG.md`. Every delivery whose model names a guide changes its reader file.
The delivery format stays 9: no file is parsed back.

Queue: `reader-file`.
