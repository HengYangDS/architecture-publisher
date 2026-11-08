## 1. Runtime

- [x] 1.1 Bind the repository family to the 0.2.0-beta.6 runtime with the released console's `hook install`, keeping 0.2.0-beta.5 as the rollback; done when the bound runtime reports 0.2.0-beta.6 by the digest Architecture Publications runs and the rollback is the 0.2.0-beta.5 runtime. The released console reports 0.2.0-beta.6 (`727ee0579ba1`, OpenSpec 1.16.0), and `hook install --authorize` from the lane bound the family to runtime `0ca012761d1c`, the digest Architecture Publications runs, with rollback `a4492b26ceca` (0.2.0-beta.5).
- [x] 1.2 Remove GitHub's `forge_repository` and the two command fields from `.ethos/release.toml` with `ethos lane repair-paradigm --apply`, and record `remote.github.forgeRepository` locally when status names it unresolved; done when `ethos status` passes in the lane with no gap and both peers resolve. The repair removed GitHub's `forge_repository`, both command fields and the emptied `[publication]` header; both peers remain declared, and `status` passes with no gap. GitHub's remote is SSH, so its web repository was recorded with `git config --local remote.github.forgeRepository`; the resolver resolves `github` and `gitlab`.

## Workflow follow-up

- Archive this Change and prove the archived head once.
- Publish the archived head as a proposal to GitHub and GitLab and wait for both Forges' review jobs on Linux, macOS and Windows for that exact commit.
- Then land, close out, publish `dev` to GitHub and GitLab, observe its protected jobs, and retire the proposal ref and the lane. `main` stays at v0.10.0 until the next release.
