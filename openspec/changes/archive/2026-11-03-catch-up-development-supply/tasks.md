## 1. Supply

- [x] 1.1 Move `semver` to 7.8.6 with the locked npm; verify only its entry and lock record change and `npm audit` reports no advisory. Only `semver` moves in the lock, 7.8.5 -> 7.8.6, from registry.npmjs.org with an integrity hash; `npm audit` reports no advisory.
- [x] 1.2 Pin `jdx/mise-action` at 5.2.6's commit and regenerate the CI projections; verify the commit is the one the release tag names and `check:ci` passes. `v5.2.6` and `v5` name `f5be966e`; the six GitHub jobs pin it and `check:ci` passes.

## 2. Verification

- [x] 2.1 Run `npm run check`; verify it passes at or above the coverage floors. Passed at `124a3c4` with 99.58% statements, 95.79% branches, 99.81% functions and 99.58% lines.
- [x] 2.2 Build the corpus models; verify every poster and page is byte-identical to the published 0.7.0 deliveries. At `124a3c4` every poster and page of the three works is byte-identical; each manifest differs only in the Raster supply digest.
