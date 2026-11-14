## 1. Developer tools

- [x] 1.1 Pin Prettier 3.10.1, ESLint 10.15.0, markdownlint-cli2 0.24.1 and knip 6.45.1, move the
      `glob` and `minimatch` overrides to 14.0.6 and 11.0.8, and refresh `package-lock.json`; done
      when the lock moves only these packages and the ones they force, `npm ci` installs it, and OSV
      reports no advisory in it. The lock moved exactly `@eslint/config-array` 0.23.6, `argparse`
      3.0.4, ESLint, `glob`, `js-yaml` 5.5.0, knip, `markdownlint` 0.42.1, markdownlint-cli2,
      `minimatch` and Prettier, and dropped the nested `markdown-it/argparse` copy;
      `mise run bootstrap` installed it; OSV reports no advisory in its 437 packages.
- [x] 1.2 Check the repository on the new tools; done when `mise run check` passes and Prettier
      3.10.1 reformats no tracked file. `mise run check` passes: every static check, 368 passing
      tests with no failure (two browser tests skipped: the lane has no browser installed; the
      hosted jobs run them), coverage and the packed-package check; Prettier 3.10.1
      `--list-different` names no file.
- [x] 1.3 Record the move under Changed in the Changelog's Unreleased section; done when the format
      check and the Markdown checks pass. The Unreleased Changed list records the move; the format
      check and the `markdown-lint`, `prose`, `openspec`, `config-quality` and `docs-registry` gates
      pass.

## Workflow follow-up

- Archive this Change and prove the archived head once.
- Publish the proposal, wait for both forges' review jobs, and land on the landing owner's go for
  the exact head.
