## Why

The tools that format, lint and check the publisher are behind their newest stable releases:
Prettier 3.9.10 (3.10.1 was published on 12 November 2026), ESLint 10.14.0 (10.15.0),
markdownlint-cli2 0.24.0 (0.24.1) and knip 6.44.2 (6.45.1), and the `glob` and `minimatch`
overrides hold 14.0.3 and 11.0.4 (14.0.6 and 11.0.8). The owner asked every governed repository to
take its supply at the newest stable releases. None of these packages ships in the package.

## What Changes

- Pin Prettier 3.10.1, ESLint 10.15.0, markdownlint-cli2 0.24.1 and knip 6.45.1 in
  `devDependencies`, and move the `glob` and `minimatch` overrides to 14.0.6 and 11.0.8.
- Refresh `package-lock.json` with npm. The lock moves only these packages and the ones they force:
  `@eslint/config-array` 0.23.6, `js-yaml` 5.5.0, `markdownlint` 0.42.1 and `argparse` 3.0.4,
  which `js-yaml` and `markdown-it` now share, so the copy nested under `markdown-it` goes.
- Record the move under Changed in the Changelog's Unreleased section.

Not in this Change: `@likec4/language-services` 1.61.0, `lucide-static` 1.73.0, `playwright-core`
1.65.1 and `mute-stream` 4 change what the publisher generates or how it is accepted. The owner
approved them on 15 November 2026 for a lane of their own, one move at a time with the deliveries
compared byte for byte. No tool moved here forces `mute-stream` 4. The four bundled runtime
dependencies, commander 15.1.0, @clack/prompts 1.9.0, fast-string-width 3.0.2 and fast-wrap-ansi
0.2.2, are already the newest releases.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The publisher, its commands and its deliveries behave as before, so `.openspec.yaml` sets
`skip_specs: true`.

## Impact

`package.json`, `package-lock.json` and `CHANGELOG.md`. Prettier 3.10.1 reformats no tracked file.
No source, test, generated supply or file of the plate source changes. `tasks.md` is the sole
progress ledger.

Queue: `maintenance`.
