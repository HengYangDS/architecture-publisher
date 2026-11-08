## Why

The repository runs ETHOS 0.2.0-beta.5. The owner asked that every governed
repository run the latest ETHOS release, and Architecture Publications already
moved to 0.2.0-beta.6. Its adopter-facing changes since 0.2.0-beta.5 are these:

- The publication declaration names no peer coordinate and no command that ETHOS
  does not run. `.ethos/release.toml` no longer takes a peer's
  `forge_repository`, nor `local_verification_command` and
  `local_installation_command`; the loader refuses each, and
  `ethos lane repair-paradigm --apply` removes them. This repository declares
  all three.
- A peer's web repository resolves from the clone's local
  `remote.<name>.forgeRepository`, else from an `http` or `https` remote. Both
  remotes are SSH; the clone holds GitLab's key, and GitHub's is recorded with
  this move.
- Results use schema 3, and a retirement receipt applies only with `--retire`,
  which the dry run's continuation carries.

## What Changes

- Bind the repository family to the 0.2.0-beta.6 runtime with the released
  console's `hook install`, keeping the 0.2.0-beta.5 runtime as the rollback.
- Remove GitHub's `forge_repository` and the two command fields from
  `.ethos/release.toml` with the deterministic paradigm repair, and record
  GitHub's web repository in the clone's local `remote.github.forgeRepository`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The product, its checks and its publication behave as before, so
`.openspec.yaml` sets `skip_specs: true`.

## Impact

`.ethos/release.toml` and the repository-family runtime selection. The mise
configuration declares no ETHOS, so neither it nor its lock changes. The CI
projection and the product are unchanged. `tasks.md` is the sole progress
ledger.
