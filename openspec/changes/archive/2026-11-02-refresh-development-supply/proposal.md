## Why

The owner asked to move every supply to its latest stable release. Measured on
2 November, the toolchain, the vendored renderers, fonts, icons and parser and
every pinned CI action are already current, and `npm audit` reports no
advisory. Four things are not:

- `globals` is 17.13.0; 17.14.0 is out.
- The overrides hold `re2js` at 2.8.8 and `minimatch` at 11.0.3; 2.9.1 and
  11.0.4 are out.
- The lock holds 31 transitive packages below the newest versions their ranges
  allow.
- The official Playwright `v1.64.1-noble` image that the Linux CI image builds
  on was published again with operating-system updates under a new digest.

The `lodash-es` override no longer changes the lock: `chevrotain-allstar`, its
only dependent, now requires 4.18.1 itself. Without any one of the other four
overrides, `npm audit` reports an advisory.

ETHOS moves to its latest release by a runtime rebind, and the raster crates by
their own source rebuild; neither is part of this Change.

## What Changes

- `globals` 17.14.0, the `re2js` and `minimatch` overrides at 2.9.1 and 11.0.4,
  the `lodash-es` override retired, and the lock refreshed within every declared
  range.
- The LikeC4 parser regenerated from the refreshed lock. Remeda's npm package
  ships no licence file, so its vendored notice is bound to 2.58.0.
- The Linux CI image rebuilt on the new Playwright base digest, pushed as
  `hengyang2003/architecture-publisher-ci` and pinned by its registry digest.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None; the supply moves and no behavior changes.

## Impact

`package.json`, `package-lock.json`, the LikeC4 parser supply and its notice
builder, `.config/ci/linux/Dockerfile`, `.config/ci/pipeline.cue` and its
projections, the development reference and the changelog. The published
package declares no dependency, and every corpus poster and page stays
byte-identical.
