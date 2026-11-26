## Why

CI runs Mise 2026.11.9 through `jdx/mise-action` v5.2.9. Mise 2026.11.14, published on 24 November 2026 at 11:00
UTC, and mise-action v5.3.0, published on 21 November 2026 at 17:01 UTC, are the latest stable releases, and both
are past the 24-hour release age. On 26 November 2026 the owner asked that Mise be at its latest stable release in
every repository ETHOS governs.

Queue: `maintenance`.

## What Changes

- `.config/ci/pipeline.cue` names Mise 2026.11.14 and mise-action v5.3.0 by its commit.
- The Linux job's bootstrap checks the 2026.11.14 binary against the checksum Mise publishes for it.
- The GitHub and GitLab pipelines are generated again from the pipeline's source.
- The Changelog's Unreleased section records the move.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The checks and the release behave as before, so `.openspec.yaml` sets `skip_specs: true`.

## Impact

`.config/ci/pipeline.cue`, `.config/ci/linux/mise.sha256`, the two generated pipelines and `CHANGELOG.md`. The
tool versions in `.config/mise/config.toml` and its lock do not change.
