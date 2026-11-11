## Why

The package check scans the whole checkout and follows directory symlinks. A retained tool cache can therefore make it traverse a cycle indefinitely, even though the npm package excludes that cache.

## What Changes

- Check the archive selected by native npm packing through publint's supported `--pack npm` mode.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None; this repairs development validation without changing published behavior.

## Impact

Only `package.json`'s `check:package` command changes. Package contents, dependency versions, the lockfile, product source and other checks retain their current owners.
