## Why

Architecture Publisher's output is rigorous, but a newcomer rarely gets far enough to see it. The README has no picture
and no command that installs it on most machines; release archives exist only for ARM64. The quick start ignores
`--repo` without a word when a model claims no files. `archpub build --help` is a usage error, and the agent Skill
still describes the posters that 0.10.0 removed and does not ship with the package.

## What Changes

- Each command prints its own usage with `--help`, and `check` counts in the singular for one.
- A model may carry `$schema` for its editor, and a refusal of an unknown field names the nearest field the model
  format has.
- `check` and `build` warn when `--repo` names a checkout but the model claims and cites no file, so nothing is read.
- The agent Skill describes the current publisher, ships in the package and the archives, and `archpub skill`
  prints the Skill that matches the installed version.
- Releases add archives for Linux and Windows on x86-64, verified by GitHub's CI; GitLab's runners remain ARM64.
- The README shows a plate, installs in one line and starts from a published work; a tutorial, how-to guides and a
  glossary join the reference; the reference corrects what no longer matches the code; security, conduct and issue
  and pull request templates join the repository, and CONTRIBUTING gains a path for outside contributors.
- The release workflow can publish the package to npm with provenance once the package is registered.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-identity`: x86-64 archives on the platforms GitHub verifies; the package carries its agent Skill.
- `edition-delivery`: a command's own usage with `--help`.
- `architecture-model`: `$schema`, and the nearest field in an unknown-field refusal.
- `source-binding`: a warning when a checkout has nothing to read.

## Impact

`src/cli/`, `src/model/`, `src/sources/bind.mjs`, `skills/`, `package.json`, `.config/ci/pipeline.cue` and the
generated workflows, `.config/mise/`, `tools/release/`, `README.md`, `CONTRIBUTING.md`, `docs/`, `.github/`, tests and
`CHANGELOG.md`. Deliveries are unchanged: the same model builds the same edition, images and page.
