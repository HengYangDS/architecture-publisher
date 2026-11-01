## 1. Custody

- [ ] 1.1 Commit the canonical raster pair from custody `6eb45c8` at `renderers/resvg/supply/resvg/`; verify `git ls-tree` shows the same blob ids as in `6eb45c8`.

## 2. Package at the root

- [ ] 2.1 Move `src/`, `renderers/` and `supplies/` to the root with `git mv` and stop tracking the raster pair; verify `git status` shows only renames and the untracked pair.
- [ ] 2.2 Merge the two manifests into one root `package.json` without workspaces and refresh the lock without installing other versions; verify every resolved version and integrity hash is unchanged.
- [ ] 2.3 Merge the package README into the root README and keep one license; verify the README keeps the command summary, model format, outputs, exit codes and Node requirement.
- [ ] 2.4 Repoint every reference to `packages/publisher/` in configuration, tools, tests, the CI source and its projections, `.gitattributes`, `.gitignore`, `.ethos/profile.toml` and the documentation; verify none remains outside archived Changes and model source paths.
- [ ] 2.5 Point `raster-supply` at the new custody commit; verify a fresh bootstrap restores the pair and `verify.mjs --stage` passes.

## 3. Samples and corpus

- [ ] 3.1 Move the Big Bank model and the LikeC4 shop workspace into `examples/`, each with a README, and read them there from the tests and the documentation; verify the README commands run.
- [ ] 3.2 Add the corpus README to `tests/fixtures/models/` with each copy's origin, and add the former self model as a corpus copy that the tests read; verify no test reads a path under `editions/`.
- [ ] 3.3 Remove `editions/self/` and point the documentation at the architecture-publications work; verify no link targets `editions/`.

## 4. Verification

- [ ] 4.1 Run `npm run check`; verify it passes with the same coverage.
- [ ] 4.2 Build the AIGW, ETHOS and former self models; verify every poster and page is byte-identical to the published 0.7.0 deliveries.
- [ ] 4.3 Pack the package; verify every file except `package.json` is byte-identical to the 0.7.0 package.
