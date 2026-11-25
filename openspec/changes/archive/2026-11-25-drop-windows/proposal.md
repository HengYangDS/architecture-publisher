## Why

On 2026-11-25 the owner withdrew Windows from every repository ETHOS governs, and chose one macOS label for both
Forges of each,, from CI and every other part: GitLab
runs only ARM macOS and ARM Linux, GitHub those and x86-64 Linux where needed. Today each proposal pipeline runs two
Windows jobs on the host's Windows guest and GitHub two hosted Windows jobs, and each release ships two Windows
archives.

## What Changes

- **Breaking:** a release no longer ships the `windows-arm64` and `windows-x64` archives; the mise declaration names
  `linux-arm64`, `linux-x64` and `macos-arm64`.
- CI runs no Windows job: GitLab verifies Linux and macOS on ARM64, GitHub those and Linux on x86-64. The two
  Windows runners leave the declaration.
- macOS runs on one label on both Forges, `macos-latest` (GitHub's hosted ARM macOS), with the trust role
  (`review`, `protected`) beside it on GitLab, as every repository ETHOS governs does (the owner's choice of
  2026-11-25 13:54).
- The Mise lock and configuration hold no Windows platform; the release tools hold no batch launcher or `.exe`
  path; the signature keeps ssh-keygen's own line ends; the tests, the references and the bug template name no
  Windows platform.
- Kept: a model id that is a Windows device name stays refused, since a delivery's directory is named by it and a
  reader may unpack it anywhere; and the overview's reading of a path Typst reports on Windows, which is drawing
  source and reads nothing elsewhere.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-identity`: the release's archives are for Linux on ARM64 and x86-64 and macOS on ARM64.

## Impact

Changed: `.config/ci/pipeline.cue`, `.gitlab-ci.yml` and `.github/workflows/verify.yml` (generated),
`.config/mise/config.toml`, `.config/mise/mise.lock`, `tools/release/archive.mjs`,
`tools/release/archive/assemble.mjs`, `tools/release/archive/sources.mjs`, `src/delivery.mjs`, the tests
`ci-projection`, `release-archive`, `conformance/journeys/command/archive`, `map-browser`, `source-binding` and
`fixtures/npm-environment`, `README.md`, `docs/how-to.md`, `docs/reference/configuration.md`,
`docs/reference/development.md`, `docs/reference/operations.md`, `.github/ISSUE_TEMPLATE/bug-report.yml` and
`CHANGELOG.md`. No delivered byte of a build changes.

Queue: `maintenance`.
