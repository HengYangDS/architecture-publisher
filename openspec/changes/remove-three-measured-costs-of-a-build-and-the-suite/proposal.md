## Why

The owner asked on 2026-11-18 that performance be optimised to the limit, after the pipeline of one landing held
the host's one slot for seventy minutes. Measured that night and the next, three costs stand out, each paid for
work already done:

- A build of the largest published work takes 397 s on one core, and 180 s of it is one function: `rowsPassed` in
  the channel solver makes a list of a channel's label rows for every question the exact search asks, hundreds of
  millions of times a build.
- A build has Archify validate its page and then deliver it, and the delivery's first gate is the same
  validation: 17 s of a 40 s build of a small work with a guide.
- The suite's heaviest file starts 2116 Archify processes, which cover 105 s of its 127 s: the choice of a view's
  diagram measures its candidates in processes, and every test file, a process of its own, measures the same
  fixtures' candidates again. On the Windows guest the suite's job takes 41 minutes with the host to itself, and
  every pipeline holds the host's slot that long.

Nothing held the time of a build or of the suite. The queue had no item for it, so a cost found on 2026-11-17 and
written into a research page stayed where it was.

## What Changes

- The channel solver's check of one choice against the wires already chosen looks at the two label rows the two
  choices stand on, and makes no list. No routing changes: every layout, plate and digest is what it was.
- A build prepares its page with its delivery: Archify validates, writes and checks the page in one run, and the
  build writes what that run produced. A page Archify refuses is validated on its own, so the refusal names every
  finding as before; a page that validates and whose delivery Archify refuses is refused then, before the edition
  is typeset, where it was refused after. A check delivers nothing and validates as before. No delivered byte
  changes.
- Where the environment variable `ARCHPUB_ARCHIFY_ANSWERS` names a directory, each whole answer of Archify to a
  candidate diagram is kept there by the Archify supply's digest, the Node.js and platform, the quality and the
  document, and read from there before Archify is asked; a refusal or a failed run is never kept. Without the
  variable nothing is kept outside the process. The suite names one directory for a run.
- The queue gains the item `performance`, first among the open ones: a build, the suite and a pipeline take the time
  their work needs. It moves every open item back by one.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interactive-map`: a requirement is added for answers kept between processes in a directory the caller names.

## Impact

`src/layout/channel-solver/conflicts.mjs`; `src/map/explainer.mjs`, `src/map/guide.mjs` and `src/build.mjs`;
`src/map/archify.mjs` and `src/map/choice.mjs`; three new test files and three fixtures, the suite's environment
fixture, and the tests of guides and of the installed package; `docs/product-contract.md` (the queue),
`docs/reference/command-line.md`, `docs/reference/operations.md` and `docs/reference/development.md` (the variable
and its refusal), the research
page `docs/research/build-and-suite-time.md` and `CHANGELOG.md`. No delivered byte.

Queue: `performance`.
