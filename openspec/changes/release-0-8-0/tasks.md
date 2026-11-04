## 1. Release

- [x] 1.1 Set `VERSION` to 0.8.0 and write its projections; verify `node tools/release/version.mjs --check` passes and `package.json` and its lock name 0.8.0. `VERSION` is 0.8.0; `node tools/release/version.mjs --check` passes, and `package.json`, the lock and its root package name 0.8.0.
- [x] 1.2 Date the Unreleased notes of the changelog as 0.8.0 at the release cut and link the release; verify the documentation checks. The Unreleased notes are dated `## [0.8.0] - 2026-11-05` and linked to the v0.8.0 release; Prettier and markdownlint pass on the repository.

## 2. Verification

- [ ] 2.1 Run `npm run check`; verify it passes at or above the coverage floors.
