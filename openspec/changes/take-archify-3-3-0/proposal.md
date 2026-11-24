## Why

The publisher bundles Archify 3.2.0. Archify 3.3.0, released on 2026-11-22, is its latest stable release, and the owner
asked on 2026-11-24 that it be taken after 0.18.0. It carries some fifteen fixes to the explainer page and bounds the
work of its crossing check; it is also licensed under Apache-2.0 where 3.2.0 was MIT.

## What Changes

- The Archify supply is taken whole from the official v3.3.0 release archive (`archify.zip`, its digest the one
  GitHub records): 132 files, the 3.2.0 supply's files and every module they import statically, and the license
  files the archive's NOTICE names. No file is edited.
- `supply.json` records 3.3.0, its tag's commit, the archive's digest and the license Apache-2.0; the release archive
  kept under `tools/supply/archives/` is 3.3.0's.
- The supply carries LICENSE (Apache-2.0), NOTICE, LICENSE-MIT and THIRD_PARTY_NOTICES, which Apache-2.0 asks a
  redistributor to keep.
- ETHOS's source contract for the supply names 3.3.0's archive and each of its 132 files, derived from the supply.
- The operations reference names 3.3.0; the changelog says so, with what the twelve published works' pages change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None: the requirement that the supply is unmodified and bound to its release archive holds as written.

## Impact

Changed: `renderers/archify/supply/` (taken whole), `tools/supply/archives/`, `.ethos/profile.toml` (the supply's
source contract), `docs/reference/operations.md` and `CHANGELOG.md`. Every delivery's page changes as 3.3.0 draws it;
the edition, its figures and the data are the publisher's and do not.

Queue: `maintenance`.
