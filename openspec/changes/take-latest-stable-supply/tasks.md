## 1. Supply

- [x] 1.1 Move the pinned npm to 12.2.3 in `.config/mise/config.toml`, its Mise lock and `devEngines`; done when
      `mise exec --locked -- npm --version` prints 12.2.3 in the lane.
- [x] 1.2 Move `@fission-ai/openspec`, `lucide-static` and the `minimatch` override, then the npm lock at the floor;
      done when the lock's moves equal the measured ones and OSV names no advisory for a moved version.
- [x] 1.3 Keep `@likec4/language-services` at 1.60.0; done when the reason is recorded: the supply guard refused
      1.61.0 on 2026-11-15 for 1.61.0's own changes, and neither the guard nor 1.61.0 has changed since.
- [x] 1.4 Regenerate the icon supply with Lucide 1.74.0; done when the three works' plates are compared before and
      after and every difference is named.
- [x] 1.5 Bind remeda's vendored licence to 2.62.1 in `tools/supply/notices.mjs` and regenerate the LikeC4 supply;
      done when `mise run bootstrap` passes and only the locked versions, digests and bundle bytes change.

## 2. CI

- [x] 2.1 Move the CI's mise to 2026.11.9, mise-action to v5.2.9 by commit and `.config/ci/linux/mise.sha256`, and
      regenerate both workflows; done when the projection check passes and only those lines change.

## 3. Record and verify

- [x] 3.1 Record the move in the Changelog; done when `mise run check` passes in a freshly bootstrapped lane.
      Passed on 2026-11-18 at the committed head: static checks, 541 of 543 tests with 2 skipped and none failed,
      and the packed package.
- [ ] 3.2 Prove the archived head under one host ticket; done when the full proof passes.
