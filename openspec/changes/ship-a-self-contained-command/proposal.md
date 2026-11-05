## Why

`archpub` runs only where Node.js 22.13 or later is installed, and an overview
also needs Typst 0.15.1 on the path, installed separately. The package is not on
the npm registry: it is installed by packing a checkout or by installing a
release tarball with npm. Every consumer, whether an author, a publications
repository or a CI job, prepares that toolchain first, and a Typst at another
version refuses the overview with `overview_typst_version`.

A self-contained build assembled from the released 0.8.0 package, Node.js
26.13.0 and Typst 0.15.1 ran with neither on the path and built the filmkit work
byte-identical to the normal build.

## What Changes

- A release delivers one archive per platform the CI verifies: Linux, macOS and
  Windows on ARM64. Each holds the `archpub` command, its own Node.js and Typst,
  the package, and their licenses. Unpacked anywhere, its command runs with only
  Git on the path.
- `tools/release/archive.mjs` assembles a platform's archive deterministically
  from the packed package and the locked Node.js and Typst. It also writes the
  mise declaration that names each archive's URL and checksum.
- Each CI platform assembles its own archive and builds a fixture work with it,
  byte-identical to the build from the checkout.
- The README and the operations reference install archpub with that declaration;
  CONTRIBUTING lists the release assets.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-identity`: a release delivers the `archpub` command as a
  self-contained archive for every platform the CI verifies.

## Impact

`tools/release/`, a new conformance journey and its CI step on each platform,
the README, the operations reference, CONTRIBUTING and the changelog. What a
build produces does not change, and the npm tarball stays a release asset as the
archives' input.
