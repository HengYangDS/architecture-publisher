## Context

See [proposal.md](proposal.md). `launch(t)` in `tests/map-browser.test.mjs` registers
`t.after(() => browser.close(), { timeout: BROWSER })`. node:test reports an after hook that
outlasts its limit as a failure of its test, with the same message as a test that outlasts its own
limit. Playwright's `browser.close()` returns once the browser process has exited and its temporary
profile is removed.

## Goals / Non-Goals

**Goals:**

- A slow or hung browser close cannot fail a test whose checks passed.
- A hung close still cannot hold the runner.

**Non-Goals:**

- Finding why the Windows runner closed slowly; that job kept no browser log.
- Changing the runners' time limits or the CI machines.

## Decisions

- **Bound the wait instead of failing on it.** The after hook races `browser.close()` against the
  two-minute limit and, past it, records a test diagnostic. `--test-force-exit`, which `npm test`
  and the CI browser step pass, ends the test file when its tests end, and Playwright's exit handler
  ends the browser, so a hung close still costs at most two minutes. A longer failing limit was
  rejected: it only moves a threshold that a loaded runner can pass.
- **Errors still fail.** A close that rejects reports a fault in the browser or in Playwright, so it
  fails the test as before.
- **One limit.** Closing waits as long as starting may take, so the file keeps its one constant.
- **The regression pins the note and the bound.** It runs a subtest whose browser never closes and
  spies on the subtest's diagnostic with `t.mock.method`, so it fails if the close fails the
  subtest, if the note goes or if the wait has no bound.

## Risks / Trade-offs

- [When the browser process has ended and only removing its profile is slow, the abandoned removal
  can leave that profile in the runner's temporary directory] → Each case leaves a diagnostic in the
  job log.
