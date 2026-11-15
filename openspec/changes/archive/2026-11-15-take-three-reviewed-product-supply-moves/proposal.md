## Why

Packages that change what the publisher generates or how it is tested are behind their newest stable
releases: `lucide-static` 1.70.0 (1.73.0), the source of the icon supply; and `playwright-core`
1.65.0 (1.65.1), which drives the browser in the test suite's page measurements. The owner approved
these moves on 15 November 2026 by a stated method: one move at a time, the supplies generated again
by the repository's own commands, and each work's delivery compared byte for byte with the same work
built before the move. The approval covers the method, not an unseen change of the product.

The owner approved four moves by the stated method. The fourth, `mute-stream` 3 to 4, turned out to
be a developer tool's transitive dependency with no pin of its own and was set aside, so that the
count is the owner's to restore. It follows the next OpenSpec supply move under the developer-tools
rule.

`@likec4/language-services` stays at 1.60.0. Version 1.61.0 is refused by the repository's own
supply guard (`likec4_supply_external_import_changed`): the bundle of its node entry has no external
import besides Node's builtins where the guard admits exactly `pnpapi`, it grows from 5,262,461 to
8,052,351 bytes, and the lock gains twelve packages, among them fontkit for measuring labels. That
changes what the shipped parser is, which is a supply decision of its own; the landing owner holds
it for a later lane.

## What Changes

- Pin `lucide-static` 1.73.0, refresh the lock, move the icon policy's version and integrity and the
  model reference's Lucide version as the previous Lucide move did, and generate the icon supply
  again with `node tools/supply/icons.mjs --write`.
- Pin `playwright-core` 1.65.1 and refresh the lock. It pins Chromium 159.0.8154.6 where 1.65.0
  pinned 158.0.8127.18; every platform's preparation installs the revision the package expects. The
  CI image, which pins Playwright v1.64.1, is not moved here.
- One commit for each move, each with its Changelog line.

Each move lands only if the delivery of every compared work is byte-identical before and after it:
the bundled Big Bank example, the LikeC4 shop example through `archpub import likec4`, and the
publisher's own work in Chinese from the publications repository. A move that changes a delivered
byte stops the lane and goes back to the owner with the files that differ.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. A move lands only when no delivered byte changes, so `.openspec.yaml` sets `skip_specs: true`.

## Impact

`package.json`, `package-lock.json`, `.config/release/icons/policy.toml`, `docs/reference/model.md`,
the generated icon supply under `renderers/icons/supply/`, and `CHANGELOG.md`. No file of the
layout, plate, page, overview or edition source changes. `tasks.md` is the sole progress ledger.

Queue: `maintenance`.
