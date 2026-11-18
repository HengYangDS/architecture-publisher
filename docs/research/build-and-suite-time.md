---
subject: architecture-publisher:research-build-and-suite-time
role: research
state: active
relations:
  governed_by: ../product-contract.md
---

# Where the time of a build, of the suite and of a pipeline goes

A research page. It records the first measurement of what a build, the suite and one landing cost, taken on
2026-11-18 after the owner asked whether the product had been optimised, and each change measured against it
since. It decides nothing; the decisions that rest on it are in the designs of the Changes of the queue item
`performance`, the first of them `decide-a-conflict-on-two-rows`.

## Question

The pipeline of one landing held the host's one slot for seventy minutes on 2026-11-18. Where does the time of a
pipeline, of the suite and of a build go, and which of it does the work not need?

## Short answer

The suite is nine tenths of every job, and one Change runs it seven times on this host and its guests. Eight of its
91 files hold three quarters of it. A build of a large work spends three quarters of its time in the channel
solver, and 45 percent in one function that made a list of label rows for every question it was asked; without
the list the same build takes 113 s where it took 397 s, and the twelve published builds together 1055 s where they
took 2879 s, each delivering the same bytes. The suite runs two files at a time on machines of four to fourteen
free cores.

## What was measured

All on one host (18 cores, of which the queue reserves 4) and its three guests, on 2026-11-18, at the commit
`7018b024` unless another is named. Times are wall time; "alone" means one process at nice 15 beside whatever else
the host ran, with the 1-minute load given.

| Measure                                                                                         | Value                                                                                                                                                                                                  | How                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Guest time of this repository's jobs, seven days                                                | 96.4 h in 63 pipelines                                                                                                                                                                                 | the forge's job records, every ref                                                                       |
| Of it, in a pipeline on a commit an earlier pipeline had passed                                 | 45.2 h: `dev` 32.5 h, tags 6.7 h, `main` 6.0 h                                                                                                                                                         | the same records, pipelines grouped by commit                                                            |
| Runs of the whole suite for one Change on this host and its guests                              | 7                                                                                                                                                                                                      | the proof, three jobs of the proposal's pipeline, three of `dev`'s on the same commit                    |
| Jobs of one pipeline (`dev` at `2f2ee7f7`, load 20 to 36)                                       | macOS 742 s, Linux 1460 s, Windows 4072 s                                                                                                                                                              | each job's trace, by its timestamps                                                                      |
| Of each job, the suite                                                                          | 674 s, 1275 s, 3388 s                                                                                                                                                                                  | the same traces, from `npm test`'s echo to the next step                                                 |
| Median job on `dev`, fourteen days, 36 runs each                                                | macOS 18 min, Linux 30 min, Windows 35 min                                                                                                                                                             | the forge's job records                                                                                  |
| The Windows job alone, retried under a ticket of its own on 2026-11-19                          | 2484 s; `npm ci` 73 s where it took 342 s beside other work; the suite 2328 s; its tests summed 4352 s, of which 2682 s in five files that start Archify                                               | the retried job's trace                                                                                  |
| The suite's tests summed, macOS guest                                                           | 1241 s in 596 top-level tests; the ten slowest 593 s                                                                                                                                                   | the reporter's time for each test in the trace                                                           |
| The suite by file, macOS guest                                                                  | eight of 91 files hold 929 s: 246, 238, 116, 97, 94, 73, 36 and 29 s                                                                                                                                   | each test given to the file that holds its name                                                          |
| The least the suite could take at a width, from those times                                     | two files 621 s, three 414 s, four 310 s, six or more 246 s                                                                                                                                            | the larger of the longest file and the sum over the width                                                |
| Cores the suite uses inside a proof on the host                                                 | mean 2.0, most 4.0                                                                                                                                                                                     | the sum of `%cpu` over the gate's process tree, twenty samples five seconds apart                        |
| One proof's gates (23:02 to 23:25)                                                              | suite with coverage 1145 s, `source-format` 174 s, the other eleven 114 s                                                                                                                              | the proof's own records of each gate                                                                     |
| A small build, alone at load 8 (the Responses proxy in English, six plates)                     | 29.2 s: Archify's two runs 18.0 s, the channel solver 5.2 s                                                                                                                                            | a probe of the child processes and `node --cpu-prof`                                                     |
| A large build, alone at load 5 to 11 (ETHOS in Chinese, eleven plates)                          | 397.4 s: the channel solver 297 s, of it `rowsPassed` 180.5 s; garbage collection 35 s; Archify 23.7 s                                                                                                 | the same                                                                                                 |
| The same build with the conflict check rewritten, alone at load 8 to 10                         | 113.1 s; all 18 files of the delivery identical                                                                                                                                                        | the same command from a copy of the source with the one change; `diff -r` of the two deliveries          |
| The heaviest test of `tests/edition-plates.test.mjs`, before the change                         | 33.6 s sampled: `rowsPassed` 12.8 s                                                                                                                                                                    | `node --cpu-prof` on that one test                                                                       |
| `tests/delivery.test.mjs`, one process, with the change                                         | 127.5 s; 2116 runs of `archify validate architecture` cover 105.4 s of it; the process's own JavaScript 12 s                                                                                           | the probe of its child processes and `node --cpu-prof`, at load 9                                        |
| One run of `archify validate architecture` on a document of two parts                           | 171 ms with `--json`, 102 ms with `--layout-json`; 29 ms when it answers before its renderer starts; Node.js alone 23 ms                                                                               | twenty runs each, one after the other, at load 10 to 18                                                  |
| The twelve published models built before and after, each pair compared                          | all twelve pairs identical file by file; summed 2879 s before and 1055 s after; from 618 s to 154 s (ETHOS in English) at the most and from 38 s to 32 s (the Responses proxy in English) at the least | the same two sources, one frozen copy of the models, each pair one build after the other at load 5 to 25 |
| `tests/edition-plates.test.mjs`, one process, before and after                                  | 149.1 s at load 9 and 266.8 s at load 24 before; 103.7 s at load 17 after (user CPU 195 s and 98 s for the last two)                                                                                   | `/usr/bin/time`, `--test-concurrency=1`, each source from its own directory                              |
| The suite in a proof, before and after                                                          | 1145 s before; after waits for the Change's proof                                                                                                                                                      | the proof's record of its behaviour gate                                                                 |
| The whole suite without coverage, the host's slot to itself, before and after the three changes | 530 s before (CPU 2514 s, 5942 runs of Archify started by its files); 481 s after (CPU 2096 s, 4237 runs, 4044 answers kept)                                                                           | `npm test`'s command from a copy of each source, one run each, 2026-11-19 04:18 to 04:35                 |
| The same suite with the three changes, four files at a time                                     | 291 s (CPU 1915 s, 4396 runs)                                                                                                                                                                          | the same command with `--test-concurrency=4`, one run, 04:35 to 04:40                                    |

