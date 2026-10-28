## 1. Input and source binding

- [x] 1.1 Implement the Architecture Model schema, loader and validator; every invalid fixture is refused with each problem and its JSON path, and every valid fixture loads unchanged.
- [x] 1.2 Implement read-only source binding at a pinned revision; matching, mismatched, missing and unverified sources produce the specified records or refusals without changing the repository.
- [x] 1.3 Rebase the LikeC4 importer onto the model; an imported workspace builds, and unsupported constructs are reported with their locations.

## 2. Reading plan and layout

- [x] 2.1 Implement explicit and automatic views with tiers, rows from relations, collapsed overviews, group views and the five-view limit; each plan fixture yields its specified views or refusal.
- [x] 2.2 Implement the grid layout for both media: equal cards, optimal lattice placement, the system boundary, buses, corridors and exact channel routing; repeated runs return identical geometry.
- [x] 2.3 Implement the neatness measurements and layout bounds; the AIGW, Big Bank, cycle, skipped-row, bus and CJK fixtures measure clean, the three-by-three fixture reports its minimum crossings, and the seven-card row is refused.

## 3. Media

- [x] 3.1 Implement poster composition from the grid layout with design tokens, bundled fonts and icons, outlined text, row bands, the boundary, legend, footnote, scale-up and frame admission; render PNG at 1800 and 6000 px.
- [x] 3.2 Implement the native Archify map with grid positions and sides, native routes, the boundary region, color families, guided views and evidence cards; showcase delivery passes and Chromium measures primary labels of at least 14 CSS px.

## 4. Delivery and commands

- [x] 4.1 Implement staged deterministic build output and the manifest with `archpub build` and `archpub check`; a rebuild reproduces every byte.
- [x] 4.2 Implement `archpub accept` and immutable `archpub publish`; changed artifacts and conflicting versions are refused.

## 5. Retirement

- [x] 5.1 Remove superseded modules, supplies, tools, tests and documentation; dead-code, import-boundary and package checks pass with no reference to the removed mechanisms.

## 6. Editions

- [x] 6.1 Convert the AIGW model with identities, relations, details, sources, limits and attribution intact; its sources verify at the pinned `aigw-cli` revision, and its posters and map build. Published in `architecture-publications` `ca74ba4`, pinned to `ed9f0fd5` with 14 verified sources.
- [x] 6.2 Rewrite the self model for the new architecture as an overview and mechanism views; every view is admitted and its sources verify.
- [x] 6.3 Author the ETHOS model and views in `architecture-publications` at a pinned ETHOS revision; every view is admitted and its sources verify. Published in `ca74ba4`, pinned to `ad9108d7` with four views and 65 verified sources.
- [x] 6.4 Build models of two unrelated repositories authored outside them; every view is admitted or refused with its specified diagnostic. The `context-mode` (`8435702`, 25 sources) and `browser-use` (`2cc7189`, 26 sources) models are test fixtures; their sources verify at those revisions, every view is admitted without a crossing and both maps are delivered at showcase quality.

## 7. Documentation and quality

- [x] 7.1 Rewrite the README, product contract and references for the model-to-media product; Markdown and link checks pass.
- [x] 7.2 Pass the full static graph, the test suite with at least 95 percent coverage in every dimension, and the installed package journey on macOS. `npm run check` passed at `f541f69` with all 94 tests run, coverage of 99.2, 95.7, 99.6 and 99.2 percent, and the packed package installed and building on macOS.
- [x] 7.3 Pass the Linux and Windows quality jobs on an available Forge. GitHub Actions run `40552006899` passed the Linux, macOS and Windows review jobs at `d4db5ec`.

## 8. Composition

- [ ] 8.1 Measure composition: largest empty rectangle, ninths, centroid, type sizes, measure, bends, segments and stretch from geometry and from a rendered raster; the twelve 01538e9 posters fail it and a balanced fixture passes it.
- [ ] 8.2 Compose pages of one to three plates in the fixed 2400 × 1350 format on the token page grid, with the masthead (bands or side by side), sidebar and corner archetypes, natural-height bands, cards grown within their aspect, ink-centred figures, flat chain rows and an edition-wide grouping; every page passes the balance gate for the AIGW, self, ETHOS, Big Bank, browser-use, context-mode and LikeC4 shop editions, and an unbalanceable edition is refused with its measures.
- [ ] 8.3 Deliver the Archify explainer page with one panel and diagram per view, steps and pinned sources; candidates are chosen on Archify's own routes, the page passes Archify's checks, and Chromium measures preview labels of at least 13.75 px.
- [ ] 8.4 Move the evidence cards to the manifest and record each view's composition and Archify metrics; two builds are byte-identical.

## 9. Acceptance and release

- [ ] 9.1 Record the user's acceptance of the AIGW, self and ETHOS posters and pages with `archpub accept`.
- [ ] 9.2 Publish the accepted deliveries to Documents with `archpub publish` and verify every copied digest.
- [ ] 9.3 Publish a signed breaking SemVer release with a Keep a Changelog entry; verify the tag, assets and remote convergence on every reachable Forge.

## 10. Deferred work

- [ ] 10.1 Deliver the finite north-star decision packet to the ETHOS owner and record its disposition. Deferred past 2026-10-31 by the user; formerly 7.2.
- [ ] 10.2 Converge implementation-grounded research at the ETHOS owner with bound implementations, evidence and revisit triggers. Deferred past 2026-10-31 by the user; formerly 8.1.
- [ ] 10.3 Prove source and asset recovery from simulated local loss through GitLab. Deferred past 2026-10-31 by the user; formerly 9.2.
