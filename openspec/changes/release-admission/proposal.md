## Why

The owner requested the first signed source release, but the repository's explicit
empty tag policy admits no release tag. Authorize only the selected version while
preserving independent release promotion and the existing version authority.

## What Changes

- Declare only `v0.1.0-alpha.0` in `.ethos/release.toml`.
- Keep `package.json` as the version source and `main` as an independent release
  branch; creating a policy entry does not create a tag or grant release approval.
- Record and verify this bounded engineering-policy change through ETHOS.

## Capabilities

### New Capabilities

None. This change configures the existing governance adapter.

### Modified Capabilities

None. Installed publication behavior is unchanged; `skip_specs: true` applies.

## Impact

Only `.ethos/release.toml` and this Change's official artifacts are authored.
No runtime dependency, artwork, rendering code or version file is added.
Independent main promotion, signed-tag creation and remote Release publication
remain separate required effects under the existing Workline A release plan.