## Findings

1. What a landing costs is the suite, run again and again. Nothing else in a job takes a tenth of it, except on
   the Windows guest beside other work, where `npm ci` took 342 s; alone it took 73 s.
2. The suite's time is in few places. Six files that build whole deliveries or choose a page's diagram with Archify
   (`delivery`, `map-choice`, `map-browser`, `delivery-data`, `cli-commands`, `delivery-compare`) hold 654 s of the
   macOS guest's 1241 s, and `edition-plates`, which composes plates, 246 s. In the first of them the time is
   Archify's processes: the choice of a view's diagram for a generated page starts about 240 runs of Archify's
   command line in these fixtures, a verdict for each candidate document and a layout for each that passes, and each
   run starts the renderer in a process of its own. A test file is a process, so each file measures the same
   fixtures' candidates again. The published works have guides and choose no diagram, so their builds do not show
   this.
3. In the channel solver, the cost was a constant and not the search: `rowsPassed` built a list of at most three
   rows and was asked hundreds of millions of times. The research page on the search's cost named it on
   2026-11-17; the Change that followed made the solver remember results and left the first search as it was.
4. The suite's width was set to two files on 2026-09-18 with no reason recorded, when the suite was small. A heavy
   page test starts up to four Archify processes itself, so a width cannot be read off the count of cores. On the
   host, with fourteen cores for a ticket, four files at a time take 291 s where two take 481 s; the guests have
   eight, eight and four CPUs and were not measured.
5. A build with a guide has Archify validate the page twice: the publisher asks for a validation and then for the
   finished page, whose first gate is the same validation. On the Responses proxy's English work the separate
   validation took 17 s of a build of 40 s, and without it the build delivered the same 13 files (two rounds on
   2026-11-19, one after the other at load 8 to 10). With the page prepared with its delivery, so that a refusal
   still names every finding, the proxy's English work and Film Kit's Chinese one were built in three rounds
   each: five of the six pairs are shorter by 5 to 9 s of 24 to 34 s, in user CPU by 3 to 5 s, and every delivery
   is identical in 13 files. The suite's fixtures are small and gain little from it: a
   build and a check of the smallest model take under three seconds with both runs.
6. A time measured beside a pipeline's guests is not a time: the same test file took 149 s at load 9 and 267 s at
   load 24, with the same source.

## What was compared

| Way                                                              | For                                                      | Against                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Ask whether a vertical passes one row, and look only at two rows | exact; no store; the definition read the other way round | the old form stated the rule row by row and was easier to read against the drawing |
| Remember `rowsPassed`'s lists                                    | the rule stays as written                                | a store in the innermost loop; the lists are still made once for each key          |
| Raise the suite's width without measuring                        | no code                                                  | page tests start their own processes; a guest of four cores would be overrun       |
| A bound in seconds on a build or on the suite                    | says what is wanted                                      | finding 6: it fails for the host's reasons, and is then loosened                   |
| A test that counts the check's work                              | the same on every machine                                | tied to one property of how the check is written                                   |

## What follows, and where it applies

The conflict check decides from the two rows two choices stand on (`src/layout/channel-solver/conflicts.mjs`). The
next causes, in the order the measurements give them: the processes Archify is started in for a page's candidate
diagrams, which the suite pays in every file; the page's second validation; the suite's width; what is left in the
solver (`tracksFor`'s keys, `routeDefects`, `coincident`); `npm ci` on the Windows guest. The pipelines that
repeat on one commit are the fleet's paradigm and not this repository's to change: the numbers went to ETHOS's
owner session on 2026-11-18.

## Not established

- The suite's time with the changes inside a proof, with coverage, and on the guests: the Change's proof and
  pipelines give them.
- What the suite takes on the guests at any width other than two, and on the host at any other than two and four.
- How many of the suite's candidate documents are the same from one test file to the next: one file was measured.
- Why the Windows guest loses more than the other two beside other work (its tests summed 6257 s there and 4352 s
  alone), and how much of what is left alone is the starting of processes: nothing was read inside the guest.
- Whether coverage costs the suite a noticeable share: the gate runs it under `c8` and was not run without.
- Every time here is one run. The large builds' changes are far beyond what the load explains; the smallest pair's
  six seconds of 38 are not.

## Record

2026-11-18 and 2026-11-19, the holder of the lane. The traces, profiles, scripts and the ledger of attempts lie in
the checkout's ignored `build/runtime/work/perf-20261118/`.
