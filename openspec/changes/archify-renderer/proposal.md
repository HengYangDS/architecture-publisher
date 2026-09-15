## Why

The accepted atlas can only rebuild through an old repository and its implicit
host/tool paths. Move the pinned rendering dependency behind a portable,
source-independent backend before migrating ETHOS-specific views and checks.

## What Changes

- Package the exact necessary Archify 2.16.0 runtime files and license, with a
  source/archive identity and per-file hashes; do not import gallery/history.
- Add an explicit installed CLI that renders caller-selected typed JSON through
  upstream delivery checks into a new HTML file. Keep source integrity,
  upstream geometry checks, browser observation and semantic acceptance distinct.
- Reject implicit repository reads and remote brand retrieval in this offline
  renderer. Such integrations require separate explicit contracts.
- Exercise independent non-ETHOS architecture/lifecycle inputs under an installed
  package, relocated paths, empty HOME and unavailable Git/Python/ETHOS tooling.

## Capabilities

### New Capabilities

- `archify-renderer`: pinned, offline, independently installed typed-diagram rendering.

### Modified Capabilities

None. Generic source bundles and ETHOS inputs keep their accepted contracts.

## Impact

`src/interactive/`, CLI dispatch, pinned runtime supply under `assets/archify/`,
examples, package payload and tests. No modification to original artwork or old
repository code. This Change owns the generic backend; full ETHOS atlas migration,
static composition, runtime verification and recoverable installation remain in
the existing Workline A execution record.
