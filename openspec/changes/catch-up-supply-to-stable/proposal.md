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
- The CI's mise 2026.11.5 and jdx/mise-action 5.2.7, pinned by its release commit, in `.config/ci/pipeline.cue`, with
  the generated workflow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None; the supply moves and no behavior changes.

## Impact

`package.json`, `package-lock.json`, `.config/ci/pipeline.cue`, `.github/workflows/verify.yml` and `CHANGELOG.md`.
The package, its archives and the editions do not change: no moved package is a runtime dependency.
