## 1. Source closure

- [ ] 1.1 Relock the raster crate within its pins and pack the new source closure; verify that only crc32fast and unicode-script move and that repacking the current closure reproduces its digest.
- [ ] 1.2 Publish the closure to the GitLab generic package registry and as a GitHub prerelease; verify both read back with its digest.

## 2. Renderer

- [ ] 2.1 Build the canonical pair from the closure twice on macOS ARM64, hold it in custody and bind the source manifest, the supply and the notices; verify the archive, the inputs, the outputs and the macOS witness.
- [ ] 2.2 Admit the Linux and Windows ARM64 witnesses the proposal's CI reports; verify both Forges report the same bytes for each host.

## 3. Verification

- [ ] 3.1 Run `npm run check`; verify it passes at or above the coverage floors.
- [ ] 3.2 Build the corpus models; verify every poster and page is byte-identical to the published 0.7.0 deliveries.
