## 1. Archive

- [ ] 1.1 Add a deterministic ustar and gzip writer to `tools/release/archive.mjs`; verify by tests that the same entries give the same bytes, modes are 0755 for executables and 0644 otherwise, and a path ustar cannot hold is refused.
- [ ] 1.2 Assemble one platform's archive from the packed package and given Node.js and Typst executables with their licenses, refusing a platform the lock does not pin for both; verify by tests the layout, the launchers and that two assemblies are byte-identical.
- [ ] 1.3 Add the release source that downloads each platform's locked Node.js and Typst archives, refuses a checksum mismatch and extracts the executables and licenses; verify by a test with a corrupted fixture archive, and by assembling the three platforms on macOS twice with identical bytes.
- [ ] 1.4 Write the mise declaration for a set of archives and a release URL; verify by a test that it names each archive's URL, SHA-256 and `archpub/bin`, and no other platform.

## 2. Platforms

- [ ] 2.1 Add the conformance journey that assembles the running platform's archive, unpacks it and builds a model with an overview with no Node.js or Typst on the path; verify on macOS that every delivered file equals the checkout's build.
- [ ] 2.2 Run the journey in each CI platform's acceptance; verify `npm run check:ci` passes with the regenerated projections.

## 3. Documentation

- [ ] 3.1 Describe installing the command in the README and the operations reference, and the release assets in CONTRIBUTING, and record the change in the changelog; verify Prettier and markdownlint pass.

## 4. Verification

- [ ] 4.1 Run `npm run check`; verify it passes at or above the coverage floors.
