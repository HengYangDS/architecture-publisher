## Why

The proof of this lane's first Change, `draw-a-part-as-one-card`, did not finish its behaviour gate twice: the
suite ran 1864 s of the 1800 s the gate has. A part drawn as one card is wider than a strip, so a plate's rows hold
more wires in one channel, up to seven where `dev` routes five, and the channel's exact search visits nine times as
many nodes for the same test (4,290,320 against 461,352, measured on
`a summary above its figure is broken within 32 em at 17 points`). One heavy test file takes 298 s where `dev` takes
162 s, and a build of ETHOS in Chinese 1510 s where `dev` takes 1001 s.

Most of that search is repeated. A plate tries its candidates (type steps, wrappings, widths, centrings, caption
forms, details), and candidates that differ only in what stands inside the cards hand the solver the very same
channel: of 17,240 calls in that test, 2,364 have a distinct input, and no repeat gave another result.

## What Changes

- A channel is solved once for one input: the solver remembers its result for a channel, a spacing and its three
  arguments that are equal in everything it reads, and gives it back when asked again. No routing changes: every
  layout, plate and digest is what it was.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

## Impact

`src/layout/channel-solver/` (a module that remembers results, and its use by the search), one test file. No
document and no delivered byte.

Queue: `maintenance`.
