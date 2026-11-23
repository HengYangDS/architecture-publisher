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

| Measure                                                                                                  | Value                                                                                                                                                                                                                                                                                                                                                       | How                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guest time of this repository's jobs, seven days                                                         | 96.4 h in 63 pipelines                                                                                                                                                                                                                                                                                                                                      | the forge's job records, every ref                                                                                                                                                      |
| Of it, in a pipeline on a commit an earlier pipeline had passed                                          | 45.2 h: `dev` 32.5 h, tags 6.7 h, `main` 6.0 h                                                                                                                                                                                                                                                                                                              | the same records, pipelines grouped by commit                                                                                                                                           |
| Runs of the whole suite for one Change on this host and its guests                                       | 7                                                                                                                                                                                                                                                                                                                                                           | the proof, three jobs of the proposal's pipeline, three of `dev`'s on the same commit                                                                                                   |
| Jobs of one pipeline (`dev` at `2f2ee7f7`, load 20 to 36)                                                | macOS 742 s, Linux 1460 s, Windows 4072 s                                                                                                                                                                                                                                                                                                                   | each job's trace, by its timestamps                                                                                                                                                     |
| Of each job, the suite                                                                                   | 674 s, 1275 s, 3388 s                                                                                                                                                                                                                                                                                                                                       | the same traces, from `npm test`'s echo to the next step                                                                                                                                |
| Median job on `dev`, fourteen days, 36 runs each                                                         | macOS 18 min, Linux 30 min, Windows 35 min                                                                                                                                                                                                                                                                                                                  | the forge's job records                                                                                                                                                                 |
| The Windows job alone, retried under a ticket of its own on 2026-11-19                                   | 2484 s; `npm ci` 73 s where it took 342 s beside other work; the suite 2328 s; its tests summed 4352 s, of which 2682 s in five files that start Archify                                                                                                                                                                                                    | the retried job's trace                                                                                                                                                                 |
| The suite's tests summed, macOS guest                                                                    | 1241 s in 596 top-level tests; the ten slowest 593 s                                                                                                                                                                                                                                                                                                        | the reporter's time for each test in the trace                                                                                                                                          |
| The suite by file, macOS guest                                                                           | eight of 91 files hold 929 s: 246, 238, 116, 97, 94, 73, 36 and 29 s                                                                                                                                                                                                                                                                                        | each test given to the file that holds its name                                                                                                                                         |
| The least the suite could take at a width, from those times                                              | two files 621 s, three 414 s, four 310 s, six or more 246 s                                                                                                                                                                                                                                                                                                 | the larger of the longest file and the sum over the width                                                                                                                               |
| Cores the suite uses inside a proof on the host                                                          | mean 2.0, most 4.0                                                                                                                                                                                                                                                                                                                                          | the sum of `%cpu` over the gate's process tree, twenty samples five seconds apart                                                                                                       |
| One proof's gates (23:02 to 23:25)                                                                       | suite with coverage 1145 s, `source-format` 174 s, the other eleven 114 s                                                                                                                                                                                                                                                                                   | the proof's own records of each gate                                                                                                                                                    |
| A small build, alone at load 8 (the Responses proxy in English, six plates)                              | 29.2 s: Archify's two runs 18.0 s, the channel solver 5.2 s                                                                                                                                                                                                                                                                                                 | a probe of the child processes and `node --cpu-prof`                                                                                                                                    |
| A large build, alone at load 5 to 11 (ETHOS in Chinese, eleven plates)                                   | 397.4 s: the channel solver 297 s, of it `rowsPassed` 180.5 s; garbage collection 35 s; Archify 23.7 s                                                                                                                                                                                                                                                      | the same                                                                                                                                                                                |
| The same build with the conflict check rewritten, alone at load 8 to 10                                  | 113.1 s; all 18 files of the delivery identical                                                                                                                                                                                                                                                                                                             | the same command from a copy of the source with the one change; `diff -r` of the two deliveries                                                                                         |
| The heaviest test of `tests/edition-plates.test.mjs`, before the change                                  | 33.6 s sampled: `rowsPassed` 12.8 s                                                                                                                                                                                                                                                                                                                         | `node --cpu-prof` on that one test                                                                                                                                                      |
| `tests/delivery.test.mjs`, one process, with the change                                                  | 127.5 s; 2116 runs of `archify validate architecture` cover 105.4 s of it; the process's own JavaScript 12 s                                                                                                                                                                                                                                                | the probe of its child processes and `node --cpu-prof`, at load 9                                                                                                                       |
| One run of `archify validate architecture` on a document of two parts                                    | 171 ms with `--json`, 102 ms with `--layout-json`; 29 ms when it answers before its renderer starts; Node.js alone 23 ms                                                                                                                                                                                                                                    | twenty runs each, one after the other, at load 10 to 18                                                                                                                                 |
| The twelve published models built before and after, each pair compared                                   | all twelve pairs identical file by file; summed 2879 s before and 1055 s after; from 618 s to 154 s (ETHOS in English) at the most and from 38 s to 32 s (the Responses proxy in English) at the least                                                                                                                                                      | the same two sources, one frozen copy of the models, each pair one build after the other at load 5 to 25                                                                                |
| `tests/edition-plates.test.mjs`, one process, before and after                                           | 149.1 s at load 9 and 266.8 s at load 24 before; 103.7 s at load 17 after (user CPU 195 s and 98 s for the last two)                                                                                                                                                                                                                                        | `/usr/bin/time`, `--test-concurrency=1`, each source from its own directory                                                                                                             |
| The suite in a proof, before and after                                                                   | 1145 s before; 901 s after, one reading each a night apart, and three gates the Change does not touch fell by a quarter between the two                                                                                                                                                                                                                     | the proof's record of its behaviour gate                                                                                                                                                |
| The whole suite without coverage, the host's slot to itself, before and after the three changes          | 530 s before (CPU 2514 s, 5942 runs of Archify started by its files); 481 s after (CPU 2096 s, 4237 runs, 4044 answers kept)                                                                                                                                                                                                                                | `npm test`'s command from a copy of each source, one run each, 2026-11-19 04:18 to 04:35                                                                                                |
| The same suite with the three changes, four files at a time                                              | 291 s (CPU 1915 s, 4396 runs)                                                                                                                                                                                                                                                                                                                               | the same command with `--test-concurrency=4`, one run, 04:35 to 04:40                                                                                                                   |
| One channel of five labelled wires solved on three label rows, before the search's two changes           | 100,047 serializations, where one row takes 165; 878,781 reads of a wire's label for 75 choices                                                                                                                                                                                                                                                             | counted in a test's own process                                                                                                                                                         |
| A large build's own profile by module, before and after each of the two changes                          | the search module 12.1 → 4.9 s and 7.0 → 3.3 s with a band's content named once; the conflict module 11.7 → 1.5 s and 7.8 → 0.9 s with a pair asked once (ETHOS in Chinese, DDWG in English)                                                                                                                                                                | `node --cpu-prof` on each build of a pair, one after the other                                                                                                                          |
| The twelve published models built before and after the search's two changes together                     | all twelve pairs identical file by file; summed 472 s before and 381 s after; from 86 s to 59 s (ETHOS in Chinese) at the most                                                                                                                                                                                                                              | the same two sources, one frozen copy of the models, each pair one build after the other at load 12 to 19 on 2026-11-19                                                                 |
| Six spans of a band laid on tracks, and a layout of forty wires measured, before the two further changes | 55,800 reads of a span's ends, where the six spans are read 12 times after; 262,040 reads of a coordinate for 160 points, 640 after                                                                                                                                                                                                                         | counted in a test's own process                                                                                                                                                         |
| A large build's own profile by module, before and after each of the two further changes                  | the track module with its list of orders 33.6 → 4.6 s, 24.5 → 4.2 s and 19.3 → 3.4 s (ETHOS in Chinese), 8.7 → 1.1 s and 4.7 → 0.9 s (DDWG in English), with what two spans are to one another worked out once; the measure module 17.7 → 11.4 s and 18.9 → 11.0 s (ETHOS), 9.9 → 8.7 s and 15.3 → 8.5 s (DDWG), with a segment's own facts worked out once | `node --cpu-prof` on each build of a pair, one after the other, at load 6 to 30; only a module's own seconds are read, since the walls of the pairs contradict one another at that load |
| The measure of a layout before and after its change, on seeded geometries                                | 6,000 geometries that make all thirteen kinds of finding are measured alike, whole results in order                                                                                                                                                                                                                                                         | the two sources' modules side by side in one process, outside the suite                                                                                                                 |
| The twelve published models built before and after the four changes together                             | all twelve pairs identical file by file; summed 970 s before and 619 s after; one pair took longer after than before (the publisher in English, 47 s and 60 s)                                                                                                                                                                                              | the same two sources, one frozen copy of the models, each pair one build after the other at load 15 to 25, so the sums are a busy host's                                                |
| What a large build holds after the four changes (ETHOS in Chinese, 63 s at load 9)                       | the search's measuring of each assignment it completes 14.7 s, of it the measure 10.6 s; Archify's one run on the page 11.4 s; Typst 5 s                                                                                                                                                                                                                    | `node --cpu-prof` and the probe of the child processes                                                                                                                                  |
| The jobs of the two pipelines of the Change before this one (`37b23769`, 2026-11-19)                     | proposal: macOS 558 s, Linux 1197 s, Windows about 3340 s; `dev`: macOS 571 s, Linux 1149 s, Windows 3274 s                                                                                                                                                                                                                                                 | the forge's job records; the Windows job of the proposal by its start and end                                                                                                           |

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
4. The suite's width was set to two files on 2026-09-18 with no reason recorded, when the suite was small; from
   2026-11-23 it follows the machine's cores (the section above). A heavy
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
7. A gain under a tenth of a build does not show in the wall time of one pair on this host: of two pairs that
   measured the band's names, one showed twelve seconds and one two, while each build's own profile showed the same
   seven seconds leave the search module. A change of that size is read in the profile's division, and in the sum
   over the twelve works.
