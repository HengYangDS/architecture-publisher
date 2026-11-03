## 1. Globs in a coverage scope

- [ ] 1.1 Accept a glob in a coverage path and refuse an invalid one; verify validation keeps `**/*_test.go` and refuses a glob that leaves the repository.
- [ ] 1.2 Match each glob path through Git's top-anchored glob pathspec at the model's revision; verify a fixture repository's counts for `**`, `*`, `?` and `[…]`, a case-variant name left unmatched, and a glob that matches no file reported as unmatched.
- [ ] 1.3 List the largest uncovered directories inside an included glob's fixed prefix; verify an included `src/**/*.mjs` lists only directories under `src/`.
- [ ] 1.4 Document the glob in the model reference, the product skill and the changelog; verify the docs and spec checks pass.

## 2. Verification

- [ ] 2.1 Run `npm run check`; verify it passes at or above the coverage floors.
- [ ] 2.2 Check the AIGW work with `**/*_test.go` excluded; verify every production file in its scope is cited and none is uncovered.
