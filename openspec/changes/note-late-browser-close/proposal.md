## Why

The 0.8.0 proposal's GitLab Windows review job failed in `tests/map-browser.test.mjs` after every
check of its pages had passed. Its suite counted one failure and no cancellation, and the message
named a 120000 ms limit, so the limit that fired was the two-minute hook that closes the browser,
not the test's own fifteen minutes: the loaded runner took longer than two minutes to close the
browser. The retry passed alone. Closing the browser is cleanup, yet it decided a release.

The limit came in on 2026-10-31, after a hung browser test held a hosted Windows runner until the
job's time limit. Every test file has since exited when its tests end, and Playwright ends a browser
that is still running when the test process exits, so the runner no longer depends on the close
failing.

## What Changes

- A browser test waits at most two minutes for its browser to close. Past that the test notes the
  delay and passes; an error from closing still fails it.
- Starting the browser and opening the standalone page keep their two-minute limit, which admits
  the browser before the suite.
- A regression test: a browser that never closes is noted, and its test passes within its limit.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

## Impact

`tests/map-browser.test.mjs` and `CHANGELOG.md`. The product, its package and the CI configuration
do not change. Out of scope: the runners' time limits and the CI machines, which are the owner's
configuration.