8. A count of work does not say how much time a change saves. Laying six spans on tracks read their ends 55,800
   times and now reads them 12 times, and the module's time fell sevenfold. Measuring forty wires read a coordinate
   262,040 times and now reads one 640 times, and the module's time fell by two fifths: the search measures every
   assignment it completes and has not already beaten, each measure still walks its pairs of segments, and what
   the change removed was only what a pair worked out twice. The counts keep a cost from returning; the profile
   says what it was.

### The pipelines of seven days (2026-11-22)

Read from GitLab on 2026-11-22: in the seven days before, 66 pipelines ran on this host's guests, 40.9 hours in
all, a median of 31.3 minutes and at most 71.4, each holding the host's one slot while it ran. Proposal branches
took 21.8 hours, `dev` 16.6, `main` 1.3 and tags 1.2. A commit's second and later pipelines took 19.1 hours (47 %):
a landed commit ran on its proposal branch and again on `dev`, a release commit four times. 31 of these repeats
followed a passing proposal pipeline in the seven days, and none failed. In the thirty days GitLab keeps (185
pipelines), two did, both on 2026-10-31 and both on the protected Windows runner: on `dev` a linker could not
open a file in that runner's build directory, and on `main` a job reached its hour's limit. Neither was a fault
the proposal's pipeline had missed.

