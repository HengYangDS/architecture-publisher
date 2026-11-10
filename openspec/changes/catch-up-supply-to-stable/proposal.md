## Why

On 10 November the owner asked every repository to move its supply to the latest stable releases. Measured at a
cutoff 24 hours back, archpub's development supply is behind in two places:

- npm: knip 6.44.2, lucide-static 1.70.0 and playwright-core 1.65.0 are newer than their pins, and the lock is behind
  in oxc-parser 0.156.0 with its platform bindings, commander 15.1.0, unbash 6.0.4,
  `@isaacs/nonrecursive-glob-match` 1.1.0, ansi-regex 6.6.0 and `@eslint-community/regexpp` 4.12.3.
- CI: the GitHub jobs pin jdx/mise-action 5.2.6 and install mise 2026.10.25, while mise-action 5.2.7 and mise
  2026.11.5 are released and the workstation moved to mise 2026.11.5 on 10 November.

Node.js 26.13.0, npm 12.2.2, Typst 0.15.1, cue 0.17.1 and Taplo 0.10.0 are already the latest stable releases, and
`@fission-ai/openspec` 1.17.0 is younger than the cooldown.

## What Changes

- knip 6.44.2, lucide-static 1.70.0 and playwright-core 1.65.0 in `package.json`, and the npm lock updated by the
  pinned npm at a cutoff 24 hours back.
- The icon supply regenerated from Lucide 1.70.0: its policy names the new version and integrity, and the bundled
  artwork gains 30 icons; three unused icons (`chef-hat`, `circle-letter-j`, `square-letter-j`) are redrawn and none is
  removed.
- The CI's mise 2026.11.5 and jdx/mise-action 5.2.7, pinned by its release commit, in `.config/ci/pipeline.cue`, with
  the generated workflow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None; the supply moves and no behavior changes.

## Impact

`package.json`, `package-lock.json`, `.config/ci/pipeline.cue`, `.github/workflows/verify.yml`, `.gitlab-ci.yml`,
`.config/ci/linux/mise.sha256`, the icon supply under `.config/release/icons/` and `renderers/icons/supply/`,
`docs/reference/model.md` and `CHANGELOG.md`. The package ships the new icon artwork; no icon a model or the kinds
catalog uses changes, so the editions of the published works do not change.
