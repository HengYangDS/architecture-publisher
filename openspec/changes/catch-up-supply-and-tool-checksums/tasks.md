## 1. Supply

- [ ] 1.1 Move npm to 12.2.2 in `devEngines`, `packageManager` and the mise declaration, and regenerate the mise lock with the pinned mise; verify the lock holds npm 12.2.2 with its package lock, a checksum for each of Taplo's archives and pixi for Linux only.
- [ ] 1.2 Remove the npm 12.2.0 lock under `.config/mise/locks/mise.ci/`; verify no tracked file names it and mise with `MISE_ENV=ci` reads only `.config/mise/config.toml`.
- [ ] 1.3 Move the npm lock with npm 12.2.2 at a cutoff 24 hours back; verify only `@napi-rs/wasm-runtime` moves, to 1.2.7, and GitHub's advisory database names no advisory for npm 12.2.2 or for it.
- [ ] 1.4 Record the move in the changelog; verify Prettier and markdownlint pass.

## 2. Verification

- [ ] 2.1 Install every locked tool on fresh stores with `MISE_SAFE=1` and `MISE_LOCKED=1`: with mise 2026.10.25, also with `MISE_ENV=ci`, and with 2026.11.2; verify each install passes and each tool runs.
- [ ] 2.2 Run `npm run check`; verify it passes at or above the coverage floors.
