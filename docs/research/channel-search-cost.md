---
subject: architecture-publisher:research-channel-search-cost
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# What the channel search costs, and how much of it is repeated

A research page. It records a measurement of the search that routes one channel of a plate: how often it is asked,
how often for an input it has already answered, and what it costs when parts are drawn as cards. It decides
nothing; the decision that rests on it is in the design of the Change `solve-a-channel-once`.

## Question

The proof of the Change that draws a part as one card did not finish its behaviour gate twice on 2026-11-17: the
suite ran 1864 s of the 1800 s the gate has. Is the suite slower with that Change, or was the host busy; and if it
is slower, where does the time go?

## Short answer

It is slower: one heavy test file takes 298 s where `dev` takes 162 s, on a calm host, one process each. The time is
in the exact search of a channel (`src/layout/channel-solver/search.mjs`): a card is wider than a strip, so a
plate's channels hold up to seven wires where `dev` routes five, and the search visits nine times as many nodes.
Seven of eight searches repeat an input searched before, with the same result every time.

## What was measured

All on one host on 2026-11-17, 22:20 to 23:35, at nice 15, one process, `dev` at `60006a90` and the lane at
`7c6504d5`. The probes rewrite `search.mjs` in memory through a loader hook; no source was changed for them.

| Measure                                                              | `dev`   | lane        | How                                                                                                      |
| -------------------------------------------------------------------- | ------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `tests/edition-plates.test.mjs`, 17 tests, wall time                 | 162 s   | 298 s       | `/usr/bin/time`, `--test-concurrency=1`                                                                  |
| One test of it, calls of `solveChannel`                              | 32,222  | 17,240      | a counter in the probe; the test `a summary above its figure is broken within 32 em at 17 points`        |
| The same, calls with a distinct input                                | 3,306   | 2,364       | a key of the channel, the spacing and the three arguments, references back to an enclosing object marked |
| The same, nodes the search visited                                   | 461,352 | 4,290,320   | the search's own count of `walk`                                                                         |
| The same, most wires in one channel                                  | 5       | 7           | the length of `channel.wires`                                                                            |
| The same, share of CPU time in the solver                            |         | 42 of 53 s  | `node --cpu-prof`; `rowsPassed` alone 25 s                                                               |
| Two tests, repeated calls whose fresh result differed from the first |         | 0 of 17,403 | each repeat searched again and compared                                                                  |

The suite's whole run for the lane took 1606 s under one ticket of the host's queue (18:34 to 19:01), and the
behaviour gate of `dev`'s last proof 904 s (10:29). A build of ETHOS in Chinese took 1510 s on the lane and 1001 s on
`dev` the same afternoon, each beside other work.

## Findings

1. The cost is in how many wires one channel holds, not in how many channels are routed: the lane asks the solver
   half as often as `dev` and visits nine times the nodes. In the lane's test, 7,424 calls for channels of seven
   wires visit 3,822,544 nodes, 34,078 for the dearest.
2. Callers above the solver cannot see that two inputs are equal. A plate asks for a layout for each candidate key
   (type step, wrapping, field width, centring, clear turns, details, caption form) and remembers the layout by that
   key; candidates that differ only in what stands inside the cards give the solver the same channel, since it reads
   the cards' places and widths and the wires, and not their text.
3. The solver's input holds one kind of reference cycle: a wire's points name their wire. Nothing else in it refers
   back.
4. A second search of an equal input gave the same result in every one of 17,403 repeats, and no result shared an
   object with its input (checked on the product's remembering solver over 20,693 calls).

## What was compared

| Way                                                      | For                                                             | Against                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Remember the solver's result by its whole input          | exact; the one place that sees equal inputs; no routing changes | memory, so the store needs a bound; a result given to several callers must not be changed by one     |
| A key of the fields the search reads today               | a shorter key                                                   | wrong silently when the search reads one more field                                                  |
| Remember higher up, in `routeChannel` or in the plate    | fewer keys                                                      | those inputs differ where the solver's do not, so they repeat less                                   |
| Raise the gate's timeout                                 | no code                                                         | the suite stays a few minutes from its limit, and every build stays half again as slow               |
| Make the search cheaper for a channel met the first time | lowers the cost that remains                                    | changes the search; not needed to return the suite to `dev`'s time (169 s against 161 s with memory) |

## What follows, and where it applies

With the solver remembering, the same test file takes 169 s. What a channel of seven wires costs the first time is
unchanged, and `rowsPassed` builds a list of rows for every question it is asked, which a later Change may spare.
Applies to `src/layout/channel-solver/`.

## Not established

- The suite's whole time with the remembering solver: it runs in the proof.
- Whether a build of a large work keeps repeats close enough together for a store of 4,096 results; the bound was
  chosen from one test's 2,364 distinct inputs, not from a build.
- Why `tests/delivery.test.mjs` used 3.4 cores on `dev` for one process (its builds start children): it was not run
  on the lane, being heavy work outside a ticket.

## Record

2026-11-17, the holder of the lane. The probes, their outputs and the profile lie in the checkout's ignored
`build/runtime/work/one-part/run/suite-speed/`.
