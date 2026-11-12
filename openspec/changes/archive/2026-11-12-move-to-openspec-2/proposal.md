## Why

The repository validates its specifications with OpenSpec 1.16.0, a development dependency. OpenSpec
2.0.0 is the latest release. The owner moved every governed repository to it without the usual
24-hour wait for a new release, with breaking changes allowed.

2.0.0 keeps the workflows and the validation the repository runs. Its breaking changes concern the
agent integration: skills are installed in `.agents/skills/`, the `/opsx:*` slash commands are
removed and `openspec update` deletes files that earlier versions generated. The repository
configures no OpenSpec tool, so none of them applies.

## What Changes

- Move `@fission-ai/openspec` in `package.json` from 1.16.0 to 2.0.0 and update the npm lock with
  the pinned npm.
- Record the move in the changelog.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The publisher and its checks behave as before, so `.openspec.yaml` sets `skip_specs: true`.

## Impact

`package.json`, `package-lock.json` and `CHANGELOG.md`. The package that users install does not
change, so the release stays at 0.12.0.