On 2026-11-22 the owner approved a trial of two weeks on this repository: GitLab runs no pipeline for a tag or a
push of `dev`, and a release first runs one protected pipeline of `dev`, before `main` moves. By the seven days
it saves about 16.8 hours a week, 16.6 of `dev` and 1.2 of tags less about one for two releases' runs, 41 % of the
pipelines' time. It is measured again on 2026-12-06 by the same count, the failures and the slot's hours, before
it is kept, reverted or offered to the other repositories ETHOS governs.

On 2026-11-23 the owner widened the trial to GitHub: it runs no workflow for a push of `dev` either. A landing had
waited for GitHub's second run of a commit its proposal had passed: the width Change's commit ran 38 minutes on
its proposal branch and 38 again on `dev`, and `dev` was green 39 minutes after its push. Tags still run. GitHub's
half is measured with GitLab's on 2026-12-06.

### Archify's answers in CI (2026-11-23)

Every hosted GitHub job is a fresh machine and the Linux guest a fresh container, so the answers kept on a machine
never reached them. In run 45125291928 `npm run check` took 26.1 min on Windows ARM64, 19.6 on Windows x64, 15.3 on
macOS and 14 on Linux; every other step under 3 min. The Windows and macOS guests, which keep their temporary
directory, already gained (pipeline 17410: 14.8 and 7.2 min, against 26.3 and 12.9 that morning). From this
Change the answers stand in the tool cache on every Forge, and GitHub restores them from its cache.

