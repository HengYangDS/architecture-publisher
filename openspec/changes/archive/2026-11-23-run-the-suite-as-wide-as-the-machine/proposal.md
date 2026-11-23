## Why

The suite runs two test files at a time on every machine, a width set on 2026-09-18 with no reason recorded. The
contract's item `performance` asks that the suite run as wide as its machine allows. Measured on 2026-11-23 on the
host under a ticket, the whole suite took 250 s at two files and 156 s at four, every test passing. The owner adopted
targets for the whole development loop at 00:03 the same day (relayed): a Change's full local proof within 10 minutes
and a commit's guest pipeline within 15; this publisher's medians were 17.6 and 31.3, the suite most of each.

## What Changes

- `npm test` runs `tools/test/suite.mjs`, which runs the same Node test command with a width from the machine's
  cores: the cores over 2.5, at least two and at most four. Four on the host, three on the Windows and macOS guests,
  two on the Linux guest.
- A test holds the rule at the widths of the machines it runs on.
- knip names the preload the launcher passes to Node as an entry, since the launcher names it as a string.
- The performance record gains the measurement and what is not yet measured; the changelog says so.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement names how many test files run at once; it is the repository's development practice.

## Impact

New: `tools/test/suite.mjs`, `tests/suite-width.test.mjs`. Changed: `package.json` (`test`),
`.config/checks/knip/knip.toml`, `docs/research/build-and-suite-time.md` and `CHANGELOG.md`. No source of the product
and no delivered byte. ETHOS's behaviour gate runs `npm test`'s command as before, through the launcher.

Queue: `maintenance`.
