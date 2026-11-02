## 1. Source closure

- [x] 1.1 Relock the raster crate within its pins and pack the new source closure; verify that only crc32fast and unicode-script move and that repacking the current closure reproduces its digest. Only crc32fast and unicode-script move; repacking the current closure reproduces `3772b25b2c10`, and the new closure is `f55157d60abd`, 3,256,128 bytes.
- [x] 1.2 Publish the closure to the GitLab generic package registry and as a GitHub prerelease; verify both read back with its digest. The GitLab package and the GitHub prerelease `0.49.0-f55157d60abd` read back with its digest.

## 2. Renderer

- [x] 2.1 Build the canonical pair from the closure twice on macOS ARM64, hold it in custody and bind the source manifest, the supply and the notices; verify the archive, the inputs, the outputs and the macOS witness. Both relocated builds give the unchanged glue and Wasm `bcc9648bb148`, 3,372,078 bytes, held in custody `0bba170`; the archive, the inputs, the outputs and the macOS witness verify.
- [x] 2.2 Admit the Linux and Windows ARM64 witnesses the proposal's CI reports; verify both Forges report the same bytes for each host. Both Forges report Linux `5b737c003141`, 3372360 bytes, and Windows `45589097c411`, 3371433 bytes (GitHub run 41520028448, GitLab pipeline 13771).

## 3. Verification

- [x] 3.1 Run `npm run check`; verify it passes at or above the coverage floors. Passed at `98ce943` with 99.58% statements, 95.79% branches, 99.81% functions and 99.58% lines.
- [x] 3.2 Build the corpus models; verify every poster and page is byte-identical to the published 0.7.0 deliveries. At `98ce943` every poster and page of the three works is byte-identical; each manifest differs only in the Raster supply digest.
