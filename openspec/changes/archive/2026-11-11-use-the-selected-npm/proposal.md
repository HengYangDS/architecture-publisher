# Proposal

## Why

The packed-package check can select Node's bundled npm even when the repository
has selected its independently locked npm. Native development admission then
rejects the pack operation, so otherwise successful CI cannot finish.

## What Changes

- Pack with the npm entrypoint selected by the calling npm script.
- Validate that archive through publint's supported tarball API.
- Verify the native command with a conflicting npm on PATH, rejected package
  content and cleanup on both success and failure.

## Capabilities

### New Capabilities

None. This is a development-tool repair; `skip_specs: true` applies.

### Modified Capabilities

None. Published package behavior and product requirements remain unchanged.

## Impact

The bounded material scope is `package.json`, `tools/checks/package.mjs`,
`tests/package-check.test.mjs`, `docs/reference/development.md` and this Change.
No dependency, lockfile, vendor source, CI toolchain or credential changes are
required. Product source, publication content and foreign lanes are outside
this repair.
