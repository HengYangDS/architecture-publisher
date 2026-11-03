## 1. Supply

- [ ] 1.1 Move `semver` to 7.8.6 with the locked npm; verify only its entry and lock record change and `npm audit` reports no advisory.
- [ ] 1.2 Pin `jdx/mise-action` at 5.2.6's commit and regenerate the CI projections; verify the commit is the one the release tag names and `check:ci` passes.

## 2. Verification

- [ ] 2.1 Run `npm run check`; verify it passes at or above the coverage floors.
- [ ] 2.2 Build the corpus models; verify every poster and page is byte-identical to the published 0.7.0 deliveries.
