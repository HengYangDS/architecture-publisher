## Why

The owner directed on 2026-11-18 that ETHOS and every governed repository take the latest stable release of their
supply. Measured on `dev` f1fcebe2 at the fleet's 0-hour release-age floor, the publisher is behind in its npm lock,
four exact pins, its pinned npm and the mise that its CI downloads.

## What Changes

- Move `@fission-ai/openspec` 2.0.0 to 2.1.0, `lucide-static` 1.73.0 to 1.74.0 and the `minimatch` override 11.0.8
  to 11.0.9 in `package.json`, and move the npm lock with them; the lock's measured transitive moves follow,
  `mute-stream` 4.0.0 among them.
- Move the pinned npm from 12.2.2 to 12.2.3 in the Mise configuration, its lock and `devEngines`.
- Move the CI's mise from 2026.11.5 to 2026.11.9 and `jdx/mise-action` to v5.2.9 by its release commit in the
  pipeline declaration, regenerate both workflows, and move `.config/ci/linux/mise.sha256` to the new binary.
- Regenerate the icon supply with Lucide 1.74.0.
- Bind remeda's vendored licence to 2.62.1, whose upstream text is unchanged, and regenerate the LikeC4 supply.
- Record the move in the Changelog.

`@likec4/language-services` stays at 1.60.0: the repository's supply guard refused 1.61.0 on 2026-11-15, and
neither has changed since; the design states the reading.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

## Impact

Development and CI supply only. A published work changes only where Lucide 1.74.0 changes an icon that a model uses;
the design records the comparison of the three works' plates before and after.

Queue: `maintenance`.
