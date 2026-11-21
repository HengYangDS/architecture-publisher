## Why

On 2026-11-16 the proposal `proposal/read-the-queue-figures-first` was published to GitLab and never landed: three
commits on `21c7ba94` that order the queue to read the figures first and add
`docs/research/reach-of-type-on-figures.md`, which derives type sizes from a viewing distance. The same afternoon
the Change `order-the-queue-by-the-figure-language` gave the queue the order it has, and its decisions withdrew
type sizes from viewing conditions, a mechanism the owner refused four times. The proposal is superseded, and its
ref has hung on the Forge since.

On 2026-11-20 the owner asked that the old proposal refs be closed out (「不能永远悬在哪里，需要做好完整收尾和
housekeeping」), that nothing absorbed or superseded be kept (「如果都已经吸收，或上位覆盖，为何还要保留？」), and
that history waste only ever shrink. ETHOS retires a proposal ref only when `dev` holds it by ancestry.

## What Changes

- `dev` takes the proposal's head as a second parent by a merge that keeps `dev`'s tree: none of the proposal's
  content lands, and its three commits become part of `dev`'s history.
- The proposal's ref is then retired from GitLab through ETHOS, which admits it by that ancestry.

No file of the product changes besides this Change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No behaviour of the product changes.

## Impact

The history of `dev` only, and the GitLab ref `proposal/read-the-queue-figures-first`. No source, no test and no
document.

Queue: `maintenance`.
