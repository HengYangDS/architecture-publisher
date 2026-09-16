## Why

The accepted static poster can be remeasured and reconstructed byte-exactly on
its original macOS toolchain, but ordinary raster generation still depends on
implicit host tools and fonts. Complete the static side without replacing the
accepted artwork or making the generic publisher depend on ETHOS.

## What Changes

- Add an offline static raster entry accepting a digest-selected source bundle,
  one declared SVG member, explicit font members, output dimensions and a new
  PNG destination. Reject undeclared resources, executable content and font
  fallback instead of silently consulting the host.
- Package a pinned portable renderer and XML parser with licenses and exact
  supply identities. Execute raster work with bounded memory/time and keep the
  interactive and static dependency paths independent.
- Move useful static composition, measurement and geometry responsibilities
  behind explicit inputs. Retain the original licensed-font/macOS path for
  exact legacy reconstruction; qualify the portable path separately.
- Preserve the accepted original files. A new raster engine's antialiasing
  differences are observations, not automatic permission to replace them.
- Exercise installed non-ETHOS inputs on macOS and isolated Linux, and retain
  exact-source ETHOS checks and complete input/output identity evidence.
- Expose the existing source-bundle writer through explicit, digest-selected
  file plans so installed non-ETHOS workflows do not import internal code to
  prepare raster input or package their resulting files.

## Capabilities

### New Capabilities

- `static-publishing`: explicit offline SVG rasterization and source-bound static
  edition reconstruction, with strict dependency and preservation boundaries.

### Modified Capabilities

- `source-intake`: add explicit file packaging through the public CLI; existing
  source-bundle verification and the HTML-edition contracts remain intact.

## Impact

`src/static/`, `src/source/`, CLI dispatch, pinned resources, static tests, and the
ETHOS-specific static edition. No source edit in either retained original
repository; no browser-policy workaround, global font installation or implicit
source replay. Full browser qualification and recoverable paired installation
remain owned by the existing Workline A execution record.
