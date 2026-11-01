## 1. Custody

- [x] 1.1 Commit the canonical raster pair from custody `6eb45c8` at `renderers/resvg/supply/resvg/`; verify `git ls-tree` shows the same blob ids as in `6eb45c8`.

## 2. Package at the root

- [x] 2.1 Move `src/`, `renderers/` and `supplies/` to the root with `git mv` and stop tracking the raster pair; verify `git status` shows only renames and the untracked pair.
- [x] 2.2 Merge the two manifests into one root `package.json` without workspaces and refresh the lock without installing other versions; verify every resolved version and integrity hash is unchanged.
- [x] 2.3 Merge the package README into the root README and keep one license; verify the README keeps the command summary, model format, outputs, exit codes and Node requirement.
- [x] 2.4 Repoint every reference to `packages/publisher/` in configuration, tools, tests, the CI source and its projections, `.gitattributes`, `.gitignore`, `.ethos/profile.toml` and the documentation; verify none remains outside archived Changes, model source paths and the research pages that the next Change in this lane retires.
- [x] 2.5 Point `raster-supply` at the new custody commit and regenerate the Raster supply manifest for the moved source record; verify a fresh bootstrap restores the absent pair and `verify.mjs --stage` passes.
- [x] 2.6 Add a root `CONTRIBUTING.md` for setup, verification, commits, landing and releases and link it from the README; verify formatting, Markdown, prose and strict OpenSpec checks pass.

## 3. Samples and corpus

- [x] 3.1 Move the Big Bank model and the LikeC4 shop workspace into `examples/`, each with a README, and read them there from the tests and the documentation; verify the README commands run.
- [x] 3.2 Add the corpus README to `tests/fixtures/models/` with each copy's origin, and add the former self model as a corpus copy that the tests read; verify no test reads a path under `editions/`.
- [x] 3.3 Remove `editions/self/` and point the documentation at the architecture-publications work; verify no link targets `editions/`.

## 4. Verification

- [ ] 4.1 Run `npm run check`; verify it passes with the same coverage.
- [x] 4.2 Build the AIGW, ETHOS and former self models; verify every poster and page is byte-identical to the published 0.7.0 deliveries and each manifest differs only in the Raster supply digest.
- [x] 4.3 Pack the package; verify it holds the same files as the 0.7.0 package, byte-identical except `package.json`, the merged README, the output paths in the Raster source record and that record's digest in the supply manifest.
