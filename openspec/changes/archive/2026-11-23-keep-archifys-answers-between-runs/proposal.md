## Why

The owner adopted targets for the whole development loop on 2026-11-23 (relayed): a Change's full local proof within
10 minutes and a commit's guest pipeline within 15. The suite is most of both. It keeps Archify's answers to candidate
diagrams in a directory of its run and removes it at the end, so every run asks Archify again for the same documents:
measured under a ticket on 2026-11-23, a run with no answer kept took 240 s and started Archify 4332 times, a run
with the answers the first had kept 130 s and 138 times, all 660 tests passing both times.

## What Changes

- The environment fixture names one directory of answers on a machine (`archpub-test-answers` in the system's
  temporary directory) and keeps it between runs; a run removes answers a week old, and the directories earlier runs
  made for themselves.
- The development guide says so; the performance record gains the measurement; the changelog says so.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The answers' key and what a build delivers are unchanged; the suite's own fixture keeps them longer.

## Impact

Changed: `tests/fixtures/archify-answers.mjs`, `docs/reference/development.md`, `docs/research/build-and-suite-time.md`
and `CHANGELOG.md`. No source of the product and no delivered byte. A guest's runner keeps the temporary directory
between jobs or not as it does; a job that finds none runs as now.

Queue: `maintenance`.
