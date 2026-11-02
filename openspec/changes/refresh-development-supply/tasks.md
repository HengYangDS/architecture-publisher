## 1. Supply

- [ ] 1.1 Move `globals` to 17.14.0 and the `re2js` and `minimatch` overrides to 2.9.1 and 11.0.4, retire the `lodash-es` override and refresh the lock within every range; verify `npm audit` reports no advisory and every resolved URL is on registry.npmjs.org with an integrity hash.
- [ ] 1.2 Regenerate the LikeC4 parser from the refreshed lock, binding remeda's vendored notice to the new release once the LICENSE at its release commit matches; verify the supply check passes.
- [ ] 1.3 Pin the Linux CI image rebuilt on the new Playwright `v1.64.1-noble` digest; verify the registry digest equals the pinned one and the CI projections are current.

## 2. Verification

- [ ] 2.1 Run `npm run check`; verify it passes at or above the coverage floors.
- [ ] 2.2 Build the corpus models; verify every poster and page is byte-identical to the published 0.7.0 deliveries.
