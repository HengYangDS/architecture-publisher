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
- [ ] 6.4 Build models of two unrelated repositories authored outside them; every view is admitted or refused with its specified diagnostic.

## 7. Documentation and quality

- [x] 7.1 Rewrite the README, product contract and references for the model-to-media product; Markdown and link checks pass.
- [ ] 7.2 Pass the full static graph, the test suite with at least 95 percent coverage in every dimension, and the installed package journey on macOS.
- [ ] 7.3 Pass the Linux and Windows quality jobs on an available Forge. Dependency: intranet GitLab is unreachable until its owner announces recovery.

## 8. Acceptance and release

- [ ] 8.1 Record the user's acceptance of the AIGW, self and ETHOS posters and maps with `archpub accept`.
- [ ] 8.2 Publish the accepted deliveries to Documents with `archpub publish` and verify every copied digest.
- [ ] 8.3 Publish a signed breaking SemVer release with a Keep a Changelog entry; verify the tag, assets and remote convergence on every reachable Forge.

## 9. Deferred work

- [ ] 9.1 Deliver the finite north-star decision packet to the ETHOS owner and record its disposition. Deferred past 2026-10-31 by the user; formerly 7.2.
- [ ] 9.2 Converge implementation-grounded research at the ETHOS owner with bound implementations, evidence and revisit triggers. Deferred past 2026-10-31 by the user; formerly 8.1.
- [ ] 9.3 Prove source and asset recovery from simulated local loss through GitLab. Deferred past 2026-10-31 by the user; formerly 9.2.