### The Linux job's download of Chromium (2026-11-22)

Read from the logs of the Linux jobs of the same 66 pipelines: each of the 65 jobs whose log shows the step
downloaded Chromium, 198 MiB, in a median of 51 s, at most 629 s and 1.6 hours in all. On 2026-11-22 one took
1797 s with a request timed out, and its job 47 minutes where the macOS job took 9. The job kept its browsers in
the image's own path, and the image was built from Playwright 1.64.1 while the lockfile has held 1.65 since
2026-11-10: each job removed the image's browsers and fetched the lockfile's into a container that ends with the
job. The other two platforms keep Chromium in the tool cache that a job's clean spares, where the Linux job
already keeps its tools. From this Change the Linux job keeps Chromium there too.

### The proofs of seven days (2026-11-22)

Read from the repository's own proof records (`.git/ethos/artifacts`) on 2026-11-22 at 12:5x: in the seven days
before, 41 proofs ran the heavy gates, 13.0 hours from each proof's first gate to its last in all. The behaviour
gate (`node-behavior`, the suite) took a median of 927 seconds and at most 1881, and did not pass five times; the
format gate (`source-format`) a median of 145 seconds and at most 218; every other gate under a minute. In the
latest proof (`9c6a0772`, 11:00) the suite took 533 seconds and the format gate 150 of its 708. By the count of the
session that measures the host, these were about half the proof time of the thirteen repositories with records.

### The suite's width (2026-11-23)

Measured on the host under one ticket, 01:34 to 01:41, on a copy of `dev` at `fae12ca6`, the whole suite without
coverage, 657 tests, all passing: two files at a time 250 s, CPU 1492 s (5.96 cores on average), 3.2 GiB resident
at most; four at a time 156 s, CPU 1590 s (10.21 cores), 5.5 GiB. A file that builds a delivery keeps two to three
cores busy. The guests have four cores (Linux) and eight (Windows, macOS), read from their virtual machines'
settings the same night; at two files the Linux guest's suite already wants more cores than it has.

ETHOS's behaviour gate ran the suite through the launcher of this Change on a copy of `dev`, under one ticket at
04:03 (`ethos prove --host --execute --gate node-behavior --gate node-static`): `node tools/test/suite.mjs`, four
files at a time, 658 tests passing and 99.63 % of lines covered, no gap of its own, in 369 s, where the same gate
of the proof of `fae12ca6` had taken 458 s at two files. The copy's other gaps were its own: it holds no record of
the vendored supply's sources.

From this Change the suite runs as many files at once as the machine's cores over 2.5, two at least and four at
most: four on the host, three on the Windows and macOS guests, two on the Linux guest. Four is the widest measured;
a wider bound waits for a measurement under a ticket. Under the host's queue the cores are the share ETHOS gives the
run it admits (`ETHOS_HOST_CPU_CAP`): 14 with one slot, 7 with two (from 2026-11-23 10:45, the owner's measurement
of two slots), where the suite runs two files.

### Archify's answers kept between runs (2026-11-23)

Measured under one ticket, 11:08 to 11:14, the host's two slots shared with another ticket, on a copy of `dev`
with the answers kept between runs, the whole suite without coverage at two files: the first run, no answer kept,
240 s, CPU 1249 s, Archify started 4332 times (792 s of its processes); the second, with the first run's 4044
answers, 130 s, CPU 346 s, 138 times (20 s). Both runs passed all 660 tests. The second run's 138 are the
candidates whose answer is no whole verdict or layout, which are never kept. By the timing of the five longest
test files the same morning, Archify's processes were most of what those files spent their time on (one file
started it 2116 times, 333 s). A run on a new machine or after a week pays the first run's cost once.

### The suite's profile and the page's answer (2026-11-23)

Profiled under one ticket at 17:09, the host's share seven cores, on a detached worktree of `dev`: the whole suite
at two files, 140 s, every test passing. Archify ran 175 times for 63 s and Typst 658 times for 33 s; no test took
more than 4.6 % of the tests' summed time. Two of the longest test files, run alone with the same recorder: the
explainer page's delivery took 12.4 s in 8 runs, the candidates that are never kept 4.7 s in 24, the page's
validation 2.7 s in 4. From this Change a generated page's delivery is kept as the candidates' answers are.

