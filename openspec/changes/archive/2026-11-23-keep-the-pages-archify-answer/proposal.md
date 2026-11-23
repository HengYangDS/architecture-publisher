## Why

The suite's profile of 2026-11-23 (140 s, every test passing) shows Archify as its largest cause by tool: 175 runs,
63 s. The candidates' answers are kept since that morning; the explainer page's delivery, the costliest of the rest
(about 1.5 s a run), is asked again in every build.

## What Changes

- Where Archify's answers are kept, a generated page delivered without a checkout is kept too, by everything it
  depends on: its draft and diagrams, quality, writing, file name and the vendored Archify.
- One function keeps both kinds of answer; the candidates' key is unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None: a kept page is the page Archify delivers.

## Impact

Changed: `src/map/archify.mjs`, `src/map/explainer.mjs`, `tests/archify-answers.test.mjs`, the record
`docs/research/build-and-suite-time.md` and `CHANGELOG.md`.

Queue: `performance`.
