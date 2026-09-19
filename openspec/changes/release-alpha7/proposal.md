# Proposal

## Why

The accepted semantic-publication implementation changed installed publisher
behavior and package contents after `v0.1.0-alpha.6`. A new immutable release
identity is required so installed self-host and AIGW dual-medium evidence names
the bytes that actually implement it.

## What Changes

- Advance the package and lock projection to `0.1.0-alpha.7`.
- Admit only the matching signed `v0.1.0-alpha.7` tag in release policy.
- Canonicalize a self-host output directory after creating it so a valid
  absolute path through a platform alias remains portable to the strict writer.
- Publish the exact package, checksums and scoped qualification record.
- Keep the published ETHOS reader linked to its existing alpha.5 bytes rather
  than uploading a duplicate or claiming a new reader edition, and distinguish
  it from the local owner-accepted viewing/delivery copies and alpha.3 recovery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `semantic-publication`: Extend self-hosted publication portability to an
  absolute output path whose existing parent resolves through a filesystem alias.

## Impact

The self-host example, its installed-package regression, package identity,
release policy, publication guidance and this Change are affected. Generic
writer strictness, runtime dependencies, published reader bytes, local
viewing/delivery bytes, historical releases and predecessor repositories are
unchanged.