### The two media of a build (2026-11-23)

The build's children, recorded under one ticket for ETHOS's Chinese edition (51.8 s): the page's Archify run 36.9
to 46.5 s, then the edition's Typst runs 46.6 to 50.9 s, one after the other. The page needs the planned views, not
the edition, so from this Change a build starts its page where it prepares it and awaits it to write it.

## What was compared

| Way                                                              | For                                                      | Against                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Ask whether a vertical passes one row, and look only at two rows | exact; no store; the definition read the other way round | the old form stated the rule row by row and was easier to read against the drawing |
| Remember `rowsPassed`'s lists                                    | the rule stays as written                                | a store in the innermost loop; the lists are still made once for each key          |
| Raise the suite's width without measuring                        | no code                                                  | page tests start their own processes; a guest of four cores would be overrun       |
| A bound in seconds on a build or on the suite                    | says what is wanted                                      | finding 6: it fails for the host's reasons, and is then loosened                   |
| A test that counts the check's work                              | the same on every machine                                | tied to one property of how the check is written                                   |

## What follows, and where it applies

The conflict check decides from the two rows two choices stand on (`src/layout/channel-solver/conflicts.mjs`). A
build's page is prepared with its delivery, so Archify runs once on it (`src/map/explainer.mjs`), and a run of the
suite keeps Archify's whole answers between its test files (`src/map/archify.mjs`). The search names a band's content
once an option and asks a pair of choices once (`src/layout/channel-solver/search.mjs`); the track assignment works
out what two spans are to one another once a pair (`src/layout/channel-solver/tracks.mjs`), and a wire segment carries
its own facts from where it is made (`src/layout/measure.mjs`). The next causes, in the order the measurements give
them: the suite's width; the number of assignments the search measures (`routesOf`), where no fact is now worked out
twice; the page's one run of Archify, which is another product's; the two media of a build, which are made one after
the other; `npm ci` on the Windows guest. The pipelines that repeat on one commit were the fleet's paradigm, and
the numbers went to ETHOS's owner session on 2026-11-18; from 2026-11-22 GitLab runs none for a tag or a push of
`dev` here, the owner's trial (above), and whether the other repositories follow is that session's to decide.

## Not established

- The suite's time on the guests with the three changes, apart from the load of the hour: the jobs above are one
  pipeline each.
- What the track assignment's and the measure's changes save on a calm host: every pair was measured at a load of 6
  to 30, and only the modules' own seconds are read.
- What the suite takes on the Windows and macOS guests at three files: read from this Change's own pipeline.
- What the suite takes on the host at five or six files, which would use more than the fourteen cores a ticket
  leaves the others by the measured cores a file.
- How many of the suite's candidate documents are the same from one test file to the next: one file was measured.
- Why the Windows guest loses more than the other two beside other work (its tests summed 6257 s there and 4352 s
  alone), and how much of what is left alone is the starting of processes: nothing was read inside the guest.
- Whether coverage costs the suite a noticeable share: the gate runs it under `c8` and was not run without.
- How the protected runners differ from the review runners beyond the one Windows path of 2026-10-31, and whether
  GitLab holds protected variables for this project: neither was read, the second because its interface returns
  the values.
- What the Linux job's Chromium step takes with the browser kept between jobs: no job has run with it. It is read
  at the next landings.
- Every time here is one run. The large builds' changes are far beyond what the load explains; the smallest pair's
  six seconds of 38 are not.

## Record

2026-11-18 and 2026-11-19, the holder of the lane. The traces, profiles, scripts and the ledger of attempts lie in
the checkout's ignored `build/runtime/work/perf-20261118/`. The proofs of seven days: 2026-11-22, the holder, from
`.git/ethos/artifacts` (its reading, `build/runtime/work/retro-20261122/proof-times-7d.txt`). The pipelines of seven days: 2026-11-22, the holder,
from GitLab's interface (its readings, `build/runtime/work/retro-20261122/gl-each/` and `gl-30d/`). The Linux jobs' steps:
`build/runtime/work/perf-20261122/linux-install-7d.tsv`.
