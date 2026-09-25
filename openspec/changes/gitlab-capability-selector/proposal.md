## Why

The GitLab `verify` job currently has no runner selector. It succeeds only because
project runner #82 accepts untagged jobs, despite already advertising the fleet's
`ci-linux-arm64-docker` capability. This leaves CI routing implicit and prevents
the untagged admission from being closed safely.

## What Changes

- Select `ci-linux-arm64-docker` explicitly for the existing `verify` job.
- After a pipeline on the exact published commit passes on runner #82, disable
  untagged admission on that registration and verify its other policy fields
  remain unchanged.
- Keep the runner project-locked. Do not add a runner, tag alias, manager, or
  product dependency.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is CI execution routing, not a publisher behavior change;
`skip_specs: true` applies.

## Impact

Only `.gitlab-ci.yml`, the GitLab project runner's untagged admission, and this
Change's records are affected. Publisher source, npm dependencies, packaged
behavior, GitHub execution, and the separate publication-boundary Work Lane
remain unchanged.
