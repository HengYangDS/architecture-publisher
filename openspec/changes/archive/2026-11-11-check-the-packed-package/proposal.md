## Why

The package check scans the whole checkout and follows directory symlinks. The accepted-root check did not finish while traversing a retained tool cache, even though the npm package excludes that cache. A smaller linked-worktree fixture completed with spurious nested-package warnings; it did not reproduce the timeout.

## What Changes

- Check the archive selected by native npm packing through publint's supported `--pack npm` mode.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None; this repairs development validation without changing published behavior.

## Impact

Only `package.json`'s `check:package` command changes. The selected package file set and runtime payload remain unchanged; the published `package.json` carries the new check metadata. Dependency versions, the lockfile, product source and other checks retain their current owners.
