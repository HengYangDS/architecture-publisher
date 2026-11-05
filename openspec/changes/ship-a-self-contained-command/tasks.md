## 1. Archive

- [x] 1.1 Add a deterministic ustar and gzip writer to `tools/release/archive.mjs`; verify by tests that the same entries give the same bytes, modes are 0755 for executables and 0644 otherwise, and a path ustar cannot hold is refused. `tests/release-archive.test.mjs` passes: the same entries give the same bytes, modes are 0755 and 0644, and a 262-byte path is refused.
- [x] 1.2 Assemble one platform's archive from the packed package and given Node.js and Typst executables with their licenses, refusing a platform the lock does not pin for both; verify by tests the layout, the launchers and that two assemblies are byte-identical. The tests check the layout, both launchers and two byte-identical assemblies, and refuse a platform without both tools.
- [x] 1.3 Add the release source that downloads each platform's locked Node.js and Typst archives, refuses a checksum mismatch and extracts the executables and licenses; verify by a test with a corrupted fixture archive, and by assembling the three platforms on macOS twice with identical bytes. A corrupted cached archive is refused before it is opened. On macOS, two `--platform all --official` runs gave identical archives (linux-arm64 108,454,243 B, macos-arm64 101,565,917 B, windows-arm64 91,269,504 B), and the macOS one equals the archive from mise's installed Node.js and Typst.
- [x] 1.4 Write the mise declaration for a set of archives and a release URL; verify by a test that it names each archive's URL, SHA-256 and `archpub/bin`, and no other platform. The declaration test names each archive's URL, SHA-256 and `archpub/bin` in platform order, and no other platform.

## 2. Platforms

- [x] 2.1 Add the conformance journey that assembles the running platform's archive, unpacks it and builds a model with an overview with no Node.js or Typst on the path; verify on macOS that every delivered file equals the checkout's build. On macOS the journey passes: `--version` and a build with posters, page and overview ran with `/usr/bin:/bin` as the path, and every delivered file equals the checkout's build.
- [x] 2.2 Run the journey in each CI platform's acceptance; verify `npm run check:ci` passes with the regenerated projections. Each platform's acceptance in `.gitlab-ci.yml` and `.github/workflows/verify.yml` runs the journey; `node tools/ci/projection.mjs --check` passes.

## 3. Documentation

- [x] 3.1 Describe installing the command in the README and the operations reference, and the release assets in CONTRIBUTING, and record the change in the changelog; verify Prettier and markdownlint pass. The README, the operations reference, CONTRIBUTING and the changelog describe the archives; Prettier and markdownlint pass.

## 4. Verification

- [x] 4.1 Run `npm run check`; verify it passes at or above the coverage floors. Passed at `5ff4484` with 99.57% statements, 95.47% branches, 99.83% functions and 99.57% lines.
